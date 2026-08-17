import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { seedIdentity } from "../src/identity/identity.seed";
import { seedTaxonomy } from "../src/taxonomy/taxonomy.seed";

function cookieOf(res: request.Response): string {
  const raw = res.headers["set-cookie"];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list.map((c) => c.split(";")[0]).join("; ");
}

describe("identity HTTP", () => {
  let app: INestApplication;
  let adminCookie = "";
  let rivonId = "";

  beforeAll(async () => {
    const prisma = new PrismaClient();
    try {
      await seedTaxonomy(prisma);
      await seedIdentity(prisma);
      const rivon = await prisma.department.findFirst({ where: { name: "Rivon" } });
      rivonId = rivon?.id ?? "";
    } finally {
      await prisma.$disconnect();
    }
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: process.env.SEED_ADMIN_EMAIL,
        password: process.env.SEED_ADMIN_PASSWORD,
      })
      .expect(200);
    adminCookie = cookieOf(login);
  });

  afterAll(async () => {
    await app.close();
  });

  it("accepts loopback Origin alias and rejects a foreign Origin", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .set("Origin", "http://127.0.0.1:4000")
      .send({
        email: process.env.SEED_ADMIN_EMAIL,
        password: process.env.SEED_ADMIN_PASSWORD,
      })
      .expect(200);
    const foreign = await request(app.getHttpServer())
      .post("/api/auth/login")
      .set("Origin", "http://evil.test:4000")
      .send({
        email: process.env.SEED_ADMIN_EMAIL,
        password: process.env.SEED_ADMIN_PASSWORD,
      })
      .expect(403);
    expect(foreign.body).toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects bad login and has no session", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: process.env.SEED_ADMIN_EMAIL, password: "wrong-password" })
      .expect(401);
    expect(res.body).toMatchObject({ code: "INVALID_CREDENTIALS" });
    await request(app.getHttpServer()).get("/api/auth/me").expect(401);
  });

  it("establishes a session and logs out", async () => {
    const me = await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Cookie", adminCookie)
      .expect(200);
    expect(me.body).toMatchObject({
      email: (process.env.SEED_ADMIN_EMAIL ?? "").toLowerCase(),
      role: "ADMIN",
      departmentId: null,
    });
    await request(app.getHttpServer())
      .post("/api/auth/logout")
      .set("Cookie", adminCookie)
      .expect(200);
    await request(app.getHttpServer()).get("/api/auth/me").set("Cookie", adminCookie).expect(401);
    const again = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: process.env.SEED_ADMIN_EMAIL,
        password: process.env.SEED_ADMIN_PASSWORD,
      })
      .expect(200);
    adminCookie = cookieOf(again);
  });

  it("creates a Front Desk user who can sign in; non-Admin cannot manage users", async () => {
    const email = `fd-${Date.now()}@local.test`;
    const created = await request(app.getHttpServer())
      .post("/api/staff-users")
      .set("Cookie", adminCookie)
      .send({ name: "Front Desk", email, password: "password1", role: "FRONT_DESK" })
      .expect(201);
    expect(created.body).toMatchObject({ email, role: "FRONT_DESK", departmentId: null });
    expect(created.body.passwordHash).toBeUndefined();
    const fdLogin = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email, password: "password1" })
      .expect(200);
    const fdCookie = cookieOf(fdLogin);
    expect(fdLogin.body).toMatchObject({ role: "FRONT_DESK" });
    const denied = await request(app.getHttpServer())
      .get("/api/staff-users")
      .set("Cookie", fdCookie)
      .expect(403);
    expect(denied.body).toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects vacating the sole DH and allows one-step replacement", async () => {
    const dept = await request(app.getHttpServer())
      .post("/api/departments")
      .set("Cookie", adminCookie)
      .send({ name: `DH-dept-${Date.now()}`, defaultSlaDays: 10 })
      .expect(201);
    const outgoing = await request(app.getHttpServer())
      .post("/api/staff-users")
      .set("Cookie", adminCookie)
      .send({
        name: "Outgoing DH",
        email: `out-${Date.now()}@local.test`,
        password: "password1",
        role: "DEPARTMENT_HEAD",
        departmentId: dept.body.id,
      })
      .expect(201);
    const incoming = await request(app.getHttpServer())
      .post("/api/staff-users")
      .set("Cookie", adminCookie)
      .send({
        name: "Incoming DH",
        email: `in-${Date.now()}@local.test`,
        password: "password1",
        role: "COORDINATOR",
      })
      .expect(201);
    const vacate = await request(app.getHttpServer())
      .patch(`/api/staff-users/${outgoing.body.id}`)
      .set("Cookie", adminCookie)
      .send({ active: false })
      .expect(409);
    expect(vacate.body).toMatchObject({ code: "SOLE_DH_VACATE" });
    const replaced = await request(app.getHttpServer())
      .post("/api/staff-users/dh-replace")
      .set("Cookie", adminCookie)
      .send({
        departmentId: dept.body.id,
        incomingUserId: incoming.body.id,
        outgoingUserId: outgoing.body.id,
        outgoingRole: "FRONT_DESK",
        outgoingActive: true,
      })
      .expect(200);
    expect(replaced.body.incoming).toMatchObject({
      id: incoming.body.id,
      role: "DEPARTMENT_HEAD",
      departmentId: dept.body.id,
    });
    expect(replaced.body.outgoing).toMatchObject({
      id: outgoing.body.id,
      role: "FRONT_DESK",
      departmentId: null,
    });
  });

  it("writes an audit row on user create", async () => {
    const prisma = new PrismaClient();
    try {
      const n = await prisma.auditEntry.count({ where: { action: "STAFF_USER_CREATED" } });
      expect(n).toBeGreaterThan(0);
    } finally {
      await prisma.$disconnect();
    }
  });

  it("seeded M35 DHs exist", async () => {
    expect(rivonId).toBeTruthy();
    const list = await request(app.getHttpServer())
      .get("/api/staff-users")
      .set("Cookie", adminCookie)
      .expect(200);
    const emails = [
      process.env.SEED_DH_RIVON_EMAIL,
      process.env.SEED_DH_ROVER_EMAIL,
      process.env.SEED_DH_ASSIDUA_EMAIL,
    ].map((e) => (e ?? "").toLowerCase());
    const seeded = (list.body.users as { email: string; role: string; active: boolean }[]).filter(
      (u) => emails.includes(u.email) && u.role === "DEPARTMENT_HEAD" && u.active,
    );
    expect(seeded).toHaveLength(3);
  });
});
