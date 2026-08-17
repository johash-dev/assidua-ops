import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import { identityFail } from "./identity.errors";
import { IdentityService } from "./identity.service";
import type { Principal } from "./roles";
import { isAllowedWebOrigin, parseCookie, SESSION_COOKIE } from "./session-token";

export type { Principal, StaffRole } from "./roles";

export type AuthedRequest = {
  headers: Record<string, string | string[] | undefined>;
  method?: string;
  principal?: Principal;
  sessionId?: string;
};

function headerVal(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const raw = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(raw) ? raw[0] : raw;
}

export function assertSameOrigin(req: AuthedRequest): void {
  const origin = headerVal(req.headers, "origin");
  if (!origin) return;
  if (!isAllowedWebOrigin(origin)) {
    identityFail(403, "FORBIDDEN", "Invalid origin");
  }
}

export function principalOf(req: { principal?: Principal }): Principal {
  if (!req.principal) identityFail(401, "UNAUTHORIZED", "Authentication required");
  return req.principal;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(IdentityService) private readonly identity: IdentityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const method = (req.method ?? "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      assertSameOrigin(req);
    }
    const token = parseCookie(headerVal(req.headers, "cookie"), SESSION_COOKIE);
    if (!token) identityFail(401, "UNAUTHORIZED", "Authentication required");
    const { principal, sessionId } = await this.identity.principalFromToken(token);
    req.principal = principal;
    req.sessionId = sessionId;
    return true;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ principal?: Principal }>();
    if (req.principal?.role !== "ADMIN") {
      identityFail(403, "FORBIDDEN", "Admin only");
    }
    return true;
  }
}
