#!/usr/bin/env tsx
// One-off: take an existing /tmp/babylon-*.mp3 + .json, ensure the
// `podcasts` bucket exists in Supabase, upload, return public URL.

import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, "..", ".env.local");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq < 0) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (key && !process.env[key]) process.env[key] = val;
}

import { serviceClient } from "../lib/supabase/service";
import { uploadEpisode } from "../lib/podcast/storage";

const MP3 = process.argv[2] ?? "/tmp/babylon-1777244066495.mp3";
const META = process.argv[3] ?? "/tmp/babylon-1777243947191.json";

async function main() {
  const sb = serviceClient();

  console.log("Ensuring 'podcasts' bucket exists (public)…");
  const { error: createErr } = await sb.storage.createBucket("podcasts", {
    public: true,
    fileSizeLimit: 50 * 1024 * 1024,
    allowedMimeTypes: ["audio/mpeg", "application/json"],
  });
  if (createErr && !/already exists/i.test(createErr.message)) {
    throw new Error(`Bucket create failed: ${createErr.message}`);
  }
  console.log(createErr ? "  Bucket already exists ✓" : "  Bucket created ✓");

  console.log(`Reading ${MP3}…`);
  const audio = new Uint8Array(readFileSync(MP3));
  const meta = JSON.parse(readFileSync(META, "utf8"));

  console.log("Uploading to Supabase Storage…");
  const result = await uploadEpisode({
    title: meta.title || "Babylon demo",
    audio,
    metadata: meta,
  });

  console.log("\n━━━ DONE ━━━");
  console.log("Audio URL:    ", result.audioUrl);
  console.log("Metadata URL: ", result.metadataUrl);
  console.log("Path:         ", result.path);
}

main().catch((err) => {
  console.error("\nERROR:", err.message);
  process.exit(1);
});
