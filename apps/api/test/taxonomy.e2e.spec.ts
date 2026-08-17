import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { seedTaxonomy } from "../src/taxonomy/taxonomy.seed";

const admin = { "x-test-role": "ADMIN" };

describe("taxonomy HTTP", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const prisma = new PrismaClient();
    try {
      await seedTaxonomy(prisma);
    } finally {
      await prisma.$disconnect();
    }
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 401 without a principal", async () => {
    const res = await request(app.getHttpServer()).get("/api/taxonomy").expect(401);
    expect(res.body).toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns the seeded tree for Admin", async () => {
    const res = await request(app.getHttpServer()).get("/api/taxonomy").set(admin).expect(200);
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
    for (const role of ["DEPARTMENT_HEAD", "FRONT_DESK", "COORDINATOR"]) {
      const res = await request(app.getHttpServer())
        .post("/api/departments")
        .set({ "x-test-role": role })
        .send({ name: "Nope", defaultSlaDays: 10 })
        .expect(403);
      expect(res.body).toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("Admin creates a department and rejects SLA < 1", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/departments")
      .set(admin)
      .send({ name: "HTTP Dept", defaultSlaDays: 7 })
      .expect(201);
    expect(created.body).toMatchObject({ name: "HTTP Dept", defaultSlaDays: 7, active: true });
    const bad = await request(app.getHttpServer())
      .patch(`/api/departments/${created.body.id}`)
      .set(admin)
      .send({ defaultSlaDays: 0 })
      .expect(400);
    expect(bad.body).toMatchObject({ code: "SLA_DAYS_INVALID" });
  });

  it("Admin creates a leaf and non-Admin GET omits inactive", async () => {
    const tree = await request(app.getHttpServer()).get("/api/taxonomy").set(admin).expect(200);
    const rover = tree.body.departments.find((d: { name: string }) => d.name === "Rover");
    const leaf = await request(app.getHttpServer())
      .post("/api/categories")
      .set(admin)
      .send({ name: "HTTP Leaf", departmentId: rover.id, isLeaf: true })
      .expect(201);
    expect(leaf.body).toMatchObject({ name: "HTTP Leaf", isLeaf: true, departmentId: rover.id });
    await request(app.getHttpServer())
      .patch(`/api/categories/${leaf.body.id}`)
      .set(admin)
      .send({ active: false })
      .expect(200);
    const fd = await request(app.getHttpServer())
      .get("/api/taxonomy")
      .set({ "x-test-role": "FRONT_DESK" })
      .expect(200);
    const roverFd = fd.body.departments.find((d: { name: string }) => d.name === "Rover");
    const names = (roverFd?.categories ?? []).map((c: { name: string }) => c.name);
    expect(names).not.toContain("HTTP Leaf");
    expect(names).toContain("Bike");
  });
});
