// Map internal ticker format (e.g. "MC.PA", "AAPL") to TradingView symbol
// format ("EURONEXT:MC", "NASDAQ:AAPL"). Falls back to the raw ticker —
// TradingView's widget can resolve many symbols without an exchange prefix.
const SUFFIX_MAP: Record<string, string> = {
  PA: "EURONEXT",
  AS: "EURONEXT",
  BR: "EURONEXT",
  LS: "EURONEXT",
  DE: "XETR",
  L: "LSE",
  MI: "MIL",
  MC: "BME",
  SW: "SIX",
  ST: "OMXSTO",
  CO: "OMXCOP",
  HE: "OMXHEX",
  VI: "VIE",
  WA: "GPW",
  HK: "HKEX",
  T: "TSE",
};

export function toTvSymbol(ticker: string): string {
  const dot = ticker.lastIndexOf(".");
  if (dot > 0) {
    const base = ticker.slice(0, dot);
    const suffix = ticker.slice(dot + 1).toUpperCase();
    const exchange = SUFFIX_MAP[suffix];
    if (exchange) return `${exchange}:${base}`;
  }
  return ticker;
}
