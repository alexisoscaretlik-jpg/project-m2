"use client";

import { useState, useTransition } from "react";

import { subscribe } from "./actions";

export function SubscribeForm({
  source = "landing",
  placeholder = "ton@email.fr",
  cta = "Je m'abonne",
  variant = "hero",
}: {
  source?: string;
  placeholder?: string;
  cta?: string;
  variant?: "hero" | "compact";
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<null | {
    ok: boolean;
    message: string;
  }>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set("email", email);
    fd.set("source", source);
    startTransition(async () => {
      const result = await subscribe(fd);
      setState(result);
      if (result.ok) setEmail("");
    });
  };

  const big = variant === "hero";

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div
        className={`flex flex-col gap-2 ${
          big ? "sm:flex-row sm:gap-0" : "sm:flex-row sm:gap-0"
        }`}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 rounded-md px-4 focus:outline-none focus:ring-2 sm:rounded-r-none ${
            big ? "py-3 text-base" : "py-2 text-sm"
          }`}
          style={{
            fontFamily: "var(--font-display)",
            background: "var(--bg-elevated)",
            color: "var(--ink-700)",
            border: "1px solid var(--border-strong)",
          }}
        />
        <button
          type="submit"
          disabled={pending}
          className={`rounded-md font-medium transition-colors disabled:opacity-60 sm:rounded-l-none ${
            big ? "px-6 py-3 text-base" : "px-4 py-2 text-sm"
          }`}
          style={{
            fontFamily: "var(--font-display)",
            background: "var(--terracotta-500)",
            color: "var(--paper-50)",
            border: "1px solid var(--terracotta-500)",
          }}
        >
          {pending ? "…" : cta}
        </button>
      </div>
      {state ? (
        <p
          className="mt-2 text-sm"
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            color: state.ok ? "var(--forest-300)" : "var(--terracotta-300)",
          }}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
