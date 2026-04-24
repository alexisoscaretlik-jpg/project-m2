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
          className={`flex-1 rounded-lg border border-slate-300 bg-white px-4 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:rounded-r-none ${
            big ? "py-3 text-base" : "py-2 text-sm"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`rounded-lg bg-primary font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 sm:rounded-l-none ${
            big ? "px-6 py-3 text-base" : "px-4 py-2 text-sm"
          }`}
        >
          {pending ? "…" : cta}
        </button>
      </div>
      {state ? (
        <p
          className={`mt-2 text-sm ${
            state.ok ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
