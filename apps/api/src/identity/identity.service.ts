import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditRepository } from "../audit/audit.repository";
import { PrismaService } from "../prisma/prisma.service";
import { identityFail } from "./identity.errors";
import { IdentityRepository, type StaffUserRow } from "./identity.repository";
import { hashPassword, verifyPassword } from "./password";
import { STAFF_ROLES, type Principal, type StaffRole } from "./roles";
import {
  hashSessionToken,
  newSessionToken,
  SESSION_TTL_SEC,
} from "./session-token";

function toPublic(u: StaffUserRow): Principal {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    departmentId: u.role === "DEPARTMENT_HEAD" ? u.departmentId : null,
    active: u.active,
  };
}

function hasKey(body: unknown, key: string): boolean {
  return Boolean(body) && typeof body === "object" && key in (body as object);
}

function readString(body: unknown, key: string, required: boolean): string | undefined {
  if (!hasKey(body, key)) {
    if (required) identityFail(400, "VALIDATION", `${key} is required`);
    return undefined;
  }
  const raw = (body as Record<string, unknown>)[key];
  if (typeof raw !== "string") identityFail(400, "VALIDATION", `${key} is required`);
  const v = raw.trim();
  if (!v) identityFail(400, "VALIDATION", `${key} is required`);
  return v;
}

function readBoolean(body: unknown, key: string): boolean {
  const raw = (body as Record<string, unknown>)[key];
  if (typeof raw !== "boolean") identityFail(400, "VALIDATION", `${key} must be boolean`);
  return raw;
}

function readRole(raw: string): StaffRole {
  const role = raw.toUpperCase().replace(/ /g, "_") as StaffRole;
  if (!(STAFF_ROLES as readonly string[]).includes(role)) {
    identityFail(400, "VALIDATION", "Invalid role");
  }
  return role;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable()
export class IdentityService {
  constructor(
    @Inject(IdentityRepository) private readonly repo: IdentityRepository,
    @Inject(AuditRepository) private readonly audit: AuditRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async login(body: unknown): Promise<{ user: Principal; token: string }> {
    const email = normalizeEmail(readString(body, "email", true)!);
    const password = readString(body, "password", true)!;
    const user = await this.repo.findUserByEmail(email);
    if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
      identityFail(401, "INVALID_CREDENTIALS", "Sign-in rejected");
    }
    const token = newSessionToken();
    await this.repo.createSession({
      staffUserId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_SEC * 1000),
    });
    return { user: toPublic(user), token };
  }

  async logout(sessionId: string): Promise<void> {
    await this.repo.deleteSession(sessionId);
  }

  async principalFromToken(token: string): Promise<{ principal: Principal; sessionId: string }> {
    const session = await this.repo.findSessionByTokenHash(hashSessionToken(token));
    if (!session || session.expiresAt.getTime() <= Date.now() || !session.user.active) {
      if (session) await this.repo.deleteSession(session.id);
      identityFail(401, "UNAUTHORIZED", "Authentication required");
    }
    return { principal: toPublic(session.user), sessionId: session.id };
  }

  listUsers(): Promise<{ users: Principal[] }> {
    return this.repo.listUsers().then((rows) => ({ users: rows.map(toPublic) }));
  }

  async createUser(actorUserId: string, body: unknown): Promise<Principal> {
    const name = readString(body, "name", true)!;
    const email = normalizeEmail(readString(body, "email", true)!);
    const password = readString(body, "password", true)!;
    if (password.length < 8) {
      identityFail(400, "PASSWORD_TOO_SHORT", "Password must be at least 8 characters");
    }
    const role = readRole(readString(body, "role", true)!);
    const departmentId = await this.readDepartmentId(body, role, true);
    await this.assertCreateOccupancy(role, departmentId);
    if (await this.repo.findUserByEmail(email)) {
      identityFail(409, "EMAIL_DUPLICATE", "Email already in use");
    }
    const passwordHash = await hashPassword(password);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await this.repo.createUser(
          { email, name, role, departmentId, passwordHash },
          tx,
        );
        await this.audit.append(
          {
            actorUserId,
            action: "STAFF_USER_CREATED",
            entityType: "StaffUser",
            entityId: user.id,
            departmentId,
          },
          tx,
        );
        return toPublic(user);
      });
    } catch (e) {
      this.rethrowUnique(e);
    }
  }

  async updateUser(actorUserId: string, id: string, body: unknown): Promise<Principal> {
    const current = await this.repo.findUserById(id);
    if (!current) identityFail(404, "VALIDATION", "User not found");
    const next: StaffUserRow = { ...current };
    if (hasKey(body, "name")) next.name = readString(body, "name", true)!;
    if (hasKey(body, "email")) next.email = normalizeEmail(readString(body, "email", true)!);
    if (hasKey(body, "role")) next.role = readRole(readString(body, "role", true)!);
    if (hasKey(body, "active")) next.active = readBoolean(body, "active");
    if (next.role !== "DEPARTMENT_HEAD") {
      next.departmentId = null;
    } else if (hasKey(body, "departmentId")) {
      next.departmentId = await this.readDepartmentId(body, next.role, false);
    } else if (!next.departmentId) {
      identityFail(400, "DH_DEPARTMENT_REQUIRED", "Department head requires a department");
    } else if (!(await this.repo.departmentExists(next.departmentId))) {
      identityFail(400, "VALIDATION", "Department not found");
    }
    let passwordHash: string | undefined;
    if (hasKey(body, "password")) {
      const password = readString(body, "password", true)!;
      if (password.length < 8) {
        identityFail(400, "PASSWORD_TOO_SHORT", "Password must be at least 8 characters");
      }
      passwordHash = await hashPassword(password);
    }
    this.assertRoleShape(next);
    await this.assertLastAdmin(current, next);
    await this.assertDhOccupancy(current, next);
    if (next.email !== current.email && (await this.repo.findUserByEmail(next.email))) {
      identityFail(409, "EMAIL_DUPLICATE", "Email already in use");
    }
    const action = auditAction(current, next);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await this.repo.updateUser(
          id,
          {
            name: next.name,
            email: next.email,
            role: next.role,
            departmentId: next.departmentId,
            active: next.active,
            passwordHash,
          },
          tx,
        );
        await this.audit.append(
          {
            actorUserId,
            action,
            entityType: "StaffUser",
            entityId: user.id,
            departmentId: user.departmentId,
          },
          tx,
        );
        return toPublic(user);
      });
    } catch (e) {
      this.rethrowUnique(e);
    }
  }

  async replaceDh(actorUserId: string, body: unknown): Promise<{ incoming: Principal; outgoing: Principal }> {
    const departmentId = readString(body, "departmentId", true)!;
    const incomingUserId = readString(body, "incomingUserId", true)!;
    const outgoingUserId = readString(body, "outgoingUserId", true)!;
    if (incomingUserId === outgoingUserId) identityFail(400, "VALIDATION", "Incoming and outgoing must differ");
    if (!(await this.repo.departmentExists(departmentId))) {
      identityFail(400, "VALIDATION", "Department not found");
    }
    const outgoingActive = hasKey(body, "outgoingActive")
      ? readBoolean(body, "outgoingActive")
      : true;
    const outgoingRoleRaw = hasKey(body, "outgoingRole")
      ? readString(body, "outgoingRole", false)
      : undefined;
    const outgoingRole: StaffRole | null = outgoingActive
      ? readRole(outgoingRoleRaw ?? "FRONT_DESK")
      : outgoingRoleRaw
        ? readRole(outgoingRoleRaw)
        : null;
    if (outgoingActive && outgoingRole === "DEPARTMENT_HEAD") {
      identityFail(400, "VALIDATION", "Outgoing DH must leave the department");
    }
    const incoming = await this.repo.findUserById(incomingUserId);
    const outgoing = await this.repo.findUserById(outgoingUserId);
    if (!incoming || !outgoing) identityFail(404, "VALIDATION", "User not found");
    const currentDh = await this.repo.findActiveDh(departmentId);
    if (!currentDh || currentDh.id !== outgoing.id) {
      identityFail(409, "SOLE_DH_VACATE", "Outgoing user is not the active DH for this department");
    }
    if (incoming.active && incoming.role === "DEPARTMENT_HEAD" && incoming.departmentId !== departmentId) {
      identityFail(409, "SOLE_DH_VACATE", "Incoming user is DH of another department");
    }
    const incomingNext: StaffUserRow = {
      ...incoming,
      role: "DEPARTMENT_HEAD",
      departmentId,
      active: true,
    };
    const outgoingNext: StaffUserRow = {
      ...outgoing,
      role: outgoingActive ? (outgoingRole as StaffRole) : outgoing.role,
      departmentId: null,
      active: outgoingActive,
    };
    if (outgoingActive) this.assertRoleShape(outgoingNext);
    this.assertRoleShape(incomingNext);
    await this.assertLastAdmin(incoming, incomingNext);
    if (outgoingActive && outgoingNext.role === "ADMIN") {
      // fine — adding an Admin
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const out = await this.repo.updateUser(
          outgoing.id,
          {
            role: outgoingNext.role,
            departmentId: null,
            active: outgoingNext.active,
          },
          tx,
        );
        const inn = await this.repo.updateUser(
          incoming.id,
          {
            role: "DEPARTMENT_HEAD",
            departmentId,
            active: true,
          },
          tx,
        );
        await this.audit.append(
          {
            actorUserId,
            action: "STAFF_DH_REPLACED",
            entityType: "Department",
            entityId: departmentId,
            departmentId,
            metadata: {
              incomingUserId: incoming.id,
              outgoingUserId: outgoing.id,
              outgoingRole: outgoingNext.role,
              outgoingActive: outgoingNext.active,
            },
          },
          tx,
        );
        return { incoming: toPublic(inn), outgoing: toPublic(out) };
      });
    } catch (e) {
      this.rethrowUnique(e);
    }
  }

  private async readDepartmentId(
    body: unknown,
    role: StaffRole,
    creating: boolean,
  ): Promise<string | null> {
    const raw = hasKey(body, "departmentId")
      ? (body as Record<string, unknown>).departmentId
      : undefined;
    if (role === "DEPARTMENT_HEAD") {
      if (typeof raw !== "string" || !raw.trim()) {
        identityFail(400, "DH_DEPARTMENT_REQUIRED", "Department head requires a department");
      }
      if (!(await this.repo.departmentExists(raw.trim()))) {
        identityFail(400, "VALIDATION", "Department not found");
      }
      return raw.trim();
    }
    if (raw != null && raw !== "") {
      identityFail(400, "DEPARTMENT_NOT_ALLOWED", "Only a department head may have a department");
    }
    void creating;
    return null;
  }

  private assertRoleShape(user: StaffUserRow): void {
    if (user.role === "DEPARTMENT_HEAD" && !user.departmentId) {
      identityFail(400, "DH_DEPARTMENT_REQUIRED", "Department head requires a department");
    }
    if (user.role !== "DEPARTMENT_HEAD" && user.departmentId) {
      identityFail(400, "DEPARTMENT_NOT_ALLOWED", "Only a department head may have a department");
    }
    if (user.role === "ADMIN" && user.departmentId) {
      identityFail(409, "ROLE_CONFLICT", "Admin cannot also be a department head");
    }
  }

  private async assertCreateOccupancy(role: StaffRole, departmentId: string | null): Promise<void> {
    if (role === "DEPARTMENT_HEAD" && departmentId) {
      const existing = await this.repo.findActiveDh(departmentId);
      if (existing) identityFail(409, "DH_ALREADY_ASSIGNED", "Department already has an active DH");
    }
  }

  private async assertLastAdmin(current: StaffUserRow, next: StaffUserRow): Promise<void> {
    const wasAdmin = current.role === "ADMIN" && current.active;
    const staysAdmin = next.role === "ADMIN" && next.active;
    if (wasAdmin && !staysAdmin) {
      const n = await this.repo.countActiveAdmins();
      if (n <= 1) identityFail(409, "LAST_ADMIN", "Cannot remove the last active Admin");
    }
  }

  private async assertDhOccupancy(current: StaffUserRow, next: StaffUserRow): Promise<void> {
    const wasDh = current.role === "DEPARTMENT_HEAD" && current.active && current.departmentId;
    const staysDh =
      next.role === "DEPARTMENT_HEAD" && next.active && next.departmentId === current.departmentId;
    if (wasDh && !staysDh && current.departmentId) {
      identityFail(409, "SOLE_DH_VACATE", "Replace the department head in one step");
    }
    if (next.role === "DEPARTMENT_HEAD" && next.active && next.departmentId) {
      const existing = await this.repo.findActiveDh(next.departmentId);
      if (existing && existing.id !== current.id) {
        identityFail(409, "DH_ALREADY_ASSIGNED", "Department already has an active DH");
      }
    }
    this.assertRoleShape(next);
  }

  private rethrowUnique(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = (e.meta?.target as string[] | string | undefined) ?? [];
      const fields = Array.isArray(target) ? target : [String(target)];
      if (fields.some((f) => f.includes("email"))) {
        identityFail(409, "EMAIL_DUPLICATE", "Email already in use");
      }
      identityFail(409, "DH_ALREADY_ASSIGNED", "Department already has an active DH");
    }
    throw e;
  }
}

function auditAction(current: StaffUserRow, next: StaffUserRow): string {
  if (current.active && !next.active) return "STAFF_USER_DEACTIVATED";
  if (current.role !== next.role || current.departmentId !== next.departmentId) {
    return "STAFF_USER_ROLE_CHANGED";
  }
  return "STAFF_USER_EDITED";
}
