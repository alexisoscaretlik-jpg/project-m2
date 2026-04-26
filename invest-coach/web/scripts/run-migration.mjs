#!/usr/bin/env node
// Apply a single SQL migration file to the linked Supabase project via the
// Management API.
//
// Why this exists: Supabase doesn't expose raw-SQL execution via the
// PostgREST/service-role surface. We need either the dashboard SQL editor
// (manual paste), the supabase CLI (interactive login), or this Management
// API call (just a PAT). PAT is the cleanest for scripted migrations.
//
// Usage:
//   node scripts/run-migration.mjs ../supabase/migrations/2026-04-25-chart-analysis.sql
//
// Required env (read from .env.local):
//   NEXT_PUBLIC_SUPABASE_URL   — used to extract the project ref
//   SUPABASE_ACCESS_TOKEN      — Personal Access Token, one-time setup at
//                                https://supabase.com/dashboard/account/tokens
//
// Exit codes:
//   0  success
//   1  bad usage / missing env
//   2  PAT missing — prints the URL to generate one
//   3  API error from Supabase

import fs from "node:fs";
import path from "node:path";

const ENV_FILE = path.join(process.cwd(), ".env.local");

function readEnvLocal() {
  if (!fs.existsSync(ENV_FILE)) return {};
  const lines = fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/);
  const out = {};
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function extractProjectRef(supabaseUrl) {
  // https://<project-ref>.supabase.co  →  <project-ref>
  const m = supabaseUrl.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/);
  return m ? m[1] : null;
}

async function main() {
  const sqlPath = process.argv[2];
  if (!sqlPath) {
    console.error(
      "usage: node scripts/run-migration.mjs <path/to/migration.sql>",
    );
    process.exit(1);
  }
  if (!fs.existsSync(sqlPath)) {
    console.error(`error: file not found: ${sqlPath}`);
    process.exit(1);
  }

  const env = { ...readEnvLocal(), ...process.env };
  const supabaseUrl =
    env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const pat = env.SUPABASE_ACCESS_TOKEN;

  if (!supabaseUrl) {
    console.error("error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL missing");
    process.exit(1);
  }

  const projectRef = extractProjectRef(supabaseUrl);
  if (!projectRef) {
    console.error(`error: could not extract project ref from ${supabaseUrl}`);
    process.exit(1);
  }

  if (!pat) {
    console.error("");
    console.error(
      "  ⚠️  SUPABASE_ACCESS_TOKEN not in .env.local — one-time setup needed.",
    );
    console.error("");
    console.error(
      "  1. Open this URL (it lives in your Supabase account, not project):",
    );
    console.error(
      "       https://supabase.com/dashboard/account/tokens",
    );
    console.error('  2. Click "Generate new token", name it "invest-coach migrations".');
    console.error("  3. Copy the token (shown ONCE — save it).");
    console.error('  4. Add this line to .env.local:');
    console.error("       SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxx");
    console.error("");
    console.error("  Then re-run the ship script — all future migrations are 100% automated.");
    process.exit(2);
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  const apiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  console.log(
    `▶︎ Applying ${path.basename(sqlPath)} to project ${projectRef}…`,
  );

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`  ✗ HTTP ${res.status} ${res.statusText}`);
    console.error(`     ${text.slice(0, 800)}`);
    process.exit(3);
  }

  console.log("  ✓ Migration applied.");
  if (text && text !== "[]" && text !== "{}") {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`     Rows returned: ${parsed.length}`);
      }
    } catch {
      // Non-JSON success body is fine.
    }
  }
}

main().catch((e) => {
  console.error("fatal:", e?.message || e);
  process.exit(3);
});
