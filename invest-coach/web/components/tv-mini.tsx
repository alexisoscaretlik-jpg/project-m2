"use client";

import { useEffect, useRef } from "react";

export function TvMini({
  symbol,
  height = 96,
  dateRange = "3M",
}: {
  symbol: string;
  height?: number;
  dateRange?: "1D" | "1M" | "3M" | "12M" | "60M" | "ALL";
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML =
      '<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>';

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.type = "text/javascript";
    script.text = JSON.stringify({
      symbol,
      width: "100%",
      height: "100%",
      locale: "fr",
      dateRange,
      colorTheme: "light",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
      noTimeScale: true,
      chartOnly: false,
      trendLineColor: "rgba(90, 124, 79, 1)",
      underLineColor: "rgba(90, 124, 79, 0.18)",
      underLineBottomColor: "rgba(90, 124, 79, 0)",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol, dateRange]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height }}
    />
  );
}
