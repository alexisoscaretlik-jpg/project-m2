// Smoke test — verifies Supabase + Resend credentials work, checks schema,
// and reports sending-domain verification status. Node ESM, no build needed.
//
// Run:  node smoke_test.mjs

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, ".env.local");

// Minimal .env parser — avoids adding a dep just for this.
function loadEnv(path) {
  const out = {};
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

const env = loadEnv(envPath);
for (const [k, v] of Object.entries(env)) process.env[k] = v;

const log = {
  ok:   (msg) => console.log(`OK    ${msg}`),
  fail: (msg) => { console.log(`FAIL  ${msg}`); process.exitCode = 1; },
  warn: (msg) => console.log(`WARN  ${msg}`),
};

console.log("============================================================");
console.log("  newsletter-bot smoke test");
console.log("============================================================");

// ── 1. required env vars ─────────────────────────────────────────────────────
const required = [
  "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "RESEND_API_KEY", "EMAIL_FROM", "CRON_SECRET",
];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  log.fail(`missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}
log.ok("env vars loaded from .env.local");

// ── 2. Supabase health + schema probe ────────────────────────────────────────
try {
  const { createClient } = await import("@supabase/supabase-js");

  // Anon client → tests the publishable key + RLS path end users hit
  const anon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
  );
  const { error: anonErr, status: anonStatus } = await anon
    .from("companies").select("ticker").limit(1);
  if (anonErr && anonStatus !== 200) {
    log.fail(`Supabase anon query failed: ${anonErr.message} (status ${anonStatus})`);
  } else {
    log.ok("Supabase anon key works (companies table reachable)");
  }

  // Service role client → bypass RLS, confirm the three tables the newsletter needs
  const svc = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  for (const table of ["companies", "cards", "newsletter_subscribers"]) {
    const { error, count } = await svc
      .from(table).select("*", { count: "exact", head: true });
    if (error) {
      log.fail(`Supabase table '${table}': ${error.message}`);
    } else {
      log.ok(`table '${table}' exists (rows: ${count ?? "?"})`);
    }
  }
} catch (e) {
  log.fail(`Supabase client error: ${e.message}`);
}

// ── 3. Resend — API key + sender domain verification ─────────────────────────
try {
  const res = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  });
  if (!res.ok) {
    log.fail(`Resend /domains responded ${res.status} ${res.statusText}`);
  } else {
    const body = await res.json();
    const domains = body.data || [];
    log.ok(`Resend API key works (${domains.length} domain(s) configured)`);

    // Extract domain from EMAIL_FROM (handles both "a@b.c" and "Name <a@b.c>")
    const fromStr = process.env.EMAIL_FROM;
    const addrMatch = fromStr.match(/<([^>]+)>/) || [null, fromStr];
    const addr = addrMatch[1].trim();
    const senderDomain = addr.split("@")[1];

    if (!senderDomain) {
      log.fail(`could not extract a domain from EMAIL_FROM=${JSON.stringify(fromStr)}`);
    } else if (senderDomain === "resend.dev") {
      log.ok("EMAIL_FROM uses resend.dev — fine for testing (only sends to your Resend account email)");
    } else {
      const match = domains.find((d) => d.name === senderDomain);
      if (!match) {
        log.fail(`EMAIL_FROM domain '${senderDomain}' is NOT configured in Resend. Add + verify it at https://resend.com/domains before the digest can send.`);
      } else if (match.status !== "verified") {
        log.warn(`EMAIL_FROM domain '${senderDomain}' is in Resend but status='${match.status}'. Digest sends will fail until verified.`);
      } else {
        log.ok(`EMAIL_FROM domain '${senderDomain}' is verified in Resend`);
      }
    }
  }
} catch (e) {
  log.fail(`Resend error: ${e.message}`);
}

// ── 4. X (Twitter) API ───────────────────────────────────────────────────────
if (process.env.TWITTER_BEARER_TOKEN && process.env.TWITTER_CREATOR_HANDLE) {
  try {
    const handle = process.env.TWITTER_CREATOR_HANDLE.replace(/^@/, "");
    const res = await fetch(
      `https://api.x.com/2/users/by/username/${encodeURIComponent(handle)}`,
      { headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` } },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      log.fail(`X API auth failed: ${res.status} ${res.statusText} — ${body.slice(0, 160)}`);
    } else {
      const body = await res.json();
      if (body.data?.id) {
        log.ok(`X API works — @${body.data.username} resolves to id=${body.data.id} name=${JSON.stringify(body.data.name)}`);
      } else {
        log.fail(`X API returned unexpected shape: ${JSON.stringify(body).slice(0, 200)}`);
      }
    }
  } catch (e) {
    log.fail(`X API error: ${e.message}`);
  }
} else {
  log.warn("TWITTER_BEARER_TOKEN or TWITTER_CREATOR_HANDLE not set (tweet section will be empty in the digest)");
}

// ── 5. Anthropic (optional) ──────────────────────────────────────────────────
if (process.env.ANTHROPIC_API_KEY) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 20,
        messages: [{ role: "user", content: "Reply with only the word OK." }],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      log.fail(`Anthropic responded ${res.status}: ${body.slice(0, 120)}`);
    } else {
      const body = await res.json();
      const text = body.content?.[0]?.text?.trim();
      log.ok(`Anthropic responded: ${JSON.stringify(text)}`);
    }
  } catch (e) {
    log.fail(`Anthropic error: ${e.message}`);
  }
} else {
  log.warn("ANTHROPIC_API_KEY not set (tax/bank coach will 503)");
}

console.log("");
console.log(process.exitCode ? "One or more checks failed — see above." : "All checks passed.");
