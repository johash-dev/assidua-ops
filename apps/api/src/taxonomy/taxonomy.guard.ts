import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { taxonomyFail } from "./taxonomy.errors";

export const STAFF_ROLES = [
  "ADMIN",
  "DEPARTMENT_HEAD",
  "FRONT_DESK",
  "COORDINATOR",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
export type Principal = { role: StaffRole };

const HEADER = "x-test-role";

export function testPrincipalEnvAllowed(env = process.env.NODE_ENV): boolean {
  return env === "development" || env === "test";
}

export function readTestRole(
  headers: Record<string, string | string[] | undefined>,
  env = process.env.NODE_ENV,
): StaffRole | undefined {
  if (!testPrincipalEnvAllowed(env)) return undefined;
  const raw = headers[HEADER];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  const role = value.toUpperCase();
  return (STAFF_ROLES as readonly string[]).includes(role)
    ? (role as StaffRole)
    : undefined;
}

export function principalOf(req: { principal?: Principal }): Principal {
  if (!req.principal) taxonomyFail(401, "UNAUTHORIZED", "Authentication required");
  return req.principal;
}

@Injectable()
export class TaxonomyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      principal?: Principal;
    }>();
    const role = readTestRole(req.headers);
    if (!role) taxonomyFail(401, "UNAUTHORIZED", "Authentication required");
    req.principal = { role };
    return true;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ principal?: Principal }>();
    if (req.principal?.role !== "ADMIN") {
      taxonomyFail(403, "FORBIDDEN", "Admin only");
    }
    return true;
  }
}
