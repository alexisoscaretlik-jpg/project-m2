#!/usr/bin/env tsx
// Local runner for the chart analysis pipeline. Reads .env.local and runs
// the pipeline directly (bypasses Cloudflare Worker → avoids their Gemini 503s).
import { readFileSync } from "fs";
import { join } from "path";

// Load .env.local
const envPath = join(process.cwd(), ".env.local");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq < 0) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
    val = val.slice(1, -1);
  if (key && !(key in process.env)) process.env[key] = val;
}

import { createClient } from "@supabase/supabase-js";
import { runChartAnalysis } from "../lib/chart-analysis.js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

console.log(`Starting local chart analysis pipeline — ${new Date().toISOString()}`);
console.log(`Gemini model: ${process.env.GEMINI_MODEL || "gemini-2.5-flash"}`);

async function main() {
  const report = await runChartAnalysis(sb, {
    handle: (process.env.TWITTER_CREATOR_HANDLE || "great_martis").replace(/^@/, ""),
    targetCount: 50,
    maxTweets: 600,
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    claudeModel: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
  });
  console.log(JSON.stringify({ ok: true, ...report }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
