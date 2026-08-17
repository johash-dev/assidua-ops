import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { IdentityModule } from "./identity/identity.module";
import { PrismaModule } from "./prisma/prisma.module";
import { TaxonomyModule } from "./taxonomy/taxonomy.module";

@Module({
  imports: [PrismaModule, HealthModule, IdentityModule, TaxonomyModule],
})
export class AppModule {}
