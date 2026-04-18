"use server";

import { createClient } from "@supabase/supabase-js";

import { emailConfigured, send } from "@/lib/email";
import { publicSupabaseEnv } from "@/lib/supabase/public-env";
import { welcomeHtml, welcomeText } from "@/lib/newsletter/templates";
import { weeklyTip } from "@/lib/newsletter/tips";

export type SubscribeResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribe(formData: FormData): Promise<SubscribeResult> {
  try {
    const raw = String(formData.get("email") ?? "").trim().toLowerCase();
    const source = String(formData.get("source") ?? "landing");

    if (!EMAIL_RE.test(raw)) {
      return { ok: false, message: "Email invalide." };
    }

    const { url, anon } = publicSupabaseEnv();
    const sb = createClient(url, anon, { auth: { persistSession: false } });

    const { error } = await sb
      .from("newsletter_subscribers")
      .upsert(
        { email: raw, source, unsubscribed: false },
        { onConflict: "email" },
      );

    if (error) {
      console.error("newsletter subscribe error", error);
      if (error.code === "42P01") {
        return {
          ok: false,
          message:
            "Newsletter pas encore active. On a noté — retente dans quelques minutes.",
        };
      }
      return {
        ok: false,
        message: error.message || "Erreur. Réessaie dans un instant.",
      };
    }

    // Welcome email — best-effort, bundled with this week's rotating tip.
    if (emailConfigured()) {
      try {
        const tip = weeklyTip();
        await send({
          to: raw,
          subject: `Bienvenue — ${tip.title}`,
          html: welcomeHtml(tip),
          text: welcomeText(tip),
        });
      } catch (err) {
        console.error("welcome email failed", err);
      }
    }

    return {
      ok: true,
      message: emailConfigured()
        ? "Inscrit — surveille ta boîte mail."
        : "Inscrit. On t'écrira bientôt.",
    };
  } catch (err) {
    console.error("newsletter subscribe threw", err);
    return {
      ok: false,
      message: "Erreur inattendue. Réessaie dans un instant.",
    };
  }
}
