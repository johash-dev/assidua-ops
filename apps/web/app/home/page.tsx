"use client";

import { useEffect, useState } from "react";
import { StaffShell, roleLabel, type Me } from "@/app/staff-shell";
import { api } from "@/lib/api";

export default function HomePage() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    void api<Me>("/api/auth/me").then(setMe).catch(() => setMe(null));
  }, []);

  return (
    <StaffShell>
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-2xl font-semibold">Home</h1>
        {me ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as {me.name} ({roleLabel(me.role)}).
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
        )}
      </main>
    </StaffShell>
  );
}
