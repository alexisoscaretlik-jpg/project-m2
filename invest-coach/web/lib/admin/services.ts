// Parse `launchctl list` output for the four com.alexis.* services.
// Runs with the user's credentials — no sudo needed for user-level agents.

import { promisify } from "node:util";
import { execFile as execFileCb } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const execFile = promisify(execFileCb);

export const SERVICES = [
  {
    label: "com.alexis.trading-agent-v2",
    display: "Trading bot",
    kind: "keepalive" as const,
    summary: "Gmail → Claude → Alpaca Paper",
  },
  {
    label: "com.alexis.trading-agent-v2-learn",
    display: "Nightly analyst (Gemini)",
    kind: "schedule" as const,
    summary: "Every night 22:00 — rewrites playbook.md",
  },
  {
    label: "com.alexis.kevin-watcher",
    display: "Meet Kevin watcher",
    kind: "schedule" as const,
    summary: "Every 10 min — YouTube → Gemini → Claude → private_notes",
  },
  {
    label: "com.alexis.m2",
    display: "M2 web app",
    kind: "keepalive" as const,
    summary: "Next.js app on :3000",
  },
  {
    label: "com.alexis.m2-fetch-tweets",
    display: "Daily tweet fetch",
    kind: "schedule" as const,
    summary: "Every day at 07:00",
  },
  {
    label: "com.alexis.m2-weekly-digest",
    display: "Weekly digest",
    kind: "schedule" as const,
    summary: "Mondays at 08:00",
  },
  {
    label: "com.alexis.m2-watch-kevin",
    display: "Kevin YouTube watcher",
    kind: "schedule" as const,
    summary: "Daily 14:00 — Gemini watches new videos, saves to private notes",
  },
];

export type ServiceRow = {
  label: string;
  display: string;
  kind: "keepalive" | "schedule";
  summary: string;
  pid: number | null;    // null if not currently running (calendar jobs mostly)
  lastExit: number | null;
  healthy: boolean;      // green when keepalive has a PID, or schedule has never crashed
  plistExists: boolean;
};

export async function readServices(): Promise<ServiceRow[]> {
  let out = "";
  try {
    const r = await execFile("/bin/launchctl", ["list"]);
    out = r.stdout;
  } catch {
    // launchctl missing? shouldn't happen on macOS
  }

  // Each line: PID\tLastExit\tLabel
  const parsed = new Map<string, { pid: number | null; lastExit: number | null }>();
  for (const line of out.split("\n")) {
    const cols = line.split(/\s+/);
    if (cols.length < 3) continue;
    const [pidStr, exitStr, label] = cols;
    if (!label?.startsWith("com.alexis.")) continue;
    parsed.set(label, {
      pid: pidStr === "-" ? null : Number.parseInt(pidStr, 10),
      lastExit: Number.isNaN(Number(exitStr)) ? null : Number(exitStr),
    });
  }

  const plistDir = join(homedir(), "Library/LaunchAgents");

  return SERVICES.map((s) => {
    const row = parsed.get(s.label) ?? { pid: null, lastExit: null };
    let plistExists = false;
    try {
      statSync(join(plistDir, `${s.label}.plist`));
      plistExists = true;
    } catch {
      plistExists = false;
    }

    const healthy =
      s.kind === "keepalive"
        ? row.pid !== null && row.pid > 0
        : plistExists && (row.lastExit === null || row.lastExit === 0);

    return { ...s, ...row, healthy, plistExists };
  });
}
