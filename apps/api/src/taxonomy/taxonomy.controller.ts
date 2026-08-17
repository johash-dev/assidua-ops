import { Body, Controller, Get, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AdminGuard, TaxonomyGuard, principalOf, type Principal } from "./taxonomy.guard";
import { TaxonomyService } from "./taxonomy.service";

@Controller()
@UseGuards(TaxonomyGuard)
export class TaxonomyController {
  constructor(@Inject(TaxonomyService) private readonly taxonomy: TaxonomyService) {}

  @Get("taxonomy")
  getTree(@Req() req: { principal?: Principal }) {
    return this.taxonomy.getTree(principalOf(req).role);
  }

  @Post("departments")
  @UseGuards(AdminGuard)
  createDepartment(@Body() body: unknown) {
    return this.taxonomy.createDepartment(body);
  }

  @Patch("departments/:id")
  @UseGuards(AdminGuard)
  updateDepartment(@Param("id") id: string, @Body() body: unknown) {
    return this.taxonomy.updateDepartment(id, body);
  }

  @Post("categories")
  @UseGuards(AdminGuard)
  createCategory(@Body() body: unknown) {
    return this.taxonomy.createCategory(body);
  }

  @Patch("categories/:id")
  @UseGuards(AdminGuard)
  updateCategory(@Param("id") id: string, @Body() body: unknown) {
    return this.taxonomy.updateCategory(id, body);
  }
}
