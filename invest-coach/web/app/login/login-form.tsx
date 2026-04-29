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
        className="w-full rounded-full focus:outline-none"
        style={{
          fontFamily: "var(--font-display)",
          background: "var(--paper-0)",
          color: "var(--ink-700)",
          border: "1px solid var(--paper-300)",
          padding: "14px 20px",
          fontSize: "15px",
          boxShadow: "var(--sh-sm)",
        }}
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full font-semibold transition-all hover:translate-y-[-1px] hover:shadow-md disabled:opacity-60"
        style={{
          fontFamily: "var(--font-display)",
          background: "var(--ink-700)",
          color: "var(--paper-0)",
          padding: "14px 20px",
          fontSize: "15px",
          letterSpacing: "-0.005em",
        }}
      >
        {pending ? "Envoi…" : "Recevoir le lien magique"}
      </button>
      {error ? (
        <p
          className="mt-2 text-[13px]"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--terracotta-500)",
          }}
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
