// Email templates for Invest Coach. All content in French, built with
// inline styles (email clients strip <style>), tested on Gmail, Outlook,
// Apple Mail, and iOS Mail.

import { Tip } from "./tips";

const BRAND = {
  primary: "#2563eb",
  ink: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  soft: "#f1f5f9",
  gold: "#ca8a04",
};

const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://trading-bot-2-opal.vercel.app";

function utmUrl(path: string, campaign: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${APP_URL}${path}${sep}utm_source=newsletter&utm_medium=email&utm_campaign=${encodeURIComponent(campaign)}`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function md(text: string): string {
  // Minimal markdown -> HTML for tip bodies.
  return esc(text)
    .replace(/\n\n/g, "</p><p style=\"margin:0 0 12px;font-size:15px;line-height:1.6;color:#334155;\">")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function shell(innerHtml: string, preheader: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Invest Coach</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.soft};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="display:none;font-size:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${esc(preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BRAND.soft};">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#fff;border-radius:14px;border:1px solid ${BRAND.border};overflow:hidden;">
      <tr><td style="padding:24px 28px 8px;border-bottom:1px solid ${BRAND.border};">
        <a href="${APP_URL}" style="text-decoration:none;color:${BRAND.ink};">
          <span style="font-size:18px;font-weight:700;letter-spacing:-0.2px;">Invest Coach</span>
          <span style="font-size:12px;color:${BRAND.muted};margin-left:6px;">· Le Hebdo</span>
        </a>
      </td></tr>
      <tr><td style="padding:24px 28px;">${innerHtml}</td></tr>
      <tr><td style="padding:16px 28px;border-top:1px solid ${BRAND.border};background:${BRAND.soft};">
        <p style="margin:0 0 6px;font-size:12px;color:${BRAND.muted};">
          Invest Coach · Paris · Contenu éducatif, pas un conseil en investissement.
        </p>
        <p style="margin:0;font-size:12px;color:${BRAND.muted};">
          <a href="${APP_URL}" style="color:${BRAND.muted};">Ouvrir l'app</a>
          · <a href="mailto:hi@investcoach.fr?subject=Désinscription" style="color:${BRAND.muted};">Me désinscrire</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ──────────────────────────────────────────────────────────────
// Welcome email
// ──────────────────────────────────────────────────────────────

export function welcomeHtml(firstTip: Tip): string {
  const body = `
<h1 style="margin:0 0 8px;font-size:26px;line-height:1.2;color:${BRAND.ink};">
  Bienvenue 👋
</h1>
<p style="margin:0 0 18px;font-size:16px;color:${BRAND.muted};">
  Content de t'avoir avec nous. Tu viens de rejoindre des centaines d'investisseurs français qui reprennent la main sur leur patrimoine.
</p>

<div style="border:1px solid ${BRAND.border};border-radius:12px;padding:18px;margin:0 0 20px;background:${BRAND.soft};">
  <p style="margin:0 0 6px;font-size:12px;color:${BRAND.primary};font-weight:700;text-transform:uppercase;letter-spacing:0.3px;">
    Ton premier guide
  </p>
  <h2 style="margin:0 0 10px;font-size:18px;color:${BRAND.ink};">
    ${esc(firstTip.title)}
  </h2>
  <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#334155;">${md(firstTip.body)}</p>
  ${
    firstTip.cta
      ? `<a href="${APP_URL}${firstTip.cta.href}" style="display:inline-block;margin-top:8px;padding:10px 18px;background:${BRAND.primary};color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">${esc(firstTip.cta.label)} →</a>`
      : ""
  }
</div>

<h3 style="margin:24px 0 10px;font-size:16px;color:${BRAND.ink};">Ce que tu vas recevoir chaque mardi</h3>
<ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.7;color:#334155;">
  <li><strong>Le chiffre de la semaine</strong> — une donnée marché qui compte, expliquée simplement.</li>
  <li><strong>3 filings à ne pas rater</strong> — cartes IA des entreprises qui ont publié.</li>
  <li><strong>L'astuce fiscale</strong> — un levier concret pour ton TMI.</li>
  <li><strong>Ton action de la semaine</strong> — 5 minutes pour faire bouger ton patrimoine.</li>
</ul>

<p style="margin:16px 0 0;font-size:14px;color:${BRAND.muted};">
  Prochaine édition : <strong>mardi matin 7h</strong>.<br/>
  En attendant, jette un œil à tes outils :
</p>
<p style="margin:8px 0 0;font-size:14px;">
  <a href="${APP_URL}/simulation" style="color:${BRAND.primary};">→ Simulateur PEA / AV / PER</a><br/>
  <a href="${APP_URL}/articles" style="color:${BRAND.primary};">→ Bibliothèque de guides</a><br/>
  <a href="${APP_URL}/markets" style="color:${BRAND.primary};">→ Tableau des marchés en direct</a>
</p>

<p style="margin:28px 0 0;font-size:14px;color:${BRAND.muted};">
  À mardi,<br/><strong style="color:${BRAND.ink};">L'équipe Invest Coach</strong>
</p>`;

  return shell(body, `Bienvenue — ton premier guide : ${firstTip.title}`);
}

export function welcomeText(firstTip: Tip): string {
  const lines = [
    "Bienvenue chez Invest Coach.",
    "",
    "Tu viens de rejoindre des centaines d'investisseurs français qui reprennent la main sur leur patrimoine.",
    "",
    "── TON PREMIER GUIDE ──",
    firstTip.title,
    "",
    firstTip.body,
    firstTip.cta ? `\n→ ${firstTip.cta.label}: ${APP_URL}${firstTip.cta.href}` : "",
    "",
    "── CHAQUE MARDI MATIN TU RECEVRAS ──",
    "· Le chiffre de la semaine",
    "· 3 filings à ne pas rater (analyses IA)",
    "· L'astuce fiscale de la semaine",
    "· Ton action concrète (5 minutes)",
    "",
    "Prochaine édition : mardi 7h.",
    "",
    `Outils disponibles tout de suite :`,
    `· Simulateur : ${APP_URL}/simulation`,
    `· Guides : ${APP_URL}/articles`,
    `· Marchés : ${APP_URL}/markets`,
    "",
    "À mardi,",
    "L'équipe Invest Coach",
    "",
    "Pour te désinscrire, réponds simplement à cet email.",
  ];
  return lines.filter((l) => l !== undefined).join("\n");
}

// ──────────────────────────────────────────────────────────────
// Weekly digest
// ──────────────────────────────────────────────────────────────

export type DigestCard = {
  ticker: string;
  company: string;
  title: string;
  tone: string | null;
  slug?: string | null;
};

export type DigestTweet = {
  handle: string;      // without the @
  name: string;        // display name
  text: string;        // tweet body (may be multiline)
  url: string;         // permalink
  createdAt: Date;
  engagement: number;  // like_count + retweet_count + reply_count + quote_count
};

export type DigestKevinBrief = {
  title: string;
  date: Date;
  videoId: string;
  polished: string; // Claude's French distillation (markdown)
};

export type DigestInput = {
  cards: DigestCard[];
  tip: Tip;
  weekOf: Date;
  // Optional "chiffre de la semaine" — a quick market data point.
  metric?: { value: string; label: string; context: string };
  // Optional — curated original posts from the followed creator, last 7 days.
  tweets?: DigestTweet[];
  // Optional — Meet Kevin livestream briefings from the past 7 days,
  // auto-generated by the kevin-watcher pipeline (watch_kevin.py).
  kevinBriefs?: DigestKevinBrief[];
  // Tracking: ISO week tag e.g. "W18" for UTM params; pixel URL for open tracking.
  campaign?: string;
  trackPixelUrl?: string;
};

const TONE_META: Record<string, { label: string; color: string; emoji: string }> = {
  bullish: { label: "Haussier", color: "#047857", emoji: "📈" },
  red_flag: { label: "Signal rouge", color: "#be123c", emoji: "🚩" },
  cautious: { label: "Prudence", color: "#b45309", emoji: "⚠️" },
  educational: { label: "À savoir", color: "#475569", emoji: "💡" },
};

function tweetExcerpt(text: string, max = 220): string {
  // Collapse whitespace so multi-paragraph tweets don't blow up the block.
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  // Cut on last space to avoid mid-word truncation.
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + "…";
}

function tweetBlock(t: DigestTweet): string {
  const fmt = t.createdAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
  return `
    <a href="${esc(t.url)}" style="display:block;margin:0 0 10px;padding:12px 14px;border:1px solid ${BRAND.border};border-radius:10px;text-decoration:none;color:inherit;background:#fafafa;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;font-size:12px;color:${BRAND.muted};">
        <span><strong style="color:${BRAND.ink};">${esc(t.name)}</strong> · @${esc(t.handle)}</span>
        <span>${esc(fmt)}</span>
      </div>
      <div style="font-size:14px;line-height:1.5;color:#1e293b;margin:0 0 6px;">${esc(tweetExcerpt(t.text))}</div>
      <div style="font-size:11px;color:${BRAND.muted};">
        ${t.engagement.toLocaleString("fr-FR")} interactions · lire sur X →
      </div>
    </a>`;
}

// Rough markdown → HTML for the Kevin briefing bodies. Not a full parser —
// handles the structure Claude emits: `##`/`#` headings, bullets, `**bold**`.
function inline(s: string): string {
  return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function renderBrief(mdText: string): string {
  const lines = mdText.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) { out.push("</ul>"); inList = false; }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { closeList(); continue; }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      if (!inList) {
        out.push(`<ul style="margin:4px 0 8px 18px;padding:0;font-size:14px;line-height:1.55;color:#334155;">`);
        inList = true;
      }
      out.push(`<li style="margin:2px 0;">${inline(bullet[1])}</li>`);
      continue;
    }
    closeList();
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      out.push(`<p style="margin:12px 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;color:${BRAND.primary};font-weight:700;">${inline(h2[1])}</p>`);
      continue;
    }
    const h1 = line.match(/^#\s+(.*)$/);
    if (h1) {
      out.push(`<p style="margin:0 0 6px;font-size:15px;font-weight:700;color:${BRAND.ink};">${inline(h1[1])}</p>`);
      continue;
    }
    out.push(`<p style="margin:0 0 6px;font-size:14px;line-height:1.55;color:#334155;">${inline(line)}</p>`);
  }
  closeList();
  return out.join("");
}

function kevinBlock(b: DigestKevinBrief): string {
  const fmt = b.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const url = `https://www.youtube.com/watch?v=${encodeURIComponent(b.videoId)}`;
  return `
    <div style="margin:0 0 14px;padding:14px 16px;border:1px solid ${BRAND.border};border-radius:10px;background:#fafafa;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;font-size:12px;color:${BRAND.muted};">
        <span><strong style="color:${BRAND.ink};">Analyse vidéo · IA</strong> · ${esc(fmt)}</span>
        <a href="${url}" style="color:${BRAND.muted};text-decoration:underline;">voir la source →</a>
      </div>
      ${renderBrief(b.polished)}
    </div>`;
}

function cardBlock(c: DigestCard, campaign: string): string {
  const t = TONE_META[c.tone ?? "educational"] ?? TONE_META.educational;
  const href = utmUrl(`/ticker/${encodeURIComponent(c.ticker)}`, campaign);
  return `
    <a href="${href}" style="display:block;margin:0 0 12px;padding:14px 16px;border:1px solid ${BRAND.border};border-radius:10px;text-decoration:none;color:inherit;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
        <span style="font-family:ui-monospace,Menlo,monospace;font-weight:700;font-size:13px;color:${BRAND.ink};">${esc(c.ticker)}</span>
        <span style="font-size:11px;color:${t.color};font-weight:600;">${t.emoji} ${t.label}</span>
      </div>
      <div style="font-size:12px;color:${BRAND.muted};margin-bottom:6px;">${esc(c.company)}</div>
      <div style="font-size:15px;line-height:1.45;color:${BRAND.ink};">${esc(c.title)}</div>
    </a>`;
}

export function digestHtml({ cards, tip, weekOf, metric, tweets, kevinBriefs, campaign = "newsletter", trackPixelUrl }: DigestInput): string {
  const fmtDate = weekOf.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const inner = `
<p style="margin:0 0 4px;font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.3px;font-weight:700;">
  Semaine du ${esc(fmtDate)}
</p>
<h1 style="margin:0 0 20px;font-size:26px;line-height:1.2;color:${BRAND.ink};">
  Ta dose d'investissement
</h1>

${
  metric
    ? `<div style="margin:0 0 24px;padding:16px 18px;background:linear-gradient(135deg,#1e293b,#1e40af);border-radius:12px;color:#fff;">
  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.4px;color:#93c5fd;font-weight:700;">Le chiffre de la semaine</p>
  <p style="margin:0 0 6px;font-size:32px;font-weight:800;line-height:1;">${esc(metric.value)}</p>
  <p style="margin:0 0 8px;font-size:14px;color:#cbd5e1;">${esc(metric.label)}</p>
  <p style="margin:0;font-size:13px;line-height:1.5;color:#e2e8f0;">${esc(metric.context)}</p>
</div>`
    : ""
}

<h2 style="margin:24px 0 10px;font-size:16px;color:${BRAND.ink};">À ne pas rater cette semaine</h2>
${cards.length > 0 ? cards.map((c) => cardBlock(c, campaign)).join("") : `<p style="font-size:14px;color:${BRAND.muted};">Semaine calme côté filings. On revient la semaine prochaine.</p>`}

${
  kevinBriefs && kevinBriefs.length > 0
    ? `<h2 style="margin:24px 0 6px;font-size:16px;color:${BRAND.ink};">Décryptage IA · ${kevinBriefs.length} analyse${kevinBriefs.length === 1 ? "" : "s"} cette semaine</h2>
<p style="margin:0 0 10px;font-size:12px;color:${BRAND.muted};">Synthèses IA de livestreams financiers · transcription + distillation automatisée · 99 % signal.</p>
${kevinBriefs.map(kevinBlock).join("")}`
    : ""
}

${
  tweets && tweets.length > 0
    ? `<h2 style="margin:24px 0 4px;font-size:16px;color:${BRAND.ink};">Ça se passe sur X cette semaine</h2>
<p style="margin:0 0 10px;font-size:12px;color:${BRAND.muted};">Les posts les plus partagés de <a href="https://x.com/${esc(tweets[0].handle)}" style="color:${BRAND.muted};">@${esc(tweets[0].handle)}</a></p>
${tweets.map(tweetBlock).join("")}`
    : ""
}

<div style="margin:24px 0;padding:18px;border-left:3px solid ${BRAND.gold};background:#fefce8;border-radius:0 10px 10px 0;">
  <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.4px;color:${BRAND.gold};font-weight:700;">L'astuce fiscale</p>
  <h3 style="margin:0 0 10px;font-size:17px;color:${BRAND.ink};">${esc(tip.title)}</h3>
  <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#3f3f46;">${md(tip.body)}</p>
  ${
    tip.cta
      ? `<a href="${utmUrl(tip.cta.href, campaign)}" style="display:inline-block;padding:8px 14px;background:${BRAND.ink};color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">${esc(tip.cta.label)}</a>`
      : ""
  }
</div>

<h2 style="margin:24px 0 8px;font-size:16px;color:${BRAND.ink};">Ton action de la semaine</h2>
<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#334155;">
  Ouvre ton simulateur, entre ton épargne mensuelle réelle et projette sur 20 ans.
  Compare les enveloppes. Si tu découvres un écart > 30 000€ entre PEA et CTO, tu sais ce qu'il te reste à faire.
</p>
<a href="${utmUrl("/simulation", campaign)}" style="display:inline-block;padding:11px 20px;background:${BRAND.primary};color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
  Lancer le simulateur →
</a>

<p style="margin:28px 0 0;font-size:14px;color:${BRAND.muted};">
  À mardi prochain,<br/><strong style="color:${BRAND.ink};">L'équipe Invest Coach</strong>
</p>
${trackPixelUrl ? `<img src="${esc(trackPixelUrl)}" width="1" height="1" border="0" alt="" style="display:block;width:1px;height:1px;" />` : ""}`;
  return shell(inner, `Le chiffre de la semaine + ${cards.length} filings + 1 astuce fiscale`);
}

export function digestText({ cards, tip, weekOf, metric, tweets, kevinBriefs }: DigestInput): string {
  const fmtDate = weekOf.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
  const lines = [
    `Invest Coach — Le Hebdo du ${fmtDate}`,
    "",
  ];
  if (metric) {
    lines.push(
      "── LE CHIFFRE DE LA SEMAINE ──",
      `${metric.value} — ${metric.label}`,
      metric.context,
      "",
    );
  }
  lines.push("── À NE PAS RATER ──");
  if (cards.length === 0) {
    lines.push("Semaine calme côté filings.");
  } else {
    for (const c of cards) {
      const t = TONE_META[c.tone ?? "educational"] ?? TONE_META.educational;
      lines.push(`[${c.ticker}] ${t.label.toUpperCase()} · ${c.company}`);
      lines.push(c.title);
      lines.push(`${APP_URL}/ticker/${encodeURIComponent(c.ticker)}`);
      lines.push("");
    }
  }
  if (kevinBriefs && kevinBriefs.length > 0) {
    lines.push("", `── DÉCRYPTAGE IA · ${kevinBriefs.length} ANALYSE${kevinBriefs.length === 1 ? "" : "S"} ──`);
    for (const b of kevinBriefs) {
      const d = b.date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      lines.push(`[${d}] ${b.title}`);
      lines.push(b.polished.trim());
      lines.push(`→ source : https://www.youtube.com/watch?v=${b.videoId}`);
      lines.push("");
    }
  }

  if (tweets && tweets.length > 0) {
    lines.push("", `── ÇA SE PASSE SUR X (via @${tweets[0].handle}) ──`);
    for (const t of tweets) {
      const d = t.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      lines.push(`[${d}] ${tweetExcerpt(t.text, 180)}`);
      lines.push(t.url);
      lines.push("");
    }
  }

  lines.push(
    "── L'ASTUCE FISCALE ──",
    tip.title,
    "",
    tip.body,
    tip.cta ? `\n→ ${tip.cta.label}: ${APP_URL}${tip.cta.href}` : "",
    "",
    "── TON ACTION DE LA SEMAINE ──",
    "Ouvre le simulateur et compare PEA / AV / CTO / PER avec ton épargne réelle.",
    `${APP_URL}/simulation`,
    "",
    "À mardi prochain,",
    "L'équipe Invest Coach",
    "",
    "Pour te désinscrire, réponds simplement à cet email.",
  );
  return lines.join("\n");
}

export function digestSubject(d: Date): string {
  const fmt = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  return `Invest Coach · Le Hebdo du ${fmt}`;
}

// ──────────────────────────────────────────────────────────────
// Article newsletter (standalone markdown campaigns)
// Parses the plain-text body from a 2026-WXX.md campaign file and
// renders it into a send-ready email. No external deps — manual md parser.
// ──────────────────────────────────────────────────────────────

export type ArticleInput = {
  h1: string;
  bodyMd: string;       // everything after the h1
  preheader: string;
  campaign: string;     // e.g. "2026-W20"
  trackPixelUrl?: string;
};

function renderArticleBody(md: string, campaign: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) { out.push("</ul>"); inList = false; }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) { closeList(); continue; }

    // ## H2
    const h2m = line.match(/^##\s+(.+)$/);
    if (h2m) {
      closeList();
      out.push(`<h2 style="margin:24px 0 8px;font-size:17px;font-weight:700;color:${BRAND.ink};">${inline(h2m[1])}</h2>`);
      continue;
    }

    // bullet
    const bm = line.match(/^\s*[-*]\s+(.+)$/);
    if (bm) {
      if (!inList) {
        out.push(`<ul style="margin:4px 0 12px 20px;padding:0;font-size:15px;line-height:1.65;color:#334155;">`);
        inList = true;
      }
      out.push(`<li style="margin:4px 0;">${inline(bm[1])}</li>`);
      continue;
    }

    closeList();

    // CTA link — markdown [label →](path) or [label](path)
    const ctaM = line.match(/^\[(.+?)\]\((.+?)\)$/);
    if (ctaM) {
      const href = ctaM[2].startsWith("/") ? utmUrl(ctaM[2], campaign) : ctaM[2];
      out.push(`<p style="margin:20px 0 0;"><a href="${esc(href)}" style="display:inline-block;padding:11px 20px;background:${BRAND.primary};color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">${inline(ctaM[1])}</a></p>`);
      continue;
    }

    // numbered list item
    const nm = line.match(/^\d+\.\s+(.+)$/);
    if (nm) {
      if (!inList) {
        out.push(`<ol style="margin:4px 0 12px 20px;padding:0;font-size:15px;line-height:1.65;color:#334155;">`);
        inList = true;
      }
      out.push(`<li style="margin:4px 0;">${inline(nm[1])}</li>`);
      continue;
    }

    // paragraph
    out.push(`<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#334155;">${inline(line)}</p>`);
  }

  closeList();
  return out.join("\n");
}

export function articleHtml({ h1, bodyMd, preheader, campaign, trackPixelUrl }: ArticleInput): string {
  const inner = `
<h1 style="margin:0 0 20px;font-size:26px;line-height:1.25;color:${BRAND.ink};">${esc(h1)}</h1>
${renderArticleBody(bodyMd, campaign)}
<p style="margin:28px 0 0;font-size:14px;color:${BRAND.muted};">
  À bientôt,<br/><strong style="color:${BRAND.ink};">L'équipe Invest Coach</strong>
</p>
${trackPixelUrl ? `<img src="${esc(trackPixelUrl)}" width="1" height="1" style="display:none;" alt="" />` : ""}`;
  return shell(inner, preheader);
}

export function articleText({ h1, bodyMd }: ArticleInput): string {
  const lines: string[] = [h1, ""];
  for (const raw of bodyMd.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) { lines.push(""); continue; }
    // strip markdown formatting
    lines.push(
      line
        .replace(/^##\s+/, "── ")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\[(.+?)\]\((.+?)\)/g, "$1: $2"),
    );
  }
  lines.push("", "À bientôt,", "L'équipe Invest Coach", "", "Pour te désinscrire, réponds simplement à cet email.");
  return lines.join("\n");
}

export function articleSubject(h1: string): string {
  return `Invest Coach · ${h1}`;
}
