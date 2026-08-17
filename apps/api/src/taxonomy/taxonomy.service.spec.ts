import { describe, expect, it } from "vitest";
import { TaxonomyHttpError } from "./taxonomy.errors";
import { TaxonomyService } from "./taxonomy.service";
import type { CategoryRow, DepartmentRow, TaxonomyRepository } from "./taxonomy.repository";

function errCode(fn: () => Promise<unknown>): Promise<string> {
  return fn().then(
    () => {
      throw new Error("expected failure");
    },
    (e: unknown) => {
      expect(e).toBeInstanceOf(TaxonomyHttpError);
      return ((e as TaxonomyHttpError).getResponse() as { code: string }).code;
    },
  );
}

function memoryRepo(opts?: { referenced?: boolean }): TaxonomyRepository & {
  departments: DepartmentRow[];
  categories: CategoryRow[];
} {
  let n = 0;
  const id = () => `id-${++n}`;
  const departments: DepartmentRow[] = [];
  const categories: CategoryRow[] = [];
  const referenced = opts?.referenced ?? false;
  const repo = {
    departments,
    categories,
    async listDepartments() {
      return departments;
    },
    async listCategories() {
      return categories;
    },
    async findDepartment(deptId: string) {
      return departments.find((d) => d.id === deptId) ?? null;
    },
    async findCategory(catId: string) {
      return categories.find((c) => c.id === catId) ?? null;
    },
    async createDepartment(data: { name: string; defaultSlaDays: number }) {
      const row = { id: id(), name: data.name, active: true, defaultSlaDays: data.defaultSlaDays };
      departments.push(row);
      return row;
    },
    async updateDepartment(
      deptId: string,
      data: { name?: string; defaultSlaDays?: number; active?: boolean },
    ) {
      const row = departments.find((d) => d.id === deptId);
      if (!row) throw new Error("missing");
      Object.assign(row, data);
      return row;
    },
    async createCategory(data: {
      name: string;
      departmentId: string;
      parentId: string | null;
      isLeaf: boolean;
    }) {
      const row = { id: id(), active: true, ...data };
      categories.push(row);
      return row;
    },
    async updateCategory(
      catId: string,
      data: {
        name?: string;
        parentId?: string | null;
        departmentId?: string;
        active?: boolean;
      },
    ) {
      const row = categories.find((c) => c.id === catId);
      if (!row) throw new Error("missing");
      Object.assign(row, data);
      return row;
    },
    async referencesExist() {
      return referenced;
    },
  };
  return repo as unknown as TaxonomyRepository & {
    departments: DepartmentRow[];
    categories: CategoryRow[];
  };
}

describe("TaxonomyService", () => {
  it("creates a department and rejects SLA < 1", async () => {
    const service = new TaxonomyService(memoryRepo());
    const dept = await service.createDepartment({ name: "  Rivon  ", defaultSlaDays: 10 });
    expect(dept).toMatchObject({ name: "Rivon", defaultSlaDays: 10, active: true });
    expect(await errCode(() => service.createDepartment({ name: "X", defaultSlaDays: 0 }))).toBe(
      "SLA_DAYS_INVALID",
    );
  });

  it("rejects non-leaf as job category", async () => {
    const repo = memoryRepo();
    const service = new TaxonomyService(repo);
    const dept = await service.createDepartment({ name: "Assidua", defaultSlaDays: 10 });
    const group = await service.createCategory({
      name: "Home Appliances",
      departmentId: dept.id,
      isLeaf: false,
    });
    expect(await errCode(() => service.requireActiveLeaf(group.id))).toBe("TAXONOMY_NOT_LEAF");
  });

  it("creates a leaf under a group and rejects parent that is a leaf", async () => {
    const service = new TaxonomyService(memoryRepo());
    const dept = await service.createDepartment({ name: "Assidua", defaultSlaDays: 10 });
    const group = await service.createCategory({
      name: "Home Appliances",
      departmentId: dept.id,
      isLeaf: false,
    });
    const leaf = await service.createCategory({
      name: "Tv",
      departmentId: dept.id,
      parentId: group.id,
      isLeaf: true,
    });
    expect(leaf).toMatchObject({ name: "Tv", isLeaf: true, departmentId: dept.id, parentId: group.id });
    expect(
      await errCode(() =>
        service.createCategory({
          name: "Nope",
          departmentId: dept.id,
          parentId: leaf.id,
          isLeaf: true,
        }),
      ),
    ).toBe("TAXONOMY_INVALID_PARENT");
  });

  it("rejects deactivate when referenced and allows when not", async () => {
    const blocked = new TaxonomyService(memoryRepo({ referenced: true }));
    const dept = await blocked.createDepartment({ name: "Rivon", defaultSlaDays: 10 });
    const leaf = await blocked.createCategory({
      name: "Car",
      departmentId: dept.id,
      isLeaf: true,
    });
    expect(
      await errCode(() => blocked.updateCategory(leaf.id, { active: false })),
    ).toBe("TAXONOMY_DEACTIVATE_REFERENCED");
    expect(
      await errCode(() => blocked.updateDepartment(dept.id, { active: false })),
    ).toBe("TAXONOMY_DEACTIVATE_REFERENCED");

    const open = new TaxonomyService(memoryRepo({ referenced: false }));
    const d2 = await open.createDepartment({ name: "Rover", defaultSlaDays: 10 });
    const bike = await open.createCategory({ name: "Bike", departmentId: d2.id, isLeaf: true });
    const deactivated = await open.updateCategory(bike.id, { active: false });
    expect(deactivated.active).toBe(false);
  });

  it("rejects leaf department change when referenced", async () => {
    const service = new TaxonomyService(memoryRepo({ referenced: true }));
    const a = await service.createDepartment({ name: "A", defaultSlaDays: 10 });
    const b = await service.createDepartment({ name: "B", defaultSlaDays: 10 });
    const leaf = await service.createCategory({ name: "Car", departmentId: a.id, isLeaf: true });
    expect(
      await errCode(() => service.updateCategory(leaf.id, { departmentId: b.id })),
    ).toBe("TAXONOMY_DEPARTMENT_CHANGE_REFERENCED");
  });

  it("hides inactive leaves from non-admin tree", async () => {
    const service = new TaxonomyService(memoryRepo());
    const dept = await service.createDepartment({ name: "Rover", defaultSlaDays: 10 });
    const bike = await service.createCategory({ name: "Bike", departmentId: dept.id, isLeaf: true });
    await service.updateCategory(bike.id, { active: false });
    const admin = await service.getTree("ADMIN");
    expect(admin.departments[0]?.categories[0]).toMatchObject({ name: "Bike", active: false });
    const fd = await service.getTree("FRONT_DESK");
    expect(fd.departments).toEqual([]);
  });

  it("keeps active leaves when an ancestor group is inactive", async () => {
    const service = new TaxonomyService(memoryRepo());
    const dept = await service.createDepartment({ name: "Assidua", defaultSlaDays: 10 });
    const group = await service.createCategory({
      name: "Home Appliances",
      departmentId: dept.id,
      isLeaf: false,
    });
    await service.createCategory({
      name: "Tv",
      departmentId: dept.id,
      parentId: group.id,
      isLeaf: true,
    });
    await service.updateCategory(group.id, { active: false });
    const admin = await service.getTree("ADMIN");
    expect(admin.departments[0]?.categories[0]).toMatchObject({
      name: "Home Appliances",
      active: false,
    });
    const fd = await service.getTree("FRONT_DESK");
    expect(fd.departments[0]?.categories).toEqual([
      expect.objectContaining({ name: "Tv", isLeaf: true, active: true, parentId: null }),
    ]);
  });
});
