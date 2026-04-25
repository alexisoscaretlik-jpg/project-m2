// Vue Technique — generates the per-company weekly synthesis using
// Gemini Flash, fed by recent @great_martis tweets that mention the company.
//
// Used by /api/cron/synthesize-views (weekly cron) and an on-demand
// regenerate endpoint (later).

import type { SupabaseClient } from "@supabase/supabase-js";

export type Company = {
  id: number;
  ticker: string;
  name: string;
  exchange: string | null;
  country: string | null;
};

export type Tweet = {
  id: string;
  text: string;
  created_at: string;
  url: string;
};

export type SynthesisResult = {
  body_md: string;
  key_levels: KeyLevel[];
  source_tweet_ids: string[];
  tweet_count: number;
  model: string;
};

export type KeyLevel = {
  label: string;
  value: string;
  type: "support" | "resistance" | "target" | "trend";
};

/**
 * Returns aliases the model should match against tweet text to decide if a
 * tweet is "about" the company. Includes the bare ticker, the dotted-suffix
 * ticker (AIR.PA), the cashtag ($AIR), and the human name.
 *
 * Conservative — false negatives (missing a tweet) are cheaper than false
 * positives (synthesizing irrelevant content).
 */
export function buildAliases(c: Company): string[] {
  const ticker = c.ticker;
  const bareTicker = ticker.split(".")[0];
  const aliases = new Set<string>([
    ticker,
    bareTicker,
    `$${bareTicker}`,
    c.name,
  ]);
  return Array.from(aliases).filter(Boolean);
}

/**
 * Filter a list of tweets for ones that plausibly reference `company`.
 * Match is case-insensitive substring against bare-ticker / cashtag / name.
 */
export function filterTweetsForCompany(
  tweets: Tweet[],
  company: Company,
): Tweet[] {
  const aliases = buildAliases(company).map((a) => a.toLowerCase());
  return tweets.filter((t) => {
    const haystack = t.text.toLowerCase();
    return aliases.some((a) => haystack.includes(a));
  });
}

const SYSTEM_PROMPT = `Tu es la voix éditoriale de Capucine, une revue financière française. Ton style : posé, littéraire, café-zinc parisien. Tu écris pour des épargnants curieux, jamais pour des traders. Pas d'emojis, pas de points d'exclamation, pas de titres en majuscules. Tu utilises "tu" et jamais "vous". Tu cites tes sources nommément.

Ta mission : à partir d'un échantillon récent de tweets de @great_martis (un analyste technique anglophone reconnu, dont la chaîne X est en open source), produire une synthèse hebdomadaire en français pour les abonnés de Capucine, sur une entreprise précise.

Règles strictes :
1. **Pas de conseil en investissement.** Tu décris ce que dit @great_martis, tu n'écris jamais "achète", "vends", "il faut". Forme : « great_martis voit X. Niveaux qu'il a notés : Y. Ce que ça suggère pour la lecture du graphique : Z. »
2. **Reste factuel.** Si tu inventes un niveau ou une projection que les tweets ne contiennent pas, tu casses la confiance. Cite uniquement ce qui est dans les sources.
3. **Sois bref.** 250-400 mots, trois courts paragraphes. Pas plus.
4. **Cite les tweets.** À la fin de chaque affirmation tirée d'un tweet, ajoute une référence inline au format \`[t1]\`, \`[t2]\` correspondant à l'index dans la liste fournie.
5. **Capucine voice.** Ouvre par un eyebrow d'une phrase qui pose le décor. Pas de jargon non traduit (sauf "support", "résistance" qui sont francisés). "Effet boule de neige" plutôt que "compounding".
6. **Si les tweets sont trop pauvres ou hors-sujet**, écris simplement : « Cette semaine, @great_martis n'a pas commenté [Société] de manière exploitable. On reprendra dimanche prochain. » et termine. N'invente rien.

Format de sortie — réponds en JSON STRICT, sans markdown wrapper, sans préambule. Le JSON doit avoir exactement cette forme :

{
  "body_md": "La synthèse en français, 3 paragraphes, en markdown simple. Cite les tweets [t1], [t2]…",
  "key_levels": [
    {"label": "Support court terme", "value": "238 €", "type": "support"},
    {"label": "Résistance majeure", "value": "265 €", "type": "resistance"}
  ],
  "source_tweet_ids": ["1234567890", "1234567891"]
}

Si tu n'as rien à dire, retourne :
{
  "body_md": "Cette semaine, @great_martis n'a pas commenté [Nom] de manière exploitable. On reprendra dimanche prochain.",
  "key_levels": [],
  "source_tweet_ids": []
}`;

function buildUserPrompt(company: Company, tweets: Tweet[]): string {
  const aliases = buildAliases(company).join(", ");
  const tweetBlock = tweets
    .map((t, i) => {
      const date = new Date(t.created_at).toISOString().slice(0, 10);
      return `[t${i + 1}] (id=${t.id}, date=${date})\n${t.text}\n`;
    })
    .join("\n");

  return `Société : ${company.name} (${company.ticker})
Aliases recherchés : ${aliases}
Tweets récents de @great_martis qui mentionnent cette société (les ${tweets.length} derniers, classés du plus récent au plus ancien) :

${tweetBlock}

Rédige la synthèse Capucine pour cette société, en respectant strictement le format JSON spécifié.`;
}

/** Strip markdown code fences if the model wrapped the JSON anyway. */
function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1] : trimmed;
}

/**
 * Call Gemini Flash and parse the JSON response.
 * Returns null if the model output couldn't be parsed (caller should skip).
 */
export async function synthesizeForCompany(
  company: Company,
  tweets: Tweet[],
  modelName = "gemini-2.5-flash",
): Promise<SynthesisResult | null> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not set");
  }

  // No relevant tweets → return the "rien à dire" stub directly. Saves an
  // API call and gives a clean fallback for sparse weeks.
  if (tweets.length === 0) {
    return {
      body_md: `Cette semaine, @great_martis n'a pas commenté ${company.name} de manière exploitable. On reprendra dimanche prochain.`,
      key_levels: [],
      source_tweet_ids: [],
      tweet_count: 0,
      model: modelName,
    };
  }

  // Dynamic import so the build doesn't fail if @google/genai isn't
  // installed (matches lib/tax/gemini.ts).
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const userPrompt = buildUserPrompt(company, tweets);

  const result = await ai.models.generateContent({
    model: modelName,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  });

  const raw = result.text ?? "";
  if (!raw) return null;

  let parsed: {
    body_md?: string;
    key_levels?: KeyLevel[];
    source_tweet_ids?: string[];
  };
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    return null;
  }

  if (!parsed.body_md || typeof parsed.body_md !== "string") return null;

  return {
    body_md: parsed.body_md,
    key_levels: Array.isArray(parsed.key_levels) ? parsed.key_levels : [],
    source_tweet_ids: Array.isArray(parsed.source_tweet_ids)
      ? parsed.source_tweet_ids.map(String)
      : [],
    tweet_count: tweets.length,
    model: modelName,
  };
}

/**
 * Compute the Monday of the ISO week that contains `d` (UTC).
 * vue_technique.week_start uses this so re-running the cron mid-week
 * upserts onto the same row.
 */
export function isoWeekMondayUtc(d: Date = new Date()): string {
  const day = d.getUTCDay(); // 0 = Sun
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + offsetToMonday),
  );
  return monday.toISOString().slice(0, 10);
}

/**
 * Top-level synthesis: for every company in the DB, find tweets in the last
 * `lookbackDays` mentioning it, ask Gemini for a synthesis, upsert into
 * vue_technique. Returns a per-company report.
 */
export async function synthesizeAllCompanies(
  sb: SupabaseClient,
  opts: {
    handle: string;
    lookbackDays?: number;
    modelName?: string;
  },
): Promise<{
  week_start: string;
  total: number;
  written: number;
  empty: number;
  failed: number;
  per_company: Array<{
    ticker: string;
    name: string;
    tweets_used: number;
    status: "written" | "empty" | "failed";
    error?: string;
  }>;
}> {
  const lookbackDays = opts.lookbackDays ?? 30;
  const modelName = opts.modelName ?? "gemini-2.5-flash";
  const weekStart = isoWeekMondayUtc();
  const sinceIso = new Date(
    Date.now() - lookbackDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: companies, error: cErr } = await sb
    .from("companies")
    .select("id, ticker, name, exchange, country")
    .order("ticker");

  if (cErr) throw new Error(`companies fetch failed: ${cErr.message}`);
  const list = (companies ?? []) as Company[];

  const { data: tweetsRaw, error: tErr } = await sb
    .from("tweets")
    .select("id, text, created_at, url")
    .eq("author_handle", opts.handle)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false });

  if (tErr) throw new Error(`tweets fetch failed: ${tErr.message}`);
  const allTweets = (tweetsRaw ?? []) as Tweet[];

  const perCompany: Array<{
    ticker: string;
    name: string;
    tweets_used: number;
    status: "written" | "empty" | "failed";
    error?: string;
  }> = [];

  for (const c of list) {
    const matched = filterTweetsForCompany(allTweets, c);
    try {
      const synth = await synthesizeForCompany(c, matched, modelName);
      if (!synth) {
        perCompany.push({
          ticker: c.ticker,
          name: c.name,
          tweets_used: matched.length,
          status: "failed",
          error: "model returned unparseable output",
        });
        continue;
      }

      const { error: upErr } = await sb.from("vue_technique").upsert(
        {
          company_id: c.id,
          week_start: weekStart,
          body_md: synth.body_md,
          key_levels: synth.key_levels,
          source_tweet_ids: synth.source_tweet_ids,
          tweet_count: synth.tweet_count,
          model: synth.model,
        },
        { onConflict: "company_id,week_start" },
      );

      if (upErr) {
        perCompany.push({
          ticker: c.ticker,
          name: c.name,
          tweets_used: matched.length,
          status: "failed",
          error: `upsert: ${upErr.message}`,
        });
        continue;
      }

      perCompany.push({
        ticker: c.ticker,
        name: c.name,
        tweets_used: matched.length,
        status: matched.length === 0 ? "empty" : "written",
      });
    } catch (e) {
      perCompany.push({
        ticker: c.ticker,
        name: c.name,
        tweets_used: matched.length,
        status: "failed",
        error: (e as Error).message,
      });
    }
  }

  return {
    week_start: weekStart,
    total: list.length,
    written: perCompany.filter((p) => p.status === "written").length,
    empty: perCompany.filter((p) => p.status === "empty").length,
    failed: perCompany.filter((p) => p.status === "failed").length,
    per_company: perCompany,
  };
}
