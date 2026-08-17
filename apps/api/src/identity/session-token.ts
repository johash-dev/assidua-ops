import { createHmac, randomBytes } from "node:crypto";

export const SESSION_COOKIE = "assidua_session";
export const SESSION_TTL_SEC = 12 * 60 * 60;

export function requireSessionSecret(): string {
  const s = process.env.SESSION_SECRET ?? "";
  if (s.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }
  return s;
}

export function newSessionToken(): string {
  return randomBytes(16).toString("hex");
}

export function hashSessionToken(token: string, secret = requireSessionSecret()): string {
  return createHmac("sha256", secret).update(token).digest("hex");
}

export function parseCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq) === name) return trimmed.slice(eq + 1);
  }
  return undefined;
}

export function serializeSessionCookie(token: string, maxAgeSec: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  if (maxAgeSec <= 0) {
    return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
  }
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}

export function allowedWebOrigin(): string {
  return (process.env.WEB_ORIGIN ?? "http://localhost:4000").replace(/\/$/, "");
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function originHost(hostname: string): string {
  return hostname.replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
}

function originPort(url: URL): string {
  if (url.port) return url.port;
  return url.protocol === "https:" ? "443" : "80";
}

/** WEB_ORIGIN plus loopback aliases (localhost ↔ 127.0.0.1) on the same protocol and port. */
export function isAllowedWebOrigin(origin: string): boolean {
  const got = origin.replace(/\/$/, "");
  const allowed = allowedWebOrigin();
  if (got === allowed) return true;
  let expected: URL;
  let actual: URL;
  try {
    expected = new URL(allowed);
    actual = new URL(got);
  } catch {
    return false;
  }
  if (expected.protocol !== actual.protocol) return false;
  if (originPort(expected) !== originPort(actual)) return false;
  return LOOPBACK_HOSTS.has(originHost(expected.hostname)) && LOOPBACK_HOSTS.has(originHost(actual.hostname));
}
