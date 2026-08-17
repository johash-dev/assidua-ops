"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Me } from "@/app/staff-shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setPending(true);
    try {
      const me = await api<Me>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.replace(me.role === "ADMIN" ? "/taxonomy" : "/home");
    } catch (err) {
      void err;
      setError("Sign-in rejected.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-4 pt-10 pb-16">
      <p className="mb-4 text-xl font-semibold tracking-tight">Assidua Ops</p>
      <h1 className="mb-4 text-2xl font-light">Sign in to Assidua Ops</h1>
      <form
        className="w-full max-w-[340px] rounded-md border border-border bg-muted p-4"
        aria-busy={pending}
        onSubmit={(e) => void onSubmit(e)}
      >
        <div className="flex flex-col gap-3">
          <label className="space-y-1.5 text-sm font-normal">
            <span>Email</span>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="space-y-1.5 text-sm font-normal">
            <span>Password</span>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? <Alert>{error}</Alert> : null}
          <Button className="w-full" type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>
      <p className="mt-4 max-w-[340px] text-center text-sm text-muted-foreground">
        Staff email and password.
      </p>
    </main>
  );
}
