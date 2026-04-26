// Minimal Resend wrapper — avoid pulling a full SDK just to POST JSON.
// Set RESEND_API_KEY and EMAIL_FROM (e.g. "Invest Coach <hi@yourdomain.fr>").
// If env isn't configured, send() is a no-op that returns false so callers
// don't have to special-case it during dev/preview.

export type Email = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
};

export function emailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function send(email: Email): Promise<boolean> {
  if (!emailConfigured()) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: Array.isArray(email.to) ? email.to : [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      reply_to: email.replyTo,
      ...(email.trackOpens !== undefined && { track_opens: email.trackOpens }),
      ...(email.trackClicks !== undefined && { track_clicks: email.trackClicks }),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend failed (${res.status}): ${body}`);
  }
  return true;
}
