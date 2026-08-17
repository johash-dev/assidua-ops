import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { TaxonomyController } from "./taxonomy.controller";
import { TaxonomyRepository } from "./taxonomy.repository";
import { TaxonomyService } from "./taxonomy.service";

@Module({
  imports: [IdentityModule],
  controllers: [TaxonomyController],
  providers: [TaxonomyService, TaxonomyRepository],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}
