import { Inject, Injectable } from "@nestjs/common";
import { taxonomyFail } from "./taxonomy.errors";
import type { StaffRole } from "./taxonomy.guard";
import {
  TaxonomyRepository,
  type CategoryRow,
  type DepartmentRow,
} from "./taxonomy.repository";

export type CategoryDto = {
  id: string;
  name: string;
  parentId: string | null;
  isLeaf: boolean;
  active: boolean;
  children: CategoryDto[];
};

export type DepartmentDto = {
  id: string;
  name: string;
  active: boolean;
  defaultSlaDays: number;
  categories: CategoryDto[];
};

@Injectable()
export class TaxonomyService {
  constructor(@Inject(TaxonomyRepository) private readonly repo: TaxonomyRepository) {}

  async getTree(role: StaffRole): Promise<{ departments: DepartmentDto[] }> {
    const [departments, categories] = await Promise.all([
      this.repo.listDepartments(),
      this.repo.listCategories(),
    ]);
    const admin = role === "ADMIN";
    const departmentsOut: DepartmentDto[] = [];
    for (const dept of departments) {
      if (!admin && !dept.active) continue;
      const nodes = categories.filter((c) => c.departmentId === dept.id);
      let tree = nest(nodes, null);
      if (!admin) tree = pruneInactive(tree);
      if (!admin && tree.length === 0) continue;
      departmentsOut.push({
        id: dept.id,
        name: dept.name,
        active: dept.active,
        defaultSlaDays: dept.defaultSlaDays,
        categories: tree,
      });
    }
    return { departments: departmentsOut };
  }

  async requireActiveLeaf(id: string): Promise<CategoryRow> {
    const node = await this.repo.findCategory(id);
    if (!node || !node.active || !node.isLeaf) {
      taxonomyFail(400, "TAXONOMY_NOT_LEAF", "Category is not an active leaf");
    }
    return node;
  }

  async createDepartment(body: unknown): Promise<DepartmentRow> {
    const name = readName(body);
    const defaultSlaDays = readSla(body);
    return this.repo.createDepartment({ name, defaultSlaDays });
  }

  async updateDepartment(id: string, body: unknown): Promise<DepartmentRow> {
    const current = await this.repo.findDepartment(id);
    if (!current) taxonomyFail(404, "VALIDATION", "Department not found");
    const data: {
      name?: string;
      defaultSlaDays?: number;
      active?: boolean;
    } = {};
    if (hasKey(body, "name")) data.name = readName(body);
    if (hasKey(body, "defaultSlaDays")) data.defaultSlaDays = readSla(body);
    if (hasKey(body, "active")) {
      const active = readBoolean(body, "active");
      if (current.active && !active) {
        await this.assertUnreferenced({ departmentId: id });
      }
      data.active = active;
    }
    // ponytail: F-008 must own defaultSlaDays change when jobs exist (bulk prompt).
    return this.repo.updateDepartment(id, data);
  }

  async createCategory(body: unknown): Promise<CategoryRow> {
    const name = readName(body);
    const departmentId = readString(body, "departmentId");
    const isLeaf = readBoolean(body, "isLeaf");
    const parentId = readOptionalParentId(body);
    const dept = await this.repo.findDepartment(departmentId);
    if (!dept) taxonomyFail(400, "TAXONOMY_INVALID_PARENT", "Department not found");
    await this.assertParent(parentId, departmentId, null);
    return this.repo.createCategory({ name, departmentId, parentId, isLeaf });
  }

  async updateCategory(id: string, body: unknown): Promise<CategoryRow> {
    const current = await this.repo.findCategory(id);
    if (!current) taxonomyFail(404, "VALIDATION", "Category not found");
    if (hasKey(body, "isLeaf")) {
      taxonomyFail(400, "VALIDATION", "Cannot change leaf/group type");
    }
    const data: {
      name?: string;
      parentId?: string | null;
      departmentId?: string;
      active?: boolean;
    } = {};
    if (hasKey(body, "name")) data.name = readName(body);

    let departmentId = current.departmentId;
    if (hasKey(body, "departmentId")) {
      const nextDept = readString(body, "departmentId");
      if (nextDept !== current.departmentId) {
        if (!current.isLeaf) {
          taxonomyFail(400, "VALIDATION", "Only a leaf may change department");
        }
        await this.assertUnreferenced({ categoryId: id }, "TAXONOMY_DEPARTMENT_CHANGE_REFERENCED");
        const dept = await this.repo.findDepartment(nextDept);
        if (!dept) taxonomyFail(400, "TAXONOMY_INVALID_PARENT", "Department not found");
        departmentId = nextDept;
        data.departmentId = nextDept;
      }
    }

    if (hasKey(body, "parentId") || data.departmentId) {
      const parentId = hasKey(body, "parentId")
        ? readOptionalParentId(body)
        : data.departmentId
          ? null
          : current.parentId;
      await this.assertParent(parentId, departmentId, id);
      data.parentId = parentId;
    }

    if (hasKey(body, "active")) {
      const active = readBoolean(body, "active");
      if (current.active && !active) {
        await this.assertUnreferenced({ categoryId: id });
      }
      data.active = active;
    }
    return this.repo.updateCategory(id, data);
  }

  private async assertUnreferenced(
    args: { categoryId?: string; departmentId?: string },
    code = "TAXONOMY_DEACTIVATE_REFERENCED",
  ): Promise<void> {
    if (await this.repo.referencesExist(args)) {
      taxonomyFail(409, code, "Referenced by a job");
    }
  }

  private async assertParent(
    parentId: string | null,
    departmentId: string,
    selfId: string | null,
  ): Promise<void> {
    if (!parentId) return;
    if (selfId && parentId === selfId) {
      taxonomyFail(400, "TAXONOMY_INVALID_PARENT", "Invalid parent");
    }
    const parent = await this.repo.findCategory(parentId);
    if (!parent || parent.departmentId !== departmentId || parent.isLeaf) {
      taxonomyFail(400, "TAXONOMY_INVALID_PARENT", "Invalid parent");
    }
    if (selfId) {
      let cursor: string | null = parent.parentId;
      const seen = new Set<string>([parent.id]);
      while (cursor) {
        if (cursor === selfId) {
          taxonomyFail(400, "TAXONOMY_INVALID_PARENT", "Invalid parent");
        }
        if (seen.has(cursor)) break;
        seen.add(cursor);
        const node = await this.repo.findCategory(cursor);
        cursor = node?.parentId ?? null;
      }
    }
  }
}

function nest(nodes: CategoryRow[], parentId: string | null): CategoryDto[] {
  return nodes
    .filter((n) => n.parentId === parentId)
    .map((n) => ({
      id: n.id,
      name: n.name,
      parentId: n.parentId,
      isLeaf: n.isLeaf,
      active: n.active,
      children: nest(nodes, n.id),
    }));
}

function pruneInactive(
  nodes: CategoryDto[],
  parentId: string | null = null,
): CategoryDto[] {
  const out: CategoryDto[] = [];
  for (const n of nodes) {
    if (n.isLeaf) {
      if (n.active) out.push({ ...n, parentId, children: [] });
      continue;
    }
    const children = pruneInactive(n.children, n.active ? n.id : parentId);
    if (!n.active) {
      out.push(...children);
      continue;
    }
    if (children.length === 0) continue;
    out.push({ ...n, parentId, children });
  }
  return out;
}

function isRecord(body: unknown): body is Record<string, unknown> {
  return typeof body === "object" && body !== null;
}

function hasKey(body: unknown, key: string): boolean {
  return isRecord(body) && Object.prototype.hasOwnProperty.call(body, key);
}

function readName(body: unknown): string {
  if (!isRecord(body) || typeof body.name !== "string") {
    taxonomyFail(400, "VALIDATION", "Name is required");
  }
  const name = body.name.trim();
  if (!name) taxonomyFail(400, "VALIDATION", "Name is required");
  return name;
}

function readString(body: unknown, key: string): string {
  if (!isRecord(body) || typeof body[key] !== "string" || !body[key]) {
    taxonomyFail(400, "VALIDATION", `${key} is required`);
  }
  return body[key] as string;
}

function readOptionalParentId(body: unknown): string | null {
  if (!isRecord(body) || !hasKey(body, "parentId") || body.parentId == null) {
    return null;
  }
  if (typeof body.parentId !== "string") {
    taxonomyFail(400, "TAXONOMY_INVALID_PARENT", "Invalid parent");
  }
  return body.parentId || null;
}

function readBoolean(body: unknown, key: string): boolean {
  if (!isRecord(body) || typeof body[key] !== "boolean") {
    taxonomyFail(400, "VALIDATION", `${key} is required`);
  }
  return body[key] as boolean;
}

function readSla(body: unknown): number {
  if (!isRecord(body) || !hasKey(body, "defaultSlaDays")) {
    taxonomyFail(400, "SLA_DAYS_INVALID", "defaultSlaDays must be an integer ≥ 1");
  }
  const value = body.defaultSlaDays;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    taxonomyFail(400, "SLA_DAYS_INVALID", "defaultSlaDays must be an integer ≥ 1");
  }
  return value;
}
