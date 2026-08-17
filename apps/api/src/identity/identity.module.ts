import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { IdentityController } from "./identity.controller";
import { AdminGuard, AuthGuard } from "./identity.guard";
import { IdentityRepository } from "./identity.repository";
import { IdentityService } from "./identity.service";

@Module({
  imports: [AuditModule],
  controllers: [IdentityController],
  providers: [IdentityService, IdentityRepository, AuthGuard, AdminGuard],
  exports: [IdentityService, AuthGuard, AdminGuard],
})
export class IdentityModule {}
