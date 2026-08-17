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

describe("taxonomy HTTP", () => {
  let app: INestApplication;
  let adminCookie = "";
  let dhCookie = "";

  beforeAll(async () => {
    const prisma = new PrismaClient();
    try {
      await seedTaxonomy(prisma);
      await seedIdentity(prisma);
    } finally {
      await prisma.$disconnect();
    }
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
    const admin = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: process.env.SEED_ADMIN_EMAIL,
        password: process.env.SEED_ADMIN_PASSWORD,
      })
      .expect(200);
    adminCookie = cookieOf(admin);
    const dh = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: process.env.SEED_DH_RIVON_EMAIL,
        password: process.env.SEED_DH_RIVON_PASSWORD,
      })
      .expect(200);
    dhCookie = cookieOf(dh);
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 401 without a principal", async () => {
    const res = await request(app.getHttpServer()).get("/api/taxonomy").expect(401);
    expect(res.body).toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns the seeded tree for Admin", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/taxonomy")
      .set("Cookie", adminCookie)
      .expect(200);
    const names = (res.body.departments as { name: string }[]).map((d) => d.name);
    expect(names).toEqual(expect.arrayContaining(["Rivon", "Rover", "Assidua"]));
    const assidua = res.body.departments.find((d: { name: string }) => d.name === "Assidua");
    const top = (assidua.categories as { name: string; isLeaf: boolean; children: unknown[] }[]).map(
      (c) => c.name,
    );
    expect(top).toEqual(expect.arrayContaining(["A/C", "UPS", "Smart Board", "Home Appliances"]));
    const home = assidua.categories.find((c: { name: string }) => c.name === "Home Appliances");
    expect(home.isLeaf).toBe(false);
    expect(home.children.map((c: { name: string }) => c.name)).toEqual(
      expect.arrayContaining(["Tv", "Washing Machine", "Fridge"]),
    );
    const rivon = res.body.departments.find((d: { name: string }) => d.name === "Rivon");
    expect(rivon.defaultSlaDays).toBe(10);
    expect(rivon.categories).toEqual([
      expect.objectContaining({ name: "Car", isLeaf: true, active: true }),
    ]);
  });

  it("rejects non-Admin mutations", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/departments")
      .set("Cookie", dhCookie)
      .send({ name: "Nope", defaultSlaDays: 10 })
      .expect(403);
    expect(res.body).toMatchObject({ code: "FORBIDDEN" });
  });

  it("Admin creates a department and rejects SLA < 1", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/departments")
      .set("Cookie", adminCookie)
      .send({ name: "HTTP Dept", defaultSlaDays: 7 })
      .expect(201);
    expect(created.body).toMatchObject({ name: "HTTP Dept", defaultSlaDays: 7, active: true });
    const bad = await request(app.getHttpServer())
      .patch(`/api/departments/${created.body.id}`)
      .set("Cookie", adminCookie)
      .send({ defaultSlaDays: 0 })
      .expect(400);
    expect(bad.body).toMatchObject({ code: "SLA_DAYS_INVALID" });
  });

  it("Admin creates a leaf and non-Admin GET omits inactive", async () => {
    const tree = await request(app.getHttpServer())
      .get("/api/taxonomy")
      .set("Cookie", adminCookie)
      .expect(200);
    const rover = tree.body.departments.find((d: { name: string }) => d.name === "Rover");
    const leaf = await request(app.getHttpServer())
      .post("/api/categories")
      .set("Cookie", adminCookie)
      .send({ name: "HTTP Leaf", departmentId: rover.id, isLeaf: true })
      .expect(201);
    expect(leaf.body).toMatchObject({ name: "HTTP Leaf", isLeaf: true, departmentId: rover.id });
    await request(app.getHttpServer())
      .patch(`/api/categories/${leaf.body.id}`)
      .set("Cookie", adminCookie)
      .send({ active: false })
      .expect(200);
    const fd = await request(app.getHttpServer())
      .get("/api/taxonomy")
      .set("Cookie", dhCookie)
      .expect(200);
    const roverFd = fd.body.departments.find((d: { name: string }) => d.name === "Rover");
    const names = (roverFd?.categories ?? []).map((c: { name: string }) => c.name);
    expect(names).not.toContain("HTTP Leaf");
    expect(names).toContain("Bike");
  });
});
