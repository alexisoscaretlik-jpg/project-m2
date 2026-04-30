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
      <label
        htmlFor="login-email"
        className="block"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--ink-700)",
        }}
      >
        ↳ Ton e-mail
      </label>
      <input
        id="login-email"
        type="email"
        required
        autoFocus
        placeholder="ton@email.fr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full focus:outline-none"
        style={{
          fontFamily: "var(--font-display)",
          background: "var(--paper-0)",
          color: "var(--ink-700)",
          border: "1px solid var(--ink-700)",
          borderRadius: 0,
          padding: "16px 20px",
          fontSize: "16px",
        }}
      />
      <button
        type="submit"
        disabled={pending}
        className="ic-btn-block w-full"
        style={{ padding: "16px 20px", fontSize: "12px" }}
      >
        {pending ? "↳ Envoi…" : "↳ Recevoir le lien magique"}
      </button>
      {error ? (
        <p
          className="mt-3 text-[12px]"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--ink-700)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            background: "var(--rose-100)",
            border: "1px solid var(--ink-700)",
            padding: "10px 14px",
          }}
        >
          ↳ {error}
        </p>
      ) : null}
    </form>
  );
}
