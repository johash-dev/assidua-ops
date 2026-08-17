"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StaffShell } from "@/app/staff-shell";
import { api } from "@/lib/api";

type CategoryDto = {
  id: string;
  name: string;
  parentId: string | null;
  isLeaf: boolean;
  active: boolean;
  children: CategoryDto[];
};

type DepartmentDto = {
  id: string;
  name: string;
  active: boolean;
  defaultSlaDays: number;
  categories: CategoryDto[];
};

type DialogState =
  | { kind: "dept-create" }
  | { kind: "dept-edit"; dept: DepartmentDto }
  | { kind: "cat-create"; departmentId: string; parentId: string | null }
  | { kind: "cat-edit"; departmentId: string; node: CategoryDto }
  | null;

type ConfirmState =
  | { kind: "dept" | "cat"; id: string; name: string }
  | null;

const selectClass =
  "h-8 w-full rounded-md border border-input bg-background px-3 text-sm";

function flatten(
  nodes: CategoryDto[],
  acc: CategoryDto[] = [],
): CategoryDto[] {
  for (const n of nodes) {
    acc.push(n);
    flatten(n.children, acc);
  }
  return acc;
}

export default function TaxonomyPage() {
  const [departments, setDepartments] = useState<DepartmentDto[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [name, setName] = useState("");
  const [sla, setSla] = useState("10");
  const [isLeaf, setIsLeaf] = useState(true);
  const [parentId, setParentId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api<{ departments: DepartmentDto[] }>("/api/taxonomy");
      setDepartments(data.departments);
      setLoadError(null);
    } catch (e) {
      setDepartments(null);
      setLoadError(e instanceof Error ? e.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groupsInDept = useMemo(() => {
    if (!dialog || !departments) return [];
    const deptId =
      dialog.kind === "cat-create"
        ? dialog.departmentId
        : dialog.kind === "cat-edit"
          ? departmentId || dialog.departmentId
          : "";
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return [];
    return flatten(dept.categories).filter((c) => !c.isLeaf);
  }, [dialog, departments, departmentId]);

  function openDeptCreate() {
    setName("");
    setSla("10");
    setFormError(null);
    setDialog({ kind: "dept-create" });
  }

  function openDeptEdit(dept: DepartmentDto) {
    setName(dept.name);
    setSla(String(dept.defaultSlaDays));
    setFormError(null);
    setDialog({ kind: "dept-edit", dept });
  }

  function openCatCreate(departmentId: string, parentId: string | null) {
    setName("");
    setIsLeaf(true);
    setParentId(parentId ?? "");
    setFormError(null);
    setDialog({ kind: "cat-create", departmentId, parentId });
  }

  function openCatEdit(departmentId: string, node: CategoryDto) {
    setName(node.name);
    setParentId(node.parentId ?? "");
    setDepartmentId(departmentId);
    setFormError(null);
    setDialog({ kind: "cat-edit", departmentId, node });
  }

  async function saveDialog() {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Name is required");
      return;
    }
    if (!dialog) return;
    setPending(true);
    setFormError(null);
    try {
      if (dialog.kind === "dept-create" || dialog.kind === "dept-edit") {
        const days = Number(sla);
        if (!Number.isInteger(days) || days < 1) {
          setFormError("Default SLA days must be an integer ≥ 1");
          return;
        }
        if (dialog.kind === "dept-create") {
          await api("/api/departments", {
            method: "POST",
            body: JSON.stringify({ name: trimmed, defaultSlaDays: days }),
          });
        } else {
          await api(`/api/departments/${dialog.dept.id}`, {
            method: "PATCH",
            body: JSON.stringify({ name: trimmed, defaultSlaDays: days }),
          });
        }
      } else if (dialog.kind === "cat-create") {
        await api("/api/categories", {
          method: "POST",
          body: JSON.stringify({
            name: trimmed,
            departmentId: dialog.departmentId,
            parentId: parentId || null,
            isLeaf,
          }),
        });
      } else {
        const body: Record<string, unknown> = {
          name: trimmed,
          parentId: parentId || null,
        };
        if (dialog.node.isLeaf && departmentId !== dialog.departmentId) {
          body.departmentId = departmentId;
        }
        await api(`/api/categories/${dialog.node.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      }
      setDialog(null);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  async function confirmDeactivate() {
    if (!confirm) return;
    setPending(true);
    setFormError(null);
    try {
      const path =
        confirm.kind === "dept"
          ? `/api/departments/${confirm.id}`
          : `/api/categories/${confirm.id}`;
      await api(path, { method: "PATCH", body: JSON.stringify({ active: false }) });
      setConfirm(null);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Deactivate failed");
    } finally {
      setPending(false);
    }
  }

  async function reactivate(kind: "dept" | "cat", id: string) {
    const path = kind === "dept" ? `/api/departments/${id}` : `/api/categories/${id}`;
    setFormError(null);
    try {
      await api(path, { method: "PATCH", body: JSON.stringify({ active: true }) });
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Reactivate failed");
    }
  }

  return (
    <StaffShell requireAdmin>
    <main className="mx-auto flex max-w-2xl flex-col p-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Taxonomy</h1>
          <p className="text-sm text-muted-foreground">
            Departments own the categories used at intake. Only leaves can be
            selected; groups nest them.
          </p>
        </div>
        <Button type="button" onClick={openDeptCreate}>
          Add department
        </Button>
      </header>
      {loadError ? <Alert className="mb-4">{loadError}</Alert> : null}
      {formError && !dialog && !confirm ? (
        <Alert className="mb-4">{formError}</Alert>
      ) : null}
      {departments === null && !loadError ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}
      {departments && departments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No departments</p>
      ) : null}
      {departments && departments.length > 0 ? (
        <div className="flex flex-col gap-10">
          {departments.map((dept) => (
            <section
              key={dept.id}
              data-testid="department"
              data-name={dept.name}
            >
              <div className="mb-2 flex items-baseline justify-between gap-3 border-b pb-2">
                <div>
                  <h2
                    className={`text-lg font-semibold ${dept.active ? "" : "text-muted-foreground"}`}
                  >
                    {dept.name}
                    {!dept.active ? (
                      <span className="ml-2 text-xs font-normal">Inactive</span>
                    ) : null}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Default SLA {dept.defaultSlaDays} days
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <QuietAction onClick={() => openDeptEdit(dept)}>Edit</QuietAction>
                  <QuietAction onClick={() => openCatCreate(dept.id, null)}>
                    Add category
                  </QuietAction>
                  {dept.active ? (
                    <QuietAction
                      onClick={() =>
                        setConfirm({ kind: "dept", id: dept.id, name: dept.name })
                      }
                    >
                      Deactivate
                    </QuietAction>
                  ) : (
                    <QuietAction onClick={() => void reactivate("dept", dept.id)}>
                      Reactivate
                    </QuietAction>
                  )}
                </div>
              </div>
              <CategoryList
                nodes={dept.categories}
                departmentId={dept.id}
                onAdd={openCatCreate}
                onEdit={openCatEdit}
                onDeactivate={(node) =>
                  setConfirm({ kind: "cat", id: node.id, name: node.name })
                }
                onReactivate={(id) => void reactivate("cat", id)}
              />
            </section>
          ))}
        </div>
      ) : null}

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === "dept-create"
                ? "Add department"
                : dialog?.kind === "dept-edit"
                  ? "Edit department"
                  : dialog?.kind === "cat-create"
                    ? "Add category"
                    : "Edit category"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === "dept-create" || dialog?.kind === "dept-edit"
                ? "Default SLA days apply to new jobs in this department."
                : dialog?.kind === "cat-create"
                  ? "A leaf can be selected at intake. A group only nests other categories."
                  : "Rename or move this category. Type cannot be changed."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Name
              <Input
                data-testid="taxonomy-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            {dialog?.kind === "dept-create" || dialog?.kind === "dept-edit" ? (
              <label className="flex flex-col gap-1 text-sm">
                Default SLA days
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={sla}
                  onChange={(e) => setSla(e.target.value)}
                />
              </label>
            ) : null}
            {dialog?.kind === "cat-create" ? (
              <label className="flex flex-col gap-1 text-sm">
                Type
                <select
                  className={selectClass}
                  value={isLeaf ? "leaf" : "group"}
                  onChange={(e) => setIsLeaf(e.target.value === "leaf")}
                >
                  <option value="leaf">Leaf — selectable at intake</option>
                  <option value="group">Group — not selectable</option>
                </select>
              </label>
            ) : null}
            {dialog?.kind === "cat-create" || dialog?.kind === "cat-edit" ? (
              <label className="flex flex-col gap-1 text-sm">
                Parent
                <select
                  className={selectClass}
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                >
                  <option value="">Department root</option>
                  {groupsInDept
                    .filter((g) => dialog.kind !== "cat-edit" || g.id !== dialog.node.id)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                </select>
              </label>
            ) : null}
            {dialog?.kind === "cat-edit" && dialog.node.isLeaf ? (
              <label className="flex flex-col gap-1 text-sm">
                Department
                <select
                  className={selectClass}
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setParentId("");
                  }}
                >
                  {(departments ?? []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {formError ? <Alert>{formError}</Alert> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={pending} onClick={() => void saveDialog()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {confirm?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It will no longer be offered for intake. Existing jobs are unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {formError ? <Alert>{formError}</Alert> : null}
          <AlertDialogFooter>
            <AlertDialogCancel className={buttonVariants({ variant: "outline" })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                void confirmDeactivate();
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
    </StaffShell>
  );
}

function QuietAction(props: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button type="button" size="sm" variant="ghost" onClick={props.onClick}>
      {props.children}
    </Button>
  );
}

function CategoryList(props: {
  nodes: CategoryDto[];
  departmentId: string;
  depth?: number;
  onAdd: (departmentId: string, parentId: string | null) => void;
  onEdit: (departmentId: string, node: CategoryDto) => void;
  onDeactivate: (node: CategoryDto) => void;
  onReactivate: (id: string) => void;
}) {
  if (props.nodes.length === 0) {
    return props.depth ? null : (
      <p className="text-sm text-muted-foreground">No categories yet.</p>
    );
  }
  const depth = props.depth ?? 0;
  return (
    <ul className={depth === 0 ? "flex flex-col" : "ml-4 flex flex-col border-l pl-3"}>
      {props.nodes.map((node) => (
        <li key={node.id} data-testid="category" data-name={node.name}>
          <div className="flex items-center justify-between gap-2 py-1.5">
            <div
              className={`min-w-0 truncate text-sm ${node.active ? "" : "text-muted-foreground"}`}
            >
              <span className={node.isLeaf ? "" : "font-medium"}>{node.name}</span>
              {!node.isLeaf ? (
                <span className="ml-2 text-xs text-muted-foreground">Group</span>
              ) : null}
              {!node.active ? (
                <span className="ml-2 text-xs">Inactive</span>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-1">
              <QuietAction onClick={() => props.onEdit(props.departmentId, node)}>
                Edit
              </QuietAction>
              {!node.isLeaf ? (
                <QuietAction
                  onClick={() => props.onAdd(props.departmentId, node.id)}
                >
                  Add category
                </QuietAction>
              ) : null}
              {node.active ? (
                <QuietAction onClick={() => props.onDeactivate(node)}>
                  Deactivate
                </QuietAction>
              ) : (
                <QuietAction onClick={() => props.onReactivate(node.id)}>
                  Reactivate
                </QuietAction>
              )}
            </div>
          </div>
          <CategoryList {...props} nodes={node.children} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}
