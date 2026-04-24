"use server";

// Server actions for the /admin page. Restart a launchd service by
// unload+load. The newsletter Next.js process runs under the same user
// as the agents, so no sudo is required.

import { revalidatePath } from "next/cache";
import { promisify } from "node:util";
import { execFile as execFileCb } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

const execFile = promisify(execFileCb);

const ALLOWED_LABELS = new Set([
  "com.alexis.trading-agent-v2",
  "com.alexis.trading-agent-v2-learn",
  "com.alexis.m2",
  "com.alexis.m2-fetch-tweets",
  "com.alexis.m2-weekly-digest",
  "com.alexis.kevin-watcher",
]);

function plistPath(label: string): string {
  return join(homedir(), "Library/LaunchAgents", `${label}.plist`);
}

export async function restartService(label: string): Promise<void> {
  if (!ALLOWED_LABELS.has(label)) {
    throw new Error(`restartService refused: unknown label ${label}`);
  }
  const plist = plistPath(label);
  try {
    await execFile("/bin/launchctl", ["unload", plist]);
  } catch {
    // Ignore — the service may already be unloaded.
  }
  await execFile("/bin/launchctl", ["load", plist]);
  revalidatePath("/admin");
}

export async function triggerFetchTweetsNow(): Promise<void> {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET missing");
  await fetch("http://127.0.0.1:3000/api/cron/fetch-tweets", {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
  });
  revalidatePath("/admin");
}

export async function sendDigestNow(): Promise<void> {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET missing");
  await fetch("http://127.0.0.1:3000/api/cron/weekly-digest", {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
  });
  revalidatePath("/admin");
}
