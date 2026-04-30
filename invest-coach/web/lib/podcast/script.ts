import Anthropic from "@anthropic-ai/sdk";
import {
  buildBabylonPromptParts,
  countScriptWords,
  qaCheckScript,
  type BabylonBrief,
  type BabylonScript,
  type ScriptLine,
} from "./babylon-prompt";

// Generate the full 20-min French script from a brief.
// Uses Claude Sonnet 4.6 — long-form French narrative + dialogue is its
// strength, and 3,000-word output is well within max_tokens.
//
// Prompt is sent as TWO content blocks:
//   1. Stable framework (cache_control: ephemeral) — ~1500 tokens, identical
//      across episodes. Anthropic charges 10 % of input rate to read this
//      from cache after the first call within the cache TTL window.
//   2. Per-episode brief (no cache control) — ~500 tokens, varies every call.
//
// The cache TTL is 5 min (ephemeral default). The structural separation is
// the real win: it pays off during iteration and when volume grows. At 1
// episode/week the savings are pennies.

const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 16_000;

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY non configurée.");
  _client = new Anthropic({ apiKey: key });
  return _client;
}

export async function writeBabylonScript(brief: BabylonBrief): Promise<BabylonScript> {
  const { stableFramework, episodeBrief } = buildBabylonPromptParts(brief);

  const model = process.env.ANTHROPIC_PODCAST_MODEL || DEFAULT_MODEL;
  const msg = await client().messages.create({
    model,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: stableFramework,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: episodeBrief,
          },
        ],
      },
    ],
  });

  const block = msg.content.find((b) => b.type === "text");
  const raw = (block && "text" in block ? block.text : "").trim();
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed: Omit<BabylonScript, "wordCount"> & { wordCount?: number };
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(
      `Script JSON non parsable: ${(e as Error).message}. Début: ${cleaned.slice(0, 200)}`,
    );
  }

  if (!parsed.lines || !Array.isArray(parsed.lines)) {
    throw new Error("Script renvoyé sans champ 'lines'.");
  }

  const lines = parsed.lines as ScriptLine[];
  const script: BabylonScript = {
    title: parsed.title,
    summary: parsed.summary,
    law: parsed.law,
    theme: parsed.theme || "money",
    character: parsed.character,
    source: parsed.source,
    lines,
    wordCount: countScriptWords(lines),
  };

  const qa = qaCheckScript(script);
  if (!qa.ok) {
    console.warn(`  [QA warning, demo override] ${qa.reasons.join(" | ")}`);
  }

  return script;
}
