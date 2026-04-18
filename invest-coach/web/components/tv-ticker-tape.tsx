"use client";

import { useEffect, useRef } from "react";

type Tick = { proName: string; title: string };

const DEFAULT_TICKS: Tick[] = [
  { proName: "EURONEXT:MC", title: "LVMH" },
  { proName: "EURONEXT:TTE", title: "TotalEnergies" },
  { proName: "EURONEXT:AIR", title: "Airbus" },
  { proName: "EURONEXT:ASML", title: "ASML" },
  { proName: "NASDAQ:AAPL", title: "Apple" },
  { proName: "NASDAQ:MSFT", title: "Microsoft" },
  { proName: "NASDAQ:NVDA", title: "Nvidia" },
  { proName: "NYSE:BRK.B", title: "Berkshire" },
  { proName: "FX_IDC:EURUSD", title: "EUR / USD" },
];

export function TvTickerTape({ symbols }: { symbols?: Tick[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML =
      '<div class="tradingview-widget-container__widget"></div>';

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.type = "text/javascript";
    script.text = JSON.stringify({
      symbols: symbols ?? DEFAULT_TICKS,
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "light",
      locale: "fr",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [symbols]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container border-b border-slate-200 bg-white"
    />
  );
}
