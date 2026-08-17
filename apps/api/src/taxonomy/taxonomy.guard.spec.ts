import { describe, expect, it } from "vitest";
import { readTestRole } from "./taxonomy.guard";

describe("readTestRole", () => {
  const headers = { "x-test-role": "ADMIN" };

  it("accepts ADMIN in test", () => {
    expect(readTestRole(headers, "test")).toBe("ADMIN");
  });

  it("accepts ADMIN in development", () => {
    expect(readTestRole(headers, "development")).toBe("ADMIN");
  });

  it("ignores the header in production", () => {
    expect(readTestRole(headers, "production")).toBeUndefined();
  });

  it("ignores the header when env is not development or test", () => {
    expect(readTestRole(headers, "")).toBeUndefined();
    expect(readTestRole(headers, "staging")).toBeUndefined();
  });
});
