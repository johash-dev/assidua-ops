import { describe, expect, it } from "vitest";
import { hashSessionToken, isAllowedWebOrigin, newSessionToken, parseCookie } from "./session-token";

describe("session-token", () => {
  it("HMACs a token stably", () => {
    const token = newSessionToken();
    const a = hashSessionToken(token, "test-session-secret-min-32-chars-long");
    const b = hashSessionToken(token, "test-session-secret-min-32-chars-long");
    expect(a).toBe(b);
    expect(a).not.toBe(hashSessionToken("other", "test-session-secret-min-32-chars-long"));
  });

  it("parses a cookie header", () => {
    expect(parseCookie("a=1; assidua_session=abc; b=2", "assidua_session")).toBe("abc");
    expect(parseCookie("x=y", "assidua_session")).toBeUndefined();
  });

  it("treats localhost and 127.0.0.1 as the same web origin", () => {
    const prev = process.env.WEB_ORIGIN;
    process.env.WEB_ORIGIN = "http://localhost:4000";
    try {
      expect(isAllowedWebOrigin("http://localhost:4000")).toBe(true);
      expect(isAllowedWebOrigin("http://127.0.0.1:4000")).toBe(true);
      expect(isAllowedWebOrigin("http://127.0.0.1:4001")).toBe(false);
      expect(isAllowedWebOrigin("http://evil.test:4000")).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.WEB_ORIGIN;
      else process.env.WEB_ORIGIN = prev;
    }
  });
});
