// Read-only Alpaca client for the admin dashboard.
// Uses the keys from the trading bot's .env — no duplication.

import { traderEnv } from "./trader-env";

const PAPER_BASE = "https://paper-api.alpaca.markets/v2";
const LIVE_BASE  = "https://api.alpaca.markets/v2";

type AlpacaAccount = {
  account_number: string;
  status: string;
  equity: string;
  cash: string;
  portfolio_value: string;
  buying_power: string;
};

type AlpacaPosition = {
  symbol: string;
  qty: string;
  market_value: string;
  unrealized_pl: string;
  unrealized_plpc: string;
};

function clientConfig() {
  const env = traderEnv();
  const key = env.ALPACA_API_KEY;
  const sec = env.ALPACA_SECRET_KEY;
  const paper = (env.ALPACA_PAPER ?? "true").toLowerCase() === "true";
  if (!key || !sec) return null;
  return {
    base: paper ? PAPER_BASE : LIVE_BASE,
    paper,
    headers: {
      "APCA-API-KEY-ID": key,
      "APCA-API-SECRET-KEY": sec,
    } as const,
  };
}

async function alpacaGet<T>(path: string): Promise<T | null> {
  const cfg = clientConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.base}${path}`, {
      headers: cfg.headers,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type AlpacaSnapshot = {
  configured: boolean;
  paper: boolean;
  account: AlpacaAccount | null;
  positions: AlpacaPosition[];
};

export async function alpacaSnapshot(): Promise<AlpacaSnapshot> {
  const cfg = clientConfig();
  if (!cfg) {
    return { configured: false, paper: true, account: null, positions: [] };
  }
  const [account, positions] = await Promise.all([
    alpacaGet<AlpacaAccount>("/account"),
    alpacaGet<AlpacaPosition[]>("/positions"),
  ]);
  return {
    configured: true,
    paper: cfg.paper,
    account,
    positions: positions ?? [],
  };
}
