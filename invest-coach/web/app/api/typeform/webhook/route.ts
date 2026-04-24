// Typeform webhook receiver.
//
// Typeform POSTs here when a user submits the wizard on
// /tax/declaration. We verify the HMAC signature, extract the
// user_id from a hidden field the embed passes in, and insert into
// typeform_responses.
//
// Required env:
//   TYPEFORM_WEBHOOK_SECRET  — shared secret configured in the
//                              Typeform workspace when setting up
//                              the webhook.
//   TYPEFORM_FORM_ID         — the form we accept (guard against
//                              pointing the webhook at the wrong form).

import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { serviceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";       // crypto needs Node runtime
export const dynamic = "force-dynamic"; // never cache

type TypeformAnswer = {
  field?: { id?: string; ref?: string; type?: string };
  type?: string;
  text?: string;
  email?: string;
  number?: number;
  boolean?: boolean;
  choice?: { label?: string };
  choices?: { labels?: string[] };
  date?: string;
};

type TypeformPayload = {
  event_id?: string;
  event_type?: string;
  form_response?: {
    form_id?: string;
    token?: string;                    // Typeform's response UUID
    submitted_at?: string;
    hidden?: Record<string, string>;   // where we pass user_id from the embed
    answers?: TypeformAnswer[];
    definition?: { fields?: { id: string; ref?: string }[] };
  };
};

function verifySignature(rawBody: string, receivedSig: string | null): boolean {
  const secret = process.env.TYPEFORM_WEBHOOK_SECRET;
  if (!secret || !receivedSig) return false;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody).digest("base64");

  // Timing-safe comparison
  const a = Buffer.from(expected);
  const b = Buffer.from(receivedSig);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function normalizeAnswers(
  answers: TypeformAnswer[] = [],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const a of answers) {
    const key = a.field?.ref ?? a.field?.id;
    if (!key) continue;
    // Pick the first non-undefined value in priority order.
    const value =
      a.text ??
      a.email ??
      a.number ??
      a.boolean ??
      a.choice?.label ??
      a.choices?.labels ??
      a.date ??
      null;
    out[key] = value;
  }
  return out;
}

export async function POST(req: Request) {
  // Typeform sends the signature in "Typeform-Signature" header.
  const sig = req.headers.get("typeform-signature");
  const rawBody = await req.text();

  if (!verifySignature(rawBody, sig)) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let payload: TypeformPayload;
  try {
    payload = JSON.parse(rawBody) as TypeformPayload;
  } catch {
    return NextResponse.json({ error: "bad JSON" }, { status: 400 });
  }

  const formResp = payload.form_response;
  if (!formResp) {
    return NextResponse.json({ error: "no form_response" }, { status: 400 });
  }

  const expectedFormId = process.env.TYPEFORM_FORM_ID;
  if (expectedFormId && formResp.form_id !== expectedFormId) {
    return NextResponse.json({ error: "wrong form" }, { status: 403 });
  }

  const userId = formResp.hidden?.user_id;
  if (!userId) {
    return NextResponse.json(
      { error: "missing hidden.user_id — make sure the Typeform embed passes it" },
      { status: 400 },
    );
  }

  const sb = serviceClient();
  const { error } = await sb
    .from("typeform_responses")
    .upsert(
      {
        user_id: userId,
        form_id: formResp.form_id ?? "unknown",
        response_id: formResp.token ?? crypto.randomUUID(),
        submitted_at: formResp.submitted_at ?? new Date().toISOString(),
        answers: normalizeAnswers(formResp.answers),
        raw_payload: payload,
      },
      { onConflict: "response_id" },
    );

  if (error) {
    return NextResponse.json(
      { error: `db write failed: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
