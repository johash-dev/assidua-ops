import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { AdminGuard, AuthGuard, assertSameOrigin, principalOf, type AuthedRequest } from "./identity.guard";
import { IdentityService } from "./identity.service";
import { serializeSessionCookie, SESSION_TTL_SEC } from "./session-token";

@Controller()
export class IdentityController {
  constructor(@Inject(IdentityService) private readonly identity: IdentityService) {}

  @Post("auth/login")
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Req() req: AuthedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    assertSameOrigin(req);
    const { user, token } = await this.identity.login(body);
    res.setHeader("Set-Cookie", serializeSessionCookie(token, SESSION_TTL_SEC));
    return user;
  }

  @Post("auth/logout")
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async logout(
    @Req() req: AuthedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (req.sessionId) await this.identity.logout(req.sessionId);
    res.setHeader("Set-Cookie", serializeSessionCookie("", 0));
    return { ok: true };
  }

  @Get("auth/me")
  @UseGuards(AuthGuard)
  me(@Req() req: AuthedRequest) {
    return principalOf(req);
  }

  @Get("staff-users")
  @UseGuards(AuthGuard, AdminGuard)
  listUsers() {
    return this.identity.listUsers();
  }

  @Post("staff-users")
  @UseGuards(AuthGuard, AdminGuard)
  createUser(@Req() req: AuthedRequest, @Body() body: unknown) {
    return this.identity.createUser(principalOf(req).id, body);
  }

  @Post("staff-users/dh-replace")
  @HttpCode(200)
  @UseGuards(AuthGuard, AdminGuard)
  replaceDh(@Req() req: AuthedRequest, @Body() body: unknown) {
    return this.identity.replaceDh(principalOf(req).id, body);
  }

  @Patch("staff-users/:id")
  @UseGuards(AuthGuard, AdminGuard)
  updateUser(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.identity.updateUser(principalOf(req).id, id, body);
  }
}
