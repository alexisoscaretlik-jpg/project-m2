"use client";

import { useEffect, useRef } from "react";

export function TvChart({
  symbol,
  height = 500,
}: {
  symbol: string;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "D",
      timezone: "Europe/Paris",
      theme: "light",
      style: "1",
      locale: "fr",
      hide_side_toolbar: false,
      allow_symbol_change: true,
      withdateranges: true,
      details: true,
      studies: ["MASimple@tv-basicstudies"],
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol]);

  return (
    <div
      className="tradingview-widget-container overflow-hidden rounded-xl border border-slate-200 bg-white"
      style={{ height }}
    >
      <div ref={ref} className="tradingview-widget-container__widget h-full" />
    </div>
  );
}
