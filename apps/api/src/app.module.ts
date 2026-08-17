import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { TaxonomyModule } from "./taxonomy/taxonomy.module";

@Module({
  imports: [PrismaModule, HealthModule, TaxonomyModule],
})
export class AppModule {}
