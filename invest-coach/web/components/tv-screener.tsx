"use client";

import { useEffect, useRef } from "react";

export function TvScreener({
  market = "france",
  defaultScreen = "most_capitalized",
  height = 500,
}: {
  market?: "france" | "america" | "germany" | "uk";
  defaultScreen?:
    | "most_capitalized"
    | "top_gainers"
    | "top_losers"
    | "most_active";
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML =
      '<div class="tradingview-widget-container__widget"></div>';

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
    script.async = true;
    script.type = "text/javascript";
    script.text = JSON.stringify({
      width: "100%",
      height,
      defaultColumn: "overview",
      defaultScreen,
      market,
      showToolbar: true,
      colorTheme: "light",
      locale: "fr",
      isTransparent: true,
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [market, defaultScreen, height]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height }}
    />
  );
}
