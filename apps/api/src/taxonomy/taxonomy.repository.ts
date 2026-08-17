import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export type DepartmentRow = {
  id: string;
  name: string;
  active: boolean;
  defaultSlaDays: number;
};

export type CategoryRow = {
  id: string;
  name: string;
  departmentId: string;
  parentId: string | null;
  isLeaf: boolean;
  active: boolean;
};

@Injectable()
export class TaxonomyRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  listDepartments(): Promise<DepartmentRow[]> {
    return this.prisma.department.findMany({ orderBy: { createdAt: "asc" } });
  }

  listCategories(): Promise<CategoryRow[]> {
    return this.prisma.categoryNode.findMany({ orderBy: { createdAt: "asc" } });
  }

  findDepartment(id: string): Promise<DepartmentRow | null> {
    return this.prisma.department.findUnique({ where: { id } });
  }

  findCategory(id: string): Promise<CategoryRow | null> {
    return this.prisma.categoryNode.findUnique({ where: { id } });
  }

  createDepartment(data: { name: string; defaultSlaDays: number }): Promise<DepartmentRow> {
    return this.prisma.department.create({ data });
  }

  updateDepartment(
    id: string,
    data: { name?: string; defaultSlaDays?: number; active?: boolean },
  ): Promise<DepartmentRow> {
    return this.prisma.department.update({ where: { id }, data });
  }

  createCategory(data: {
    name: string;
    departmentId: string;
    parentId: string | null;
    isLeaf: boolean;
  }): Promise<CategoryRow> {
    return this.prisma.categoryNode.create({ data });
  }

  updateCategory(
    id: string,
    data: {
      name?: string;
      parentId?: string | null;
      departmentId?: string;
      active?: boolean;
    },
  ): Promise<CategoryRow> {
    return this.prisma.categoryNode.update({ where: { id }, data });
  }

  // ponytail: Job model lands in F-005. Always false until then. Upgrade: jobs service existence check.
  async referencesExist(args: {
    categoryId?: string;
    departmentId?: string;
  }): Promise<boolean> {
    void args;
    return false;
  }
}
