"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";

export type Me = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "DEPARTMENT_HEAD" | "FRONT_DESK" | "COORDINATOR";
  departmentId: string | null;
  active: boolean;
};

const ROLE_LABEL: Record<Me["role"], string> = {
  ADMIN: "Admin",
  DEPARTMENT_HEAD: "Department head",
  FRONT_DESK: "Front desk",
  COORDINATOR: "Coordinator",
};

export function roleLabel(role: Me["role"]): string {
  return ROLE_LABEL[role];
}

export function StaffShell(props: { children: ReactNode; requireAdmin?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const user = await api<Me>("/api/auth/me");
      setMe(user);
      setError(null);
      if (props.requireAdmin && user.role !== "ADMIN") {
        router.replace("/forbidden");
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.replace("/login");
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load session");
    }
  }, [props.requireAdmin, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // still leave
    }
    router.replace("/login");
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  if (!me || (props.requireAdmin && me.role !== "ADMIN")) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const admin = me.role === "ADMIN";
  const linkClass = (href: string) =>
    `rounded-md px-2 py-1 text-sm ${
      pathname === href
        ? "bg-white/10 text-foreground"
        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
    }`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-inset">
        <nav className="flex h-14 items-center gap-1 px-4">
          <Link className="mr-3 text-sm font-semibold tracking-tight" href="/home">
            Assidua Ops
          </Link>
          <Link className={linkClass("/home")} href="/home">
            Home
          </Link>
          {admin ? (
            <>
              <Link className={linkClass("/taxonomy")} href="/taxonomy">
                Taxonomy
              </Link>
              <Link className={linkClass("/staff-users")} href="/staff-users">
                Users
              </Link>
            </>
          ) : null}
          <div className="ml-auto flex min-w-0 items-center gap-1 border-l border-border pl-3">
            <span className="truncate px-2 text-sm text-muted-foreground">
              {me.name} · {roleLabel(me.role)}
            </span>
            <Button
              type="button"
              variant="ghost"
              className="h-auto px-2 py-1 font-normal text-muted-foreground hover:bg-white/5 hover:text-foreground"
              onClick={() => void logout()}
            >
              Log out
            </Button>
          </div>
        </nav>
      </header>
      {props.children}
    </div>
  );
}
