// Chart-analysis pipeline.
//
//   tweets (raw @great_martis posts)
//      ↓ Gemini Flash:   "Is this a chart-analysis tweet? If yes, what asset(s)?
//                         What class? Direction? Levels? TradingView symbol?"
//      ↓ Claude API:     "Translate to French in Capucine voice, preserving
//                         vivid metaphors and the analyst's stance"
//      ↓
//   chart_analysis rows (one per tweet × asset)
//
// The two-LLM split is deliberate: Gemini Flash is cheap+fast for
// classification + structured extraction. Claude is better at editorial
// prose that retains the source's voice (Sunday-paper tone) without
// flattening colorful turns of phrase.

import type { SupabaseClient } from "@supabase/supabase-js";

export type AssetClass =
  | "indice"
  | "action"
  | "devise"
  | "matiere"
  | "crypto"
  | "etf"
  | "obligation"
  | "fund"
  | "autre";

export type Direction = "bullish" | "bearish" | "neutral";

export type ExtractedAsset = {
  asset_slug: string;
  asset_name: string;
  asset_class: AssetClass;
  tv_symbol: string;
  tv_interval: "1" | "5" | "15" | "30" | "60" | "240" | "D" | "W" | "M";
  tv_studies: string[];
  direction: Direction;
  key_levels: { label: string; value: string; type: "support" | "resistance" | "target" | "trend" }[];
};

export type Extraction = {
  is_chart_analysis: boolean;
  reason_if_skipped?: string;
  assets: ExtractedAsset[];
};

export type Editorial = {
  key_quote: string;
  body_md: string;
};

export type Tweet = {
  id: string;
  text: string;
  created_at: string;
  url: string;
  author_handle: string;
};

const ASSET_CLASSES = new Set<AssetClass>([
  "indice",
  "action",
  "devise",
  "matiere",
  "crypto",
  "etf",
  "obligation",
  "fund",
  "autre",
]);

const DIRECTIONS = new Set<Direction>(["bullish", "bearish", "neutral"]);

function safeJson<T>(raw: string): T | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  const body = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

const GEMINI_SYSTEM = `You are a senior fintech editor's research assistant. Your only job is to look at a single tweet from technical-analysis trader @great_martis (English-speaking) and extract structured metadata.

You must decide:
1. Is this tweet a chart analysis (any commentary on price action, levels, indicators, gaps, trends, divergences for ANY asset)? Or is it a meme, a retweet, a personal aside, a giveaway, etc.? If not chart analysis → set is_chart_analysis: false and stop.
2. If yes: which ASSET(S) is the analysis about? An asset is anything chartable: a single stock, an index, a sector, a currency pair, a crypto, a commodity, an ETF, a bond, a fund. There can be multiple per tweet.
3. For each asset, identify:
   - asset_slug: a url-safe lowercase slug, e.g. "sox", "intel", "btc-usd", "eurusd", "gold", "us10y"
   - asset_name: a short French display name including the ticker if useful, e.g. "Indice Semi-conducteurs (SOX)", "Intel (INTC)", "Bitcoin (BTC)"
   - asset_class: exactly one of "indice", "action", "devise", "matiere", "crypto", "etf", "obligation", "fund", "autre"
   - tv_symbol: the EXACT TradingView symbol, e.g. "TVC:SOX", "NASDAQ:INTC", "BINANCE:BTCUSDT", "FX_IDC:EURUSD", "TVC:GOLD", "TVC:US10Y", "AMEX:SPY"
   - tv_interval: the timeframe used in the tweet's chart. Use "D" if unclear. Otherwise: "1" "5" "15" "30" "60" "240" "D" "W" "M".
   - tv_studies: TradingView indicator IDs based on what's mentioned in the tweet. If RSI is mentioned → include "RSI@tv-basicstudies". If MA/EMA/moving average → "MASimple@tv-basicstudies". If Bollinger → "BB@tv-basicstudies". If MACD → "MACD@tv-basicstudies". Otherwise default ["MASimple@tv-basicstudies"].
   - direction: "bullish" | "bearish" | "neutral" — the analyst's stance on this asset in this tweet
   - key_levels: array of {label, value, type} where type is "support" | "resistance" | "target" | "trend". Only include levels explicitly named in the tweet. If none, return [].

OUTPUT FORMAT — strict JSON, no preamble, no markdown:

{
  "is_chart_analysis": true | false,
  "reason_if_skipped": "string, only if false",
  "assets": [ ...one entry per asset... ]
}

If you have any doubt about whether a tweet is chart-analysis (e.g. it's just "stay vigilant" with no asset), prefer is_chart_analysis: false — false negatives are cheaper than false positives.`;

const CLAUDE_SYSTEM = `Tu es l'éditeur en chef de Capucine, une revue financière française. Le ton : posé, littéraire, café-zinc parisien. Pas d'emojis, pas de points d'exclamation, pas de majuscules dramatiques. Tu utilises "tu" et jamais "vous". Tu écris pour des épargnants français curieux, pas pour des traders.

On te donne un tweet d'analyse technique de @great_martis (en anglais), et l'asset précis dont il parle. Ton job :

1. Écrire un \`key_quote\` français de 1-2 phrases qui PRÉSERVE la métaphore vivante du tweet original. "More gaps than Swiss cheese" → "Plus de gaps qu'un Emmental." "RSI has left Mother Earth" → "Le RSI a quitté la Terre." Si l'image originale est plate, écris une phrase Capucine élégante. Pas de point d'exclamation.

2. Écrire un \`body_md\` français de 150-250 mots, trois courts paragraphes :
   - Ouvre par le contexte (que voit @great_martis sur ce graphique)
   - Précise les niveaux ou indicateurs qu'il mentionne
   - Termine par ce qu'il faut surveiller, ATTRIBUÉ À LUI ("@great_martis surveille…", "il s'attend à…"). Jamais de conseil au lecteur ("achète", "vends", "il faut").

3. Le markdown peut contenir des paragraphes, du gras (\`**\`), de l'italique (\`*\`), mais PAS de listes, PAS de titres.

OUTPUT FORMAT — strict JSON :

{
  "key_quote": "...",
  "body_md": "..."
}

Si le tweet ne contient vraiment rien d'éditorialisable (seulement un emoji, ou un retweet vide), retourne {"key_quote": "", "body_md": ""} et le pipeline sautera l'asset.`;

/**
 * Step 1: Gemini Flash — classify + extract structured asset metadata.
 */
export async function geminiExtract(
  tweet: Tweet,
  modelName = "gemini-2.5-flash",
): Promise<Extraction | null> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not set");
  }

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const userPrompt = `Tweet from @${tweet.author_handle} on ${tweet.created_at}:\n\n${tweet.text}`;

  // Up to 3 attempts with short backoff — catches brief Gemini availability windows.
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 3_000 * attempt));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      const result = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: GEMINI_SYSTEM,
          temperature: 0.2,
          responseMimeType: "application/json",
          abortSignal: controller.signal,
        },
      });
      clearTimeout(timer);
      const raw = result.text ?? "";
      const parsed = safeJson<Extraction>(raw);
      if (!parsed) return null;
      if (!parsed.is_chart_analysis) {
        return { is_chart_analysis: false, reason_if_skipped: parsed.reason_if_skipped, assets: [] };
      }
      if (!Array.isArray(parsed.assets)) return null;
      const cleaned: ExtractedAsset[] = [];
      for (const a of parsed.assets) {
        if (!a || typeof a !== "object") continue;
        if (!a.asset_slug || !a.asset_name || !a.tv_symbol) continue;
        if (!ASSET_CLASSES.has(a.asset_class)) continue;
        if (!DIRECTIONS.has(a.direction)) continue;
        cleaned.push({
          asset_slug: String(a.asset_slug).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64),
          asset_name: String(a.asset_name).slice(0, 120),
          asset_class: a.asset_class,
          tv_symbol: String(a.tv_symbol).toUpperCase(),
          tv_interval: a.tv_interval ?? "D",
          tv_studies: Array.isArray(a.tv_studies) && a.tv_studies.length > 0 ? a.tv_studies : ["MASimple@tv-basicstudies"],
          direction: a.direction,
          key_levels: Array.isArray(a.key_levels) ? a.key_levels : [],
        });
      }
      return { is_chart_analysis: cleaned.length > 0, assets: cleaned };
    } catch (e) {
      clearTimeout(timer);
      lastErr = e as Error;
      const msg = String((e as Error).message ?? "");
      // Only retry on 503 / abort — other errors are permanent.
      if (!msg.includes("503") && !msg.includes("aborted") && !msg.includes("UNAVAILABLE")) break;
    }
  }
  throw lastErr ?? new Error("gemini: unknown error");
}

/**
 * Step 2: Claude — Capucine-voiced editorial that preserves the analyst's
 * metaphors. Sonnet is the right model for this — Opus is overkill for
 * 200-word prose, Haiku tends to flatten voice.
 */
export async function claudeEditorialize(
  tweet: Tweet,
  asset: ExtractedAsset,
  modelName = "claude-sonnet-4-6",
): Promise<Editorial | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userMessage = `Tweet original (en anglais) de @${tweet.author_handle}, ${tweet.created_at} :
"""
${tweet.text}
"""

Asset précis pour cette analyse : ${asset.asset_name} (${asset.tv_symbol}, classe : ${asset.asset_class}, direction : ${asset.direction}).
Niveaux mentionnés : ${
    asset.key_levels.length === 0
      ? "aucun explicite"
      : asset.key_levels.map((k) => `${k.label} ${k.value} (${k.type})`).join(", ")
  }.

Réponds en JSON strict.`;

  const message = await client.messages.create({
    model: modelName,
    max_tokens: 1200,
    system: CLAUDE_SYSTEM,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = message.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  const parsed = safeJson<Editorial>(textBlock.text);
  if (!parsed) return null;
  if (!parsed.body_md || typeof parsed.body_md !== "string") return null;
  if (!parsed.key_quote || typeof parsed.key_quote !== "string") return null;

  return parsed;
}

/**
 * Top-level pipeline. Iterates over the most recent N tweets, runs both
 * pipeline steps, upserts results. Idempotent (UNIQUE on tweet_id+slug).
 *
 * Stops accumulating new analyses once `targetCount` rows are written THIS
 * RUN — keeps the run bounded for cost control. Older tweets that already
 * produced analyses are not re-processed.
 */
export async function runChartAnalysis(
  sb: SupabaseClient,
  opts: {
    handle: string;
    targetCount?: number; // stop once this many NEW analyses are written
    maxTweets?: number; // hard cap on tweets considered
    geminiModel?: string;
    claudeModel?: string;
  },
): Promise<{
  tweets_considered: number;
  tweets_skipped_not_chart: number;
  tweets_skipped_already_done: number;
  tweets_failed: number;
  analyses_written: number;
  per_class: Record<string, number>;
  errors: string[];
}> {
  const target = opts.targetCount ?? 50;
  const maxTweets = opts.maxTweets ?? 500;

  const { data: tweetsRaw, error: tErr } = await sb
    .from("tweets")
    .select("id, text, created_at, url, author_handle")
    .eq("author_handle", opts.handle)
    .order("created_at", { ascending: false })
    .limit(maxTweets);

  if (tErr) throw new Error(`tweets fetch failed: ${tErr.message}`);
  const tweets = (tweetsRaw ?? []) as Tweet[];

  // Pre-load already-processed tweet ids so we skip them.
  const tweetIds = tweets.map((t) => t.id);
  const { data: doneRows } = await sb
    .from("chart_analysis")
    .select("tweet_id")
    .in("tweet_id", tweetIds);
  const doneIds = new Set((doneRows ?? []).map((r) => r.tweet_id as string));

  let written = 0;
  let skippedNotChart = 0;
  let skippedDone = 0;
  let failed = 0;
  const perClass: Record<string, number> = {};
  const errors: string[] = [];
  let considered = 0;

  for (const t of tweets) {
    if (written >= target) break;
    considered += 1;

    if (doneIds.has(t.id)) {
      skippedDone += 1;
      continue;
    }

    let extraction: Extraction | null;
    try {
      extraction = await geminiExtract(t, opts.geminiModel);
    } catch (e) {
      failed += 1;
      errors.push(`gemini fail on ${t.id}: ${(e as Error).message}`);
      continue;
    }

    if (!extraction || !extraction.is_chart_analysis || extraction.assets.length === 0) {
      skippedNotChart += 1;
      continue;
    }

    for (const asset of extraction.assets) {
      if (written >= target) break;

      let editorial: Editorial | null;
      try {
        editorial = await claudeEditorialize(t, asset, opts.claudeModel);
      } catch (e) {
        failed += 1;
        errors.push(`claude fail on ${t.id}/${asset.asset_slug}: ${(e as Error).message}`);
        continue;
      }

      if (!editorial || !editorial.body_md) {
        failed += 1;
        continue;
      }

      const { error: upErr } = await sb.from("chart_analysis").upsert(
        {
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
          model: `${opts.geminiModel ?? "gemini-2.5-flash"}+${opts.claudeModel ?? "claude-sonnet-4-6"}`,
          tweet_created_at: t.created_at,
        },
        { onConflict: "tweet_id,asset_slug" },
      );

      if (upErr) {
        failed += 1;
        errors.push(`upsert fail on ${t.id}/${asset.asset_slug}: ${upErr.message}`);
        continue;
      }

      written += 1;
      perClass[asset.asset_class] = (perClass[asset.asset_class] ?? 0) + 1;
    }
  }

  return {
    tweets_considered: considered,
    tweets_skipped_not_chart: skippedNotChart,
    tweets_skipped_already_done: skippedDone,
    tweets_failed: failed,
    analyses_written: written,
    per_class: perClass,
    errors: errors.slice(0, 20),
  };
}
