import { describe, expect, it, vi } from "vitest";
import { HealthService } from "./health.service";
import type { PrismaService } from "../prisma/prisma.service";

describe("HealthService", () => {
  it("reports db down when prisma throws", async () => {
    const prisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error("econnrefused")),
    };
    const service = new HealthService(prisma as unknown as PrismaService);
    expect(await service.getHealth()).toEqual({ status: "ok", db: "down" });
  });

  it("reports db up when prisma query succeeds", async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
    };
    const service = new HealthService(prisma as unknown as PrismaService);
    expect(await service.getHealth()).toEqual({ status: "ok", db: "up" });
  });
});
