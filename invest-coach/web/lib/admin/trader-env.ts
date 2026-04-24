// Read the trading bot's .env so the admin page can authenticate to Alpaca
// without duplicating keys into newsletter's .env.local.

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const TRADER_ENV = join(homedir(), "Projects/trading-agent-v2/.env");

export function traderEnv(): Record<string, string> {
  if (!existsSync(TRADER_ENV)) return {};
  const raw = readFileSync(TRADER_ENV, "utf8");
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}
