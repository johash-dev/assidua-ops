"use client";

import { StaffShell } from "@/app/staff-shell";

export default function ForbiddenPage() {
  return (
    <StaffShell>
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-2xl font-semibold">You do not have access to this page.</h1>
      </main>
    </StaffShell>
  );
}
