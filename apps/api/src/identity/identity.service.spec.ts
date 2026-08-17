import { describe, expect, it } from "vitest";
import type { AuditWrite } from "../audit/audit.repository";
import { IdentityHttpError } from "./identity.errors";
import { IdentityService } from "./identity.service";
import type { IdentityRepository, StaffUserRow } from "./identity.repository";
import { hashPassword } from "./password";
import type { StaffRole } from "./roles";

function errCode(fn: () => Promise<unknown>): Promise<string> {
  return fn().then(
    () => {
      throw new Error("expected failure");
    },
    (e: unknown) => {
      expect(e).toBeInstanceOf(IdentityHttpError);
      return ((e as IdentityHttpError).getResponse() as { code: string }).code;
    },
  );
}

function memory(depts: string[] = ["dept-rivon"]) {
  let n = 0;
  const id = () => `id-${++n}`;
  const users: StaffUserRow[] = [];
  const audits: AuditWrite[] = [];
  const repo = {
    users,
    audits,
    async findUserById(userId: string) {
      return users.find((u) => u.id === userId) ?? null;
    },
    async findUserByEmail(email: string) {
      return users.find((u) => u.email === email) ?? null;
    },
    async listUsers() {
      return [...users];
    },
    async createUser(data: {
      email: string;
      name: string;
      role: StaffRole;
      departmentId: string | null;
      passwordHash: string;
    }) {
      const row: StaffUserRow = { id: id(), active: true, ...data };
      users.push(row);
      return row;
    },
    async updateUser(userId: string, data: Partial<StaffUserRow>) {
      const row = users.find((u) => u.id === userId);
      if (!row) throw new Error("missing");
      Object.assign(row, data);
      return row;
    },
    async departmentExists(deptId: string) {
      return depts.includes(deptId);
    },
    async countActiveAdmins() {
      return users.filter((u) => u.role === "ADMIN" && u.active).length;
    },
    async findActiveDh(departmentId: string) {
      return users.find(
        (u) => u.role === "DEPARTMENT_HEAD" && u.active && u.departmentId === departmentId,
      ) ?? null;
    },
    async createSession() {},
    async findSessionByTokenHash() {
      return null;
    },
    async deleteSession() {},
  };
  const audit = {
    async append(entry: AuditWrite) {
      audits.push(entry);
      return entry;
    },
  };
  const prisma = {
    $transaction: async <T>(fn: (tx: object) => Promise<T>) => fn({}),
  };
  const service = new IdentityService(
    repo as unknown as IdentityRepository,
    audit as never,
    prisma as never,
  );
  return { service, users, audits, repo };
}

describe("IdentityService", () => {
  it("rejects inactive login", async () => {
    const { service, users } = memory();
    users.push({
      id: "u1",
      email: "fd@local.test",
      name: "FD",
      role: "FRONT_DESK",
      departmentId: null,
      active: false,
      passwordHash: await hashPassword("password1"),
    });
    expect(
      await errCode(() => service.login({ email: "fd@local.test", password: "password1" })),
    ).toBe("INVALID_CREDENTIALS");
  });

  it("creates a Front Desk user", async () => {
    const { service, users } = memory();
    users.push({
      id: "admin",
      email: "admin@local.test",
      name: "Admin",
      role: "ADMIN",
      departmentId: null,
      active: true,
      passwordHash: "x",
    });
    const created = await service.createUser("admin", {
      name: "Desk",
      email: "fd@local.test",
      password: "password1",
      role: "FRONT_DESK",
    });
    expect(created).toMatchObject({
      email: "fd@local.test",
      role: "FRONT_DESK",
      departmentId: null,
      active: true,
    });
  });

  it("rejects the last Admin deactivate", async () => {
    const { service, users } = memory();
    users.push({
      id: "admin",
      email: "admin@local.test",
      name: "Admin",
      role: "ADMIN",
      departmentId: null,
      active: true,
      passwordHash: "x",
    });
    expect(
      await errCode(() => service.updateUser("admin", "admin", { active: false })),
    ).toBe("LAST_ADMIN");
  });

  it("rejects vacating the sole DH", async () => {
    const { service, users } = memory();
    users.push(
      {
        id: "admin",
        email: "admin@local.test",
        name: "Admin",
        role: "ADMIN",
        departmentId: null,
        active: true,
        passwordHash: "x",
      },
      {
        id: "dh",
        email: "dh@local.test",
        name: "DH",
        role: "DEPARTMENT_HEAD",
        departmentId: "dept-rivon",
        active: true,
        passwordHash: "x",
      },
    );
    expect(
      await errCode(() => service.updateUser("admin", "dh", { active: false })),
    ).toBe("SOLE_DH_VACATE");
    expect(
      await errCode(() => service.updateUser("admin", "dh", { role: "FRONT_DESK" })),
    ).toBe("SOLE_DH_VACATE");
  });

  it("rejects a second active DH", async () => {
    const { service, users } = memory();
    users.push(
      {
        id: "admin",
        email: "admin@local.test",
        name: "Admin",
        role: "ADMIN",
        departmentId: null,
        active: true,
        passwordHash: "x",
      },
      {
        id: "dh",
        email: "dh@local.test",
        name: "DH",
        role: "DEPARTMENT_HEAD",
        departmentId: "dept-rivon",
        active: true,
        passwordHash: "x",
      },
    );
    expect(
      await errCode(() =>
        service.createUser("admin", {
          name: "Other",
          email: "other@local.test",
          password: "password1",
          role: "DEPARTMENT_HEAD",
          departmentId: "dept-rivon",
        }),
      ),
    ).toBe("DH_ALREADY_ASSIGNED");
  });

  it("rejects Admin with a department assignment", async () => {
    const { service, users } = memory();
    users.push({
      id: "admin",
      email: "admin@local.test",
      name: "Admin",
      role: "ADMIN",
      departmentId: null,
      active: true,
      passwordHash: "x",
    });
    expect(
      await errCode(() =>
        service.createUser("admin", {
          name: "Nope",
          email: "nope@local.test",
          password: "password1",
          role: "ADMIN",
          departmentId: "dept-rivon",
        }),
      ),
    ).toBe("DEPARTMENT_NOT_ALLOWED");
  });

  it("replaces a DH in one step", async () => {
    const { service, users, audits } = memory();
    users.push(
      {
        id: "admin",
        email: "admin@local.test",
        name: "Admin",
        role: "ADMIN",
        departmentId: null,
        active: true,
        passwordHash: "x",
      },
      {
        id: "dh",
        email: "dh@local.test",
        name: "DH",
        role: "DEPARTMENT_HEAD",
        departmentId: "dept-rivon",
        active: true,
        passwordHash: "x",
      },
      {
        id: "fd",
        email: "fd@local.test",
        name: "FD",
        role: "FRONT_DESK",
        departmentId: null,
        active: true,
        passwordHash: "x",
      },
    );
    const result = await service.replaceDh("admin", {
      departmentId: "dept-rivon",
      incomingUserId: "fd",
      outgoingUserId: "dh",
      outgoingRole: "FRONT_DESK",
      outgoingActive: true,
    });
    expect(result.incoming).toMatchObject({
      id: "fd",
      role: "DEPARTMENT_HEAD",
      departmentId: "dept-rivon",
    });
    expect(result.outgoing).toMatchObject({ id: "dh", role: "FRONT_DESK", departmentId: null });
    expect(audits.map((a) => a.action)).toContain("STAFF_DH_REPLACED");
    expect(users.filter((u) => u.role === "DEPARTMENT_HEAD" && u.active)).toHaveLength(1);
  });

  it("rejects a short password", async () => {
    const { service, users } = memory();
    users.push({
      id: "admin",
      email: "admin@local.test",
      name: "Admin",
      role: "ADMIN",
      departmentId: null,
      active: true,
      passwordHash: "x",
    });
    expect(
      await errCode(() =>
        service.createUser("admin", {
          name: "X",
          email: "x@local.test",
          password: "short",
          role: "FRONT_DESK",
        }),
      ),
    ).toBe("PASSWORD_TOO_SHORT");
  });
});
