"use server";

// Server actions for /admin/notes. Polish raw input via Gemini, store both
// raw + polished in private_notes. Never reachable by the anon key.

import { revalidatePath } from "next/cache";

import { serviceClient } from "@/lib/supabase/service";

const POLISH_PROMPT = `You are a private research assistant for a French retail investor who is LEARNING from paid financial-analyst broadcasts, conference calls, and articles.

The user will paste raw text below. You distill it into their private learning log — never a redistribution. Paraphrase aggressively, do NOT reproduce the source verbatim.

Output in the input's language (French if the input is French, English otherwise). Be ruthless about signal-to-noise. No filler, no hedging, no "I hope this helps".

OUTPUT STRUCTURE (exact markdown headings, no prefix, no sign-off):

## TL;DR
Two sentences. What happened and why it matters to a retail investor.

## Key points
3-6 bullets. High signal, short. No sentences over ~20 words.

## Tickers / assets mentioned
Comma-separated ticker list, or "None".

## Action items for me
Research / verify / watch tasks the reader should do on their own.

## Open questions
What wasn't covered that matters? What should I chase next?

INPUT:
---
{RAW}
---`;

export async function polishAndSave(formData: FormData): Promise<void> {
  const raw    = ((formData.get("raw")    as string | null) ?? "").trim();
  const source = ((formData.get("source") as string | null) ?? "").trim() || null;

  if (!raw) throw new Error("raw input is empty");
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set on the m2 server");

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  // Dynamic import so the build doesn't fail when @google/genai is not yet installed.
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model,
    contents: POLISH_PROMPT.replace("{RAW}", raw),
  });

  const polished = (response.text ?? "").trim();
  if (!polished) throw new Error("Gemini returned an empty body");

  const sb = serviceClient();
  const { error } = await sb.from("private_notes").insert({
    source,
    raw_input: raw,
    polished,
  });
  if (error) throw new Error(`insert failed: ${error.message}`);

  revalidatePath("/admin/notes");
}

export async function deleteNote(id: number): Promise<void> {
  const sb = serviceClient();
  const { error } = await sb.from("private_notes").delete().eq("id", id);
  if (error) throw new Error(`delete failed: ${error.message}`);
  revalidatePath("/admin/notes");
}
