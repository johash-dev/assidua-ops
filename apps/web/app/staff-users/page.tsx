"use client";

import { useCallback, useEffect, useState } from "react";
import { StaffShell, roleLabel, type Me } from "@/app/staff-shell";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type Dept = { id: string; name: string };
type DialogState =
  | { kind: "create" }
  | { kind: "edit"; user: Me }
  | { kind: "replace" }
  | null;

const selectClass =
  "h-8 w-full rounded-md border border-input bg-background px-3 text-sm";

const ROLES: Me["role"][] = ["FRONT_DESK", "COORDINATOR", "DEPARTMENT_HEAD", "ADMIN"];

export default function StaffUsersPage() {
  const [users, setUsers] = useState<Me[] | null>(null);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [confirm, setConfirm] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Me["role"]>("FRONT_DESK");
  const [departmentId, setDepartmentId] = useState("");
  const [active, setActive] = useState(true);
  const [incomingUserId, setIncomingUserId] = useState("");
  const [outgoingUserId, setOutgoingUserId] = useState("");
  const [outgoingDest, setOutgoingDest] = useState("FRONT_DESK");

  const load = useCallback(async () => {
    try {
      const [list, tree] = await Promise.all([
        api<{ users: Me[] }>("/api/staff-users"),
        api<{ departments: Dept[] }>("/api/taxonomy"),
      ]);
      setUsers(list.users);
      setDepts(tree.departments);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load users");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setFormError(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("FRONT_DESK");
    setDepartmentId(depts[0]?.id ?? "");
    setDialog({ kind: "create" });
  }

  function openEdit(user: Me) {
    setFormError(null);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
    setDepartmentId(user.departmentId ?? depts[0]?.id ?? "");
    setActive(user.active);
    setDialog({ kind: "edit", user });
  }

  function openReplace() {
    const dh = users?.find((u) => u.role === "DEPARTMENT_HEAD" && u.active);
    setFormError(null);
    setDepartmentId(dh?.departmentId ?? depts[0]?.id ?? "");
    setOutgoingUserId(dh?.id ?? "");
    setIncomingUserId(users?.find((u) => u.role !== "DEPARTMENT_HEAD")?.id ?? "");
    setOutgoingDest("FRONT_DESK");
    setDialog({ kind: "replace" });
  }

  async function save() {
    setPending(true);
    setFormError(null);
    try {
      if (dialog?.kind === "create") {
        await api("/api/staff-users", {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            password,
            role,
            departmentId: role === "DEPARTMENT_HEAD" ? departmentId : null,
          }),
        });
      } else if (dialog?.kind === "edit") {
        await api(`/api/staff-users/${dialog.user.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name,
            email,
            role,
            active,
            departmentId: role === "DEPARTMENT_HEAD" ? departmentId : null,
            ...(password ? { password } : {}),
          }),
        });
      } else if (dialog?.kind === "replace") {
        await api("/api/staff-users/dh-replace", {
          method: "POST",
          body: JSON.stringify({
            departmentId,
            incomingUserId,
            outgoingUserId,
            outgoingRole: outgoingDest === "INACTIVE" ? null : outgoingDest,
            outgoingActive: outgoingDest !== "INACTIVE",
          }),
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
      await api(`/api/staff-users/${confirm.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: false }),
      });
      setConfirm(null);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Deactivate failed");
    } finally {
      setPending(false);
    }
  }

  const deptName = (id: string | null) => depts.find((d) => d.id === id)?.name ?? "";

  return (
    <StaffShell requireAdmin>
      <main className="mx-auto max-w-5xl p-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold">Users</h1>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={openReplace}>
              Replace DH
            </Button>
            <Button type="button" onClick={openCreate}>
              Add user
            </Button>
          </div>
        </header>
        {loadError ? <Alert className="mb-4">{loadError}</Alert> : null}
        {formError && !dialog && !confirm ? <Alert className="mb-4">{formError}</Alert> : null}
        {users === null && !loadError ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}
        {users && users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No staff users</p>
        ) : null}
        {users && users.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Email</th>
                <th className="py-2 font-medium">Role</th>
                <th className="py-2 font-medium">Department</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} data-testid="staff-user" data-email={u.email} className="border-b">
                  <td className="py-2">{u.name}</td>
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">{roleLabel(u.role)}</td>
                  <td className="py-2">{u.role === "DEPARTMENT_HEAD" ? deptName(u.departmentId) : ""}</td>
                  <td className="py-2">{u.active ? "Active" : "Inactive"}</td>
                  <td className="py-2 text-right">
                    <Button type="button" size="sm" variant="ghost" onClick={() => openEdit(u)}>
                      Edit
                    </Button>
                    {u.active ? (
                      <Button type="button" size="sm" variant="ghost" onClick={() => setConfirm(u)}>
                        Deactivate
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialog?.kind === "create"
                  ? "Add user"
                  : dialog?.kind === "edit"
                    ? "Edit user"
                    : "Replace DH"}
              </DialogTitle>
            </DialogHeader>
            {dialog?.kind === "replace" ? (
              <div className="flex flex-col gap-3">
                <label className="space-y-1 text-sm">
                  <span>Department</span>
                  <select
                    data-testid="replace-department"
                    className={selectClass}
                    value={departmentId}
                    onChange={(e) => {
                      setDepartmentId(e.target.value);
                      const dh = users?.find(
                        (u) =>
                          u.role === "DEPARTMENT_HEAD" &&
                          u.active &&
                          u.departmentId === e.target.value,
                      );
                      setOutgoingUserId(dh?.id ?? "");
                    }}
                  >
                    {depts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span>Incoming user</span>
                  <select
                    data-testid="replace-incoming"
                    className={selectClass}
                    value={incomingUserId}
                    onChange={(e) => setIncomingUserId(e.target.value)}
                  >
                    {(users ?? [])
                      .filter((u) => u.id !== outgoingUserId)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span>Outgoing becomes</span>
                  <select
                    className={selectClass}
                    value={outgoingDest}
                    onChange={(e) => setOutgoingDest(e.target.value)}
                  >
                    <option value="FRONT_DESK">Front desk</option>
                    <option value="COORDINATOR">Coordinator</option>
                    <option value="ADMIN">Admin</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </label>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <label className="space-y-1 text-sm">
                  <span>Name</span>
                  <Input data-testid="user-name" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Email</span>
                  <Input data-testid="user-email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Password{dialog?.kind === "edit" ? " (optional)" : ""}</span>
                  <Input
                    data-testid="user-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Role</span>
                  <select className={selectClass} value={role} onChange={(e) => setRole(e.target.value as Me["role"])}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {roleLabel(r)}
                      </option>
                    ))}
                  </select>
                </label>
                {role === "DEPARTMENT_HEAD" ? (
                  <label className="space-y-1 text-sm">
                    <span>Department</span>
                    <select
                      className={selectClass}
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                    >
                      {depts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {dialog?.kind === "edit" ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                    />
                    Active
                  </label>
                ) : null}
              </div>
            )}
            {formError ? <Alert>{formError}</Alert> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button type="button" disabled={pending} onClick={() => void save()}>
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
                They will not be able to sign in.
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
