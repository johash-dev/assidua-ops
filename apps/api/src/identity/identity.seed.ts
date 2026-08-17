import { PrismaClient } from "@prisma/client";
import { hashPassword } from "./password";

function reqEnv(name: string): string {
  const v = process.env[name]?.trim() ?? "";
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

async function upsertUser(
  prisma: PrismaClient,
  data: {
    email: string;
    name: string;
    password: string;
    role: "ADMIN" | "DEPARTMENT_HEAD";
    departmentId: string | null;
  },
): Promise<void> {
  if (data.password.length < 8) {
    throw new Error(`Seed password for ${data.email} must be at least 8 characters`);
  }
  const existing = await prisma.staffUser.findUnique({ where: { email: data.email } });
  if (existing) return;
  await prisma.staffUser.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      departmentId: data.departmentId,
      passwordHash: await hashPassword(data.password),
      active: true,
    },
  });
}

export async function seedIdentity(prisma: PrismaClient): Promise<void> {
  const rivon = await prisma.department.findFirst({ where: { name: "Rivon" } });
  const rover = await prisma.department.findFirst({ where: { name: "Rover" } });
  const assidua = await prisma.department.findFirst({ where: { name: "Assidua" } });
  if (!rivon || !rover || !assidua) {
    throw new Error("Seed identity requires Rivon, Rover, and Assidua departments");
  }
  await upsertUser(prisma, {
    email: reqEnv("SEED_ADMIN_EMAIL").toLowerCase(),
    name: reqEnv("SEED_ADMIN_NAME"),
    password: reqEnv("SEED_ADMIN_PASSWORD"),
    role: "ADMIN",
    departmentId: null,
  });
  await upsertUser(prisma, {
    email: reqEnv("SEED_DH_RIVON_EMAIL").toLowerCase(),
    name: reqEnv("SEED_DH_RIVON_NAME"),
    password: reqEnv("SEED_DH_RIVON_PASSWORD"),
    role: "DEPARTMENT_HEAD",
    departmentId: rivon.id,
  });
  await upsertUser(prisma, {
    email: reqEnv("SEED_DH_ROVER_EMAIL").toLowerCase(),
    name: reqEnv("SEED_DH_ROVER_NAME"),
    password: reqEnv("SEED_DH_ROVER_PASSWORD"),
    role: "DEPARTMENT_HEAD",
    departmentId: rover.id,
  });
  await upsertUser(prisma, {
    email: reqEnv("SEED_DH_ASSIDUA_EMAIL").toLowerCase(),
    name: reqEnv("SEED_DH_ASSIDUA_NAME"),
    password: reqEnv("SEED_DH_ASSIDUA_PASSWORD"),
    role: "DEPARTMENT_HEAD",
    departmentId: assidua.id,
  });
}
