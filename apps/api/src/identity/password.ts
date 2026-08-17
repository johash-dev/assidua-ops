import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";

const N = 16384;
const r = 8;
const p = 1;
const keylen = 32;

function scrypt(
  password: string,
  salt: string,
  length: number,
  opts: { N: number; r: number; p: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, length, opts, (err, buf) => {
      if (err) reject(err);
      else resolve(buf);
    });
  });
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const buf = (await scrypt(plain, salt, keylen, { N, r, p })) as Buffer;
  return `scrypt$${N}$${r}$${p}$${salt}$${buf.toString("base64url")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const n = Number(parts[1]);
  const rr = Number(parts[2]);
  const pp = Number(parts[3]);
  const salt = parts[4];
  const expected = Buffer.from(parts[5], "base64url");
  if (!salt || !Number.isFinite(n) || expected.length === 0) return false;
  const actual = (await scrypt(plain, salt, expected.length, { N: n, r: rr, p: pp })) as Buffer;
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
