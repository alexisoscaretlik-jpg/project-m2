#!/usr/bin/env node
// Run the chart-analysis pipeline LOCALLY (not in the Cloudflare Worker).
//
// Why: Cloudflare Workers cap wall-time around 30s on most plans, and a full
// 50-analysis run is ~3 minutes of sequential LLM calls. So we batch through
// the Worker for incremental top-ups (5-10 per request, fast) and use this
// local script for big initial seeds and catch-ups.
//
// The script is fully resumable: it reads which tweets are already in
// chart_analysis and skips them. Re-running on Ctrl+C or partial completion
// is safe.
//
// Usage:
//   node scripts/run-pipeline-local.mjs          # default target=50
//   node scripts/run-pipeline-local.mjs 100      # custom target
//
// Env (from .env.local):
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_URL),
//   GEMINI_API_KEY, GEMINI_MODEL (optional),
//   ANTHROPIC_API_KEY, CLAUDE_MODEL (optional),
//   TWITTER_CREATOR_HANDLE (defaults to great_martis)

import fs from "node:fs";
import path from "node:path";

const ENV_FILE = path.join(process.cwd(), ".env.local");

function readEnv() {
  if (!fs.existsSync(ENV_FILE)) return {};
  const out = {};
  for (const raw of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = { ...readEnv(), ...process.env };

const TARGET = Math.max(1, Math.min(500, parseInt(process.argv[2] ?? "50", 10) || 50));
const REGENERATE = process.argv.includes("--regenerate");
const HANDLE = (env.TWITTER_CREATOR_HANDLE || "great_martis").replace(/^@/, "");
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY = env.GEMINI_API_KEY;
const GEMINI_MODEL = env.GEMINI_MODEL || "gemini-2.5-flash";
const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = env.CLAUDE_MODEL || "claude-sonnet-4-6";

if (!SUPABASE_URL || !SERVICE_KEY) { console.error("missing supabase env"); process.exit(1); }
if (!GEMINI_KEY) { console.error("missing GEMINI_API_KEY"); process.exit(1); }
if (!ANTHROPIC_KEY) { console.error("missing ANTHROPIC_API_KEY"); process.exit(1); }

// ── Lazy-load SDKs (npm-installed in the project) ───────────────────────────
process.chdir(path.dirname(new URL(import.meta.url).pathname));
process.chdir(".."); // back to invest-coach/web

const { createClient } = await import("@supabase/supabase-js");
const { GoogleGenAI } = await import("@google/genai");
const Anthropic = (await import("@anthropic-ai/sdk")).default;

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const gemini = new GoogleGenAI({ apiKey: GEMINI_KEY });
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

// ── Prompts (mirror lib/chart-analysis.ts) ──────────────────────────────────
const GEMINI_SYSTEM = `You are a senior fintech editor's research assistant analysing posts from @great_martis, a dedicated technical-analysis trader. EVERY post he makes is about charts — even when his text is short or cryptic, the attached image is always a financial chart with clear ticker/index/asset shown.

You will receive: (a) the tweet text, AND when present (b) the attached chart image. **Use the image as the primary signal.** The chart's title strip and legend show the exact asset and timeframe; price action, indicators (RSI, MAs, Bollinger), and any drawn levels/lines are visible.

YOUR TASK:
1. Decide is_chart_analysis. **Bias: TRUE.** This account is exclusively chart commentary. Only return false if the post is OBVIOUSLY off-topic (a personal life update, a giveaway with no market reference, a pure meme with no chart attached). If a chart image is attached, almost always TRUE.
2. For each asset visible in the chart or named in the text, extract:
   - asset_slug: url-safe lowercase, e.g. "sox", "intel", "btc-usd", "eurusd", "gold", "us10y", "spx", "ndx"
   - asset_name: short French display, e.g. "Indice Semi-conducteurs (SOX)", "S&P 500 (SPX)", "Bitcoin (BTC)"
   - asset_class: "indice" | "action" | "devise" | "matiere" | "crypto" | "etf" | "obligation" | "fund" | "autre"
   - tv_symbol: EXACT TradingView symbol, e.g. "TVC:SOX", "NASDAQ:INTC", "BINANCE:BTCUSDT", "FX_IDC:EURUSD", "TVC:GOLD", "TVC:US10Y", "SP:SPX", "NASDAQ:NDX", "TVC:USOIL"
   - tv_interval: read from chart timeframe selector if visible. Daily="D", Weekly="W", 4h="240", 1h="60". Default "D".
   - tv_studies: from indicators visible in the chart. RSI panel -> "RSI@tv-basicstudies". MA line -> "MASimple@tv-basicstudies". Bollinger bands -> "BB@tv-basicstudies". MACD panel -> "MACD@tv-basicstudies". Default ["MASimple@tv-basicstudies"].
   - direction: "bullish" | "bearish" | "neutral" — read from price action + analyst's framing
   - key_levels: array of {label, value, type} with type "support"|"resistance"|"target"|"trend". Read horizontal lines / annotations from the chart and any prices in the text.

OUTPUT: strict JSON, no preamble, no markdown.

{ "is_chart_analysis": true|false, "reason_if_skipped": "string", "assets": [...] }

REMEMBER: bias toward TRUE. The cost of missing a real chart-analysis is high (no content for our readers). The cost of including a borderline one is low (we can clean up later).`;

const CLAUDE_SYSTEM = `Tu es l'éditeur en chef de Capucine, une revue financière française. Le ton: posé, littéraire, café-zinc parisien. Pas d'emojis, pas de points d'exclamation. Tu utilises "tu" et jamais "vous". Tu écris pour des épargnants français qui n'ont JAMAIS étudié l'analyse technique. Ils ne savent pas ce qu'est un "neckline", une "tête-épaules", un "RSI". Ton job est de leur traduire l'analyse de @great_martis en langage simple, sans jamais leur dire quoi faire.

On te donne un tweet d'analyse technique de @great_martis (en anglais), avec son graphique annoté, et les métadonnées extraites. Ton job:

1. **key_quote** (1-2 phrases, max 18 mots): la phrase à retenir, en français, qui PRÉSERVE la métaphore originale si elle existe. "More gaps than Swiss cheese" -> "Plus de gaps qu'un Emmental." "RSI has left Mother Earth" -> "Le RSI a quitté la Terre." Sinon écris une phrase Capucine élégante. Pas de point d'exclamation.

2. **body_md** structuré EXACTEMENT comme suit, en français, avec ces trois sections (utilise les titres tels quels):

## Ce qu'il faut retenir

Trois bullets, chacun de 12 à 22 mots, en langage simple. Décris ce que @great_martis voit sur le graphique. Si tu nommes un terme technique (tête-épaules, support, RSI), il sera défini dans le glossaire ci-dessous donc tu peux l'utiliser sans expliquer ici.

- Premier bullet
- Deuxième bullet
- Troisième bullet

## Pourquoi ça compte

Deux à trois phrases (max 60 mots) qui expliquent à un épargnant français NON-INITIÉ pourquoi cette lecture est intéressante pour lui. Pas de conseil ("achète", "vends"). Plutôt: "Quand un analyste voit X, ça veut souvent dire que Y peut suivre — c'est ce que @great_martis surveille." Garde un ton calme, journal du dimanche.

## Glossaire

Définis 2 ou 3 termes techniques utilisés dans cette analyse. Format strict, un terme par ligne avec deux-points et tiret:

- **Tête-épaules** : trois sommets sur un graphique, dont celui du milieu plus haut. Souvent annonciateur d'un retournement à la baisse.
- **Neckline** : la ligne qui relie les creux entre les trois sommets. Quand le prix passe sous cette ligne, le signal baissier est confirmé.
- **Support** : un niveau de prix où, historiquement, le titre arrête de baisser.

Choisis 2-3 termes RÉELLEMENT utilisés dans l'analyse. Si moins de 2 termes techniques apparaissent, retourne juste 2.

3. Pas d'autres titres, pas de gras dans la prose hors glossaire, pas d'emojis.

OUTPUT: JSON strict.

{ "key_quote": "...", "body_md": "## Ce qu'il faut retenir\\n\\n- ...\\n- ...\\n- ...\\n\\n## Pourquoi ça compte\\n\\n...\\n\\n## Glossaire\\n\\n- **Terme** : définition.\\n- **Terme** : définition." }

Si vraiment rien n'est éditorialisable, retourne {"key_quote": "", "body_md": ""}.`;

const ASSET_CLASSES = new Set(["indice","action","devise","matiere","crypto","etf","obligation","fund","autre"]);
const DIRECTIONS = new Set(["bullish","bearish","neutral"]);

function safeJson(raw) {
  const t = (raw ?? "").trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  try { return JSON.parse(m ? m[1] : t); } catch { return null; }
}

function slug(s) {
  return String(s ?? "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
}

// Fetch a remote image and return base64 + mime type. Skips on any network error.
async function fetchImageInline(url) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const mime = res.headers.get("content-type") || "image/jpeg";
    if (!mime.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > 8_000_000) return null; // skip empty / >8MB
    return { mimeType: mime, data: buf.toString("base64") };
  } catch {
    return null;
  }
}

async function geminiExtract(tweet) {
  // Build multimodal parts: text first, then up to 4 chart images.
  const textPart = {
    text: `Tweet from @${tweet.author_handle} on ${tweet.created_at}:\n\n${tweet.text}\n\n${
      Array.isArray(tweet.media_urls) && tweet.media_urls.length
        ? `(${tweet.media_urls.length} chart image${tweet.media_urls.length === 1 ? "" : "s"} attached below)`
        : "(no image attached — text only)"
    }`,
  };
  const imageParts = [];
  if (Array.isArray(tweet.media_urls) && tweet.media_urls.length > 0) {
    for (const url of tweet.media_urls.slice(0, 4)) {
      const img = await fetchImageInline(url);
      if (img) imageParts.push({ inlineData: img });
    }
  }
  const parts = [textPart, ...imageParts];

  // 5 attempts with exponential backoff — Gemini's free tier hits 503 often
  // and recovers within ~30s. 5 × 5s base = up to ~75s patience per tweet.
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      const delay = 5000 * Math.pow(1.7, attempt - 1); // 5s, 8.5s, 14s, 24s
      await new Promise(r => setTimeout(r, delay));
    }
    try {
      const result = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts }],
        config: { systemInstruction: GEMINI_SYSTEM, temperature: 0.2, responseMimeType: "application/json" },
      });
      const parsed = safeJson(result.text ?? "");
      if (!parsed) return null;
      if (!parsed.is_chart_analysis) return { is_chart_analysis: false };
      if (!Array.isArray(parsed.assets)) return null;
      const cleaned = [];
      for (const a of parsed.assets) {
        if (!a?.asset_slug || !a?.asset_name || !a?.tv_symbol) continue;
        if (!ASSET_CLASSES.has(a.asset_class)) continue;
        if (!DIRECTIONS.has(a.direction)) continue;
        cleaned.push({
          asset_slug: slug(a.asset_slug),
          asset_name: String(a.asset_name).slice(0, 120),
          asset_class: a.asset_class,
          tv_symbol: String(a.tv_symbol).toUpperCase(),
          tv_interval: a.tv_interval ?? "D",
          tv_studies: Array.isArray(a.tv_studies) && a.tv_studies.length ? a.tv_studies : ["MASimple@tv-basicstudies"],
          direction: a.direction,
          key_levels: Array.isArray(a.key_levels) ? a.key_levels : [],
        });
      }
      return { is_chart_analysis: cleaned.length > 0, assets: cleaned };
    } catch (e) {
      if (attempt === MAX_ATTEMPTS - 1) throw e;
      const msg = e?.message ?? "";
      // Only worth retrying on transient errors (503, rate limits, timeouts).
      if (!/503|429|UNAVAILABLE|timeout|deadline|RESOURCE_EXHAUSTED/i.test(msg)) {
        throw e;
      }
    }
  }
  return null;
}

async function claudeEditorialize(tweet, asset) {
  const userMsg = `Tweet original (en anglais) de @${tweet.author_handle}, ${tweet.created_at}:
"""
${tweet.text}
"""

Asset précis: ${asset.asset_name} (${asset.tv_symbol}, classe: ${asset.asset_class}, direction: ${asset.direction}).
Niveaux mentionnés: ${asset.key_levels.length === 0 ? "aucun explicite" : asset.key_levels.map(k => `${k.label} ${k.value} (${k.type})`).join(", ")}.

Réponds en JSON strict.`;

  const msg = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1200,
    system: CLAUDE_SYSTEM,
    messages: [{ role: "user", content: userMsg }],
  });
  const block = msg.content.find(c => c.type === "text");
  if (!block) return null;
  const parsed = safeJson(block.text);
  if (!parsed?.body_md || !parsed?.key_quote) return null;
  return parsed;
}

// ── Main loop ───────────────────────────────────────────────────────────────
console.log(`▶︎ Pipeline starting · target=${TARGET} · handle=@${HANDLE}`);
console.log(`  Models: ${GEMINI_MODEL} (vision extract) + ${CLAUDE_MODEL} (editorial)`);
console.log("");

// ── Backfill media_urls if any tweet still has empty media (vision upgrade) ─
const { count: missingMedia } = await sb
  .from("tweets")
  .select("id", { count: "exact", head: true })
  .eq("author_handle", HANDLE)
  .eq("media_urls", "{}");

if ((missingMedia ?? 0) > 0 && env.TWITTER_BEARER_TOKEN) {
  console.log(`  ⚠ ${missingMedia} tweets missing media_urls — running backfill via X API…`);
  try {
    // Resolve user id
    const u = await fetch(
      `https://api.x.com/2/users/by/username/${encodeURIComponent(HANDLE)}`,
      { headers: { Authorization: `Bearer ${env.TWITTER_BEARER_TOKEN}` } },
    );
    const userResp = await u.json();
    const userId = userResp?.data?.id;
    if (!userId) throw new Error("user resolve failed");

    // Pull last 30 days with media expansion
    const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let nextToken;
    let pulled = 0, withMedia = 0;
    do {
      const qs = new URLSearchParams({
        max_results: "100",
        "tweet.fields": "created_at,public_metrics,entities,attachments",
        expansions: "attachments.media_keys",
        "media.fields": "url,preview_image_url,type",
        exclude: "retweets,replies",
        start_time: sinceIso,
      });
      if (nextToken) qs.set("pagination_token", nextToken);
      const r = await fetch(
        `https://api.x.com/2/users/${userId}/tweets?${qs}`,
        { headers: { Authorization: `Bearer ${env.TWITTER_BEARER_TOKEN}` } },
      );
      const body = await r.json();
      const mediaByKey = {};
      for (const m of body.includes?.media ?? []) mediaByKey[m.media_key] = m;

      const updates = (body.data ?? []).map((t) => {
        const keys = t.attachments?.media_keys ?? [];
        const urls = [];
        for (const k of keys) {
          const m = mediaByKey[k];
          if (!m) continue;
          if (m.type === "photo" && m.url) urls.push(m.url);
          else if (m.preview_image_url) urls.push(m.preview_image_url);
        }
        if (urls.length > 0) withMedia++;
        pulled++;
        return { id: t.id, media_urls: urls };
      });

      // Update in place — only the media_urls field, keyed on existing tweet id.
      for (const u of updates) {
        await sb.from("tweets").update({ media_urls: u.media_urls }).eq("id", u.id);
      }

      nextToken = body.meta?.next_token;
    } while (nextToken && pulled < 600);

    console.log(`  ✓ Backfilled ${pulled} tweets, ${withMedia} with media`);
  } catch (e) {
    console.error(`  ✗ Media backfill failed: ${e.message}`);
    console.error(`     Continuing with text-only — coverage will be limited.`);
  }
  console.log("");
}

const { data: tweets, error: tErr } = await sb
  .from("tweets")
  .select("id, text, created_at, url, author_handle, media_urls")
  .eq("author_handle", HANDLE)
  .order("created_at", { ascending: false })
  .limit(600);
if (tErr) { console.error(`tweets fetch failed: ${tErr.message}`); process.exit(1); }
console.log(`  ${tweets.length} tweets in inventory`);

const { data: doneRows } = await sb
  .from("chart_analysis")
  .select("tweet_id")
  .in("tweet_id", tweets.map(t => t.id));
const doneIds = REGENERATE ? new Set() : new Set((doneRows ?? []).map(r => r.tweet_id));
if (REGENERATE) {
  console.log(`  --regenerate flag set: re-processing all ${tweets.length} tweets`);
} else {
  console.log(`  ${doneIds.size} tweets already processed`);
}

let written = 0, skippedNotChart = 0, skippedDone = 0, failed = 0, considered = 0;
const perClass = {};
const errors = [];

for (const t of tweets) {
  if (written >= TARGET) break;
  considered++;
  if (doneIds.has(t.id)) { skippedDone++; continue; }

  let extraction;
  try {
    extraction = await geminiExtract(t);
  } catch (e) {
    failed++; errors.push(`gemini ${t.id}: ${e.message}`);
    continue;
  }
  if (!extraction || !extraction.is_chart_analysis || !extraction.assets?.length) {
    skippedNotChart++;
    continue;
  }

  for (const asset of extraction.assets) {
    if (written >= TARGET) break;
    let editorial;
    try {
      editorial = await claudeEditorialize(t, asset);
    } catch (e) {
      failed++; errors.push(`claude ${t.id}/${asset.asset_slug}: ${e.message}`);
      continue;
    }
    if (!editorial?.body_md) { failed++; continue; }

    const { error: upErr } = await sb.from("chart_analysis").upsert({
      tweet_id: t.id,
      asset_slug: asset.asset_slug,
      asset_name: asset.asset_name,
      asset_class: asset.asset_class,
      tv_symbol: asset.tv_symbol,
      tv_interval: asset.tv_interval,
      tv_studies: asset.tv_studies,
      direction: asset.direction,
      key_quote: editorial.key_quote,
      body_md: editorial.body_md,
      key_levels: asset.key_levels,
      model: `${GEMINI_MODEL}+${CLAUDE_MODEL}`,
      tweet_created_at: t.created_at,
    }, { onConflict: "tweet_id,asset_slug" });

    if (upErr) {
      failed++; errors.push(`upsert ${t.id}/${asset.asset_slug}: ${upErr.message}`);
      continue;
    }
    written++;
    perClass[asset.asset_class] = (perClass[asset.asset_class] ?? 0) + 1;
    process.stdout.write(`\r  written: ${written}/${TARGET} · skipped (not chart): ${skippedNotChart} · failed: ${failed}     `);
  }
}

console.log("");
console.log("");
console.log("▶︎ Done.");
console.log(JSON.stringify({
  tweets_considered: considered,
  tweets_skipped_not_chart: skippedNotChart,
  tweets_skipped_already_done: skippedDone,
  tweets_failed: failed,
  analyses_written: written,
  per_class: perClass,
  errors: errors.slice(0, 10),
}, null, 2));
console.log("");
console.log(`Open: https://project-m2.alexisoscaretlik.workers.dev/charts`);
