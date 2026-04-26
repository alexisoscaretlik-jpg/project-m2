"use client";

import { useEffect, useRef } from "react";

/**
 * TradingView Advanced Chart embed.
 *
 * Defaults to daily candlesticks with a 50-period MA — same setup most
 * great_martis tweets use, so vue technique pages mirror what the analyst
 * was looking at without us having to over-engineer per-tweet config.
 *
 * The chart JS reaches across the iframe boundary, so we re-init on
 * symbol/interval change.
 */
export function TvChart({
  symbol,
  height = 520,
  interval = "D",
  studies = ["MASimple@tv-basicstudies", "RSI@tv-basicstudies"],
}: {
  symbol: string;
  height?: number;
  interval?: "1" | "5" | "15" | "30" | "60" | "240" | "D" | "W" | "M";
  studies?: string[];
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
      interval,
      timezone: "Europe/Paris",
      theme: "light",
      style: "1",
      locale: "fr",
      toolbar_bg: "#fbf5ea",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      withdateranges: true,
      allow_symbol_change: true,
      details: true,
      studies,
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol, interval, JSON.stringify(studies)]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container overflow-hidden rounded-xl border border-border bg-card"
      style={{ height }}
    />
  );
}
