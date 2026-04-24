// Tail the trading bot's trades.csv (last N rows) for the admin dashboard.

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const TRADES_PATH = join(homedir(), "Projects/trading-agent-v2/trades.csv");

export type TradeRow = {
  timestamp: string;
  ticker: string;
  action: string;
  shares: string;
  price: string | null;
  status: string;
  orderId: string | null;
  paper: boolean;
};

export function recentTrades(limit = 10): TradeRow[] {
  if (!existsSync(TRADES_PATH)) return [];
  const raw = readFileSync(TRADES_PATH, "utf8");
  const lines = raw.split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(",");
  const idx = (name: string) => header.indexOf(name);

  const rows = lines.slice(1).reverse().slice(0, limit);
  return rows.map((line) => {
    // Naive CSV parse — the bot's writer uses DictWriter which never
    // embeds commas or quotes in these fields, so splitting on ',' is safe.
    const cols = line.split(",");
    return {
      timestamp: cols[idx("timestamp")] ?? "",
      ticker:    cols[idx("ticker")]    ?? "",
      action:    cols[idx("action")]    ?? "",
      shares:    cols[idx("shares")]    ?? "",
      price:     cols[idx("price")] || null,
      status:    cols[idx("status")]    ?? "",
      orderId:   cols[idx("order_id")] || null,
      paper:     (cols[idx("paper")] ?? "True") === "True",
    };
  });
}
