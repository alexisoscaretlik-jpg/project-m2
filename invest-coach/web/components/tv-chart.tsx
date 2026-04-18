"use client";

import { useEffect, useRef } from "react";

export function TvChart({
  symbol,
  height = 520,
}: {
  symbol: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // TradingView's embed script expects a specific DOM layout: the
    // <script> tag sits as a sibling of .tradingview-widget-container__widget
    // inside the outer .tradingview-widget-container, and the widget JSON is
    // placed in the script's text content.
    container.innerHTML =
      '<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>';

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.type = "text/javascript";
    script.text = JSON.stringify({
      autosize: true,
      symbol,
      interval: "D",
      timezone: "Europe/Paris",
      theme: "light",
      style: "1",
      locale: "fr",
      toolbar_bg: "#f8fafc",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      withdateranges: true,
      allow_symbol_change: true,
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
      ref={containerRef}
      className="tradingview-widget-container overflow-hidden rounded-xl border border-slate-200 bg-white"
      style={{ height }}
    />
  );
}
