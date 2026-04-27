import Anthropic from "@anthropic-ai/sdk";
import {
  buildBabylonPrompt,
  countScriptWords,
  qaCheckScript,
  type BabylonBrief,
  type BabylonScript,
  type ScriptLine,
} from "./babylon-prompt";

// Generate the full 20-min French script from a brief.
// Uses Claude Sonnet 4.6 — long-form French narrative + dialogue is its
// strength, and 3,000-word output is well within max_tokens.

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
  const prompt = buildBabylonPrompt(brief);

  const model = process.env.ANTHROPIC_PODCAST_MODEL || DEFAULT_MODEL;
  const msg = await client().messages.create({
    model,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
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
