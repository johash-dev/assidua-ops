import { Inject, Injectable } from "@nestjs/common";
import type { StaffRole as PrismaStaffRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { Db } from "../audit/audit.repository";
import type { StaffRole } from "./roles";

export type StaffUserRow = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  departmentId: string | null;
  active: boolean;
  passwordHash: string;
};

export type SessionRow = {
  id: string;
  staffUserId: string;
  tokenHash: string;
  expiresAt: Date;
  user: StaffUserRow;
};

function asRow(u: {
  id: string;
  email: string;
  name: string;
  role: PrismaStaffRole;
  departmentId: string | null;
  active: boolean;
  passwordHash: string;
}): StaffUserRow {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    departmentId: u.departmentId,
    active: u.active,
    passwordHash: u.passwordHash,
  };
}

@Injectable()
export class IdentityRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findUserById(id: string, db: Db = this.prisma): Promise<StaffUserRow | null> {
    const u = await db.staffUser.findUnique({ where: { id } });
    return u ? asRow(u) : null;
  }

  async findUserByEmail(email: string, db: Db = this.prisma): Promise<StaffUserRow | null> {
    const u = await db.staffUser.findUnique({ where: { email } });
    return u ? asRow(u) : null;
  }

  async listUsers(db: Db = this.prisma): Promise<StaffUserRow[]> {
    const rows = await db.staffUser.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map(asRow);
  }

  async createUser(
    data: {
      email: string;
      name: string;
      role: StaffRole;
      departmentId: string | null;
      passwordHash: string;
    },
    db: Db = this.prisma,
  ): Promise<StaffUserRow> {
    const u = await db.staffUser.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        departmentId: data.departmentId,
        passwordHash: data.passwordHash,
      },
    });
    return asRow(u);
  }

  async updateUser(
    id: string,
    data: {
      email?: string;
      name?: string;
      role?: StaffRole;
      departmentId?: string | null;
      active?: boolean;
      passwordHash?: string;
    },
    db: Db = this.prisma,
  ): Promise<StaffUserRow> {
    const u = await db.staffUser.update({ where: { id }, data });
    return asRow(u);
  }

  async departmentExists(id: string, db: Db = this.prisma): Promise<boolean> {
    const d = await db.department.findUnique({ where: { id }, select: { id: true } });
    return Boolean(d);
  }

  async countActiveAdmins(db: Db = this.prisma): Promise<number> {
    return db.staffUser.count({ where: { role: "ADMIN", active: true } });
  }

  async findActiveDh(departmentId: string, db: Db = this.prisma): Promise<StaffUserRow | null> {
    const u = await db.staffUser.findFirst({
      where: { departmentId, role: "DEPARTMENT_HEAD", active: true },
    });
    return u ? asRow(u) : null;
  }

  async createSession(
    data: { staffUserId: string; tokenHash: string; expiresAt: Date },
    db: Db = this.prisma,
  ): Promise<void> {
    await db.staffSession.create({ data });
  }

  async findSessionByTokenHash(tokenHash: string): Promise<SessionRow | null> {
    const s = await this.prisma.staffSession.findUnique({
      where: { tokenHash },
      include: { staffUser: true },
    });
    if (!s) return null;
    return {
      id: s.id,
      staffUserId: s.staffUserId,
      tokenHash: s.tokenHash,
      expiresAt: s.expiresAt,
      user: asRow(s.staffUser),
    };
  }

  async deleteSession(id: string): Promise<void> {
    await this.prisma.staffSession.delete({ where: { id } }).catch(() => undefined);
  }
}
