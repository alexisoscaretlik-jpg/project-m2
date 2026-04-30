"use client";

import { Widget } from "@typeform/embed-react";

// Wrapper around Typeform's official embed. The user_id is passed as a
// hidden field — Typeform forwards it back to /api/typeform/webhook
// where it's stored in `typeform_responses.user_id`.
//
// Required env: NEXT_PUBLIC_TYPEFORM_FORM_ID — the form id from
// Typeform's editor URL (the segment after /to/). Falls back to a
// placeholder so the layout renders even if the env isn't set.

export function TypeformEmbed({
  userId,
  email,
}: {
  userId: string;
  email?: string | null;
}) {
  const formId =
    process.env.NEXT_PUBLIC_TYPEFORM_FORM_ID ?? "placeholder-form-id";

  return (
    <div
      style={{
        height: "640px",
        background: "var(--paper-0)",
        border: "1px solid var(--ink-700)",
      }}
    >
      <Widget
        id={formId}
        hidden={{
          user_id: userId,
          ...(email ? { email } : {}),
        }}
        style={{ width: "100%", height: "100%" }}
        className="ic-typeform-widget"
      />
    </div>
  );
}
