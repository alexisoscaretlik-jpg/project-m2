"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const sb = createClient();
      const origin = window.location.origin;
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setError(error.message);
        return;
      }
      router.replace(`/login?sent=1`);
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="email"
        required
        autoFocus
        placeholder="ton@email.fr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        style={{ fontFamily: "var(--font-display)" }}
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {pending ? "Envoi…" : "Recevoir le lien magique"}
      </button>
      {error ? <p className="text-sm text-[color:var(--terracotta-500)]">{error}</p> : null}
    </form>
  );
}
