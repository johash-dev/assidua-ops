"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Health = { status: string; db: string };

export default function Page() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setHealth((await res.json()) as Health);
      setError(null);
    } catch {
      setHealth(null);
      setError("unreachable");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const label = error
    ? `health: ${error}`
    : health
      ? `health: ${health.status} db: ${health.db}`
      : "health: loading";

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Assidua Ops</h1>
      <p data-testid="health">{label}</p>
      <Button type="button" onClick={() => void load()}>
        Refresh health
      </Button>
    </main>
  );
}
