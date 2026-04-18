"use server";

import { serviceClient } from "@/lib/supabase/service";
import { emailConfigured, send } from "@/lib/email";

export type SubscribeResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribe(formData: FormData): Promise<SubscribeResult> {
  const raw = String(formData.get("email") ?? "").trim().toLowerCase();
  const source = String(formData.get("source") ?? "landing");

  if (!EMAIL_RE.test(raw)) {
    return { ok: false, message: "Email invalide." };
  }

  const sb = serviceClient();
  const { error } = await sb
    .from("newsletter_subscribers")
    .upsert(
      { email: raw, source, unsubscribed: false },
      { onConflict: "email" },
    );

  if (error) {
    return { ok: false, message: "Erreur. Réessaie dans un instant." };
  }

  // Welcome email — best-effort, don't fail the signup if Resend is
  // mis-configured on this environment.
  if (emailConfigured()) {
    try {
      await send({
        to: raw,
        subject: "Bienvenue chez Invest Coach",
        html: WELCOME_HTML,
        text: WELCOME_TEXT,
      });
    } catch {
      // swallow — subscription already recorded
    }
  }

  return {
    ok: true,
    message: "Inscrit — surveille ta boîte mail.",
  };
}

const WELCOME_HTML = `
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
  <h1 style="font-size:22px;margin:0 0 12px;">Bienvenue 🇫🇷</h1>
  <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
    Merci de t'inscrire à <strong>Invest Coach</strong> — ton coach
    d'investissement personnel.
  </p>
  <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
    Chaque semaine, tu recevras :
  </p>
  <ul style="font-size:15px;line-height:1.7;padding-left:20px;margin:0 0 16px;">
    <li>Les cartes IA des entreprises de ta watchlist</li>
    <li>Une astuce fiscale concrète pour ton profil</li>
    <li>Un rappel sur l'arbitrage PEA / assurance-vie / PER</li>
  </ul>
  <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
    À bientôt,<br/>L'équipe Invest Coach
  </p>
  <p style="font-size:12px;color:#64748b;margin:32px 0 0;">
    Tu peux te désinscrire à tout moment en répondant à cet email.
  </p>
</div>`;

const WELCOME_TEXT = `Bienvenue chez Invest Coach.

Chaque semaine tu recevras : les cartes IA de ta watchlist, une astuce
fiscale concrète, et un rappel sur l'arbitrage PEA/assurance-vie/PER.

Pour te désinscrire, réponds à cet email.`;
