"use client";

import { useState, useTransition } from "react";

import { subscribe } from "./actions";

export function SubscribeForm({
  source = "landing",
  placeholder = "ton@email.fr",
  cta = "S'abonner",
  variant = "hero",
}: {
  source?: string;
  placeholder?: string;
  cta?: string;
  variant?: "hero" | "compact" | "inverse";
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<null | { ok: boolean; message: string }>(
    null,
  );
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

  const isHero = variant === "hero";
  const isInverse = variant === "inverse";

  // Inverse styling for dark backgrounds (e.g. featured newsletter section)
  const fieldBg = isInverse ? "rgba(255,255,255,0.08)" : "var(--paper-0)";
  const fieldBorder = isInverse
    ? "1px solid rgba(255,255,255,0.18)"
    : "1px solid var(--paper-200)";
  const fieldText = isInverse ? "var(--paper-0)" : "var(--ink-700)";
  const fieldPlaceholder = isInverse
    ? "rgba(255,255,255,0.45)"
    : "var(--ink-300)";
  const arrowBg = "var(--lavender-600)";

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div
        className="flex items-center"
        style={{
          background: fieldBg,
          border: fieldBorder,
          borderRadius: "var(--r-pill)",
          padding: isHero ? "6px" : "4px",
          boxShadow: isHero ? "var(--sh-md)" : "none",
          maxWidth: isHero ? "480px" : "100%",
          transition: "box-shadow 200ms var(--ease-standard)",
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          aria-label="Adresse e-mail"
          className="flex-1 bg-transparent focus:outline-none"
          style={{
            fontFamily: "var(--font-display)",
            color: fieldText,
            fontSize: isHero ? "16px" : "14px",
            padding: isHero ? "12px 8px 12px 18px" : "8px 6px 8px 14px",
            border: "none",
            // @ts-expect-error custom CSS var consumed by ::placeholder via global rule
            "--ph-color": fieldPlaceholder,
          }}
        />
        <button
          type="submit"
          disabled={pending}
          aria-label={pending ? "Envoi en cours" : cta}
          className="flex shrink-0 items-center justify-center rounded-full font-semibold transition-all disabled:opacity-60"
          style={{
            background: arrowBg,
            color: "#ffffff",
            width: isHero ? "44px" : "36px",
            height: isHero ? "44px" : "36px",
          }}
        >
          {pending ? (
            <svg
              width={isHero ? 18 : 14}
              height={isHero ? 18 : 14}
              viewBox="0 0 24 24"
              className="animate-spin"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          ) : (
            <svg
              width={isHero ? 16 : 14}
              height={isHero ? 16 : 14}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          )}
        </button>
      </div>
      {state ? (
        <p
          className="mt-3 text-[13px]"
          style={{
            fontFamily: "var(--font-display)",
            color: state.ok
              ? "var(--forest-600)"
              : "var(--terracotta-500)",
          }}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
