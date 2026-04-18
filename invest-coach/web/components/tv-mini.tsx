"use client";

import { useEffect, useRef } from "react";

export function TvMini({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      symbol,
      width: "100%",
      height: 80,
      locale: "fr",
      dateRange: "3M",
      colorTheme: "light",
      isTransparent: true,
      autosize: false,
      largeChartUrl: "",
      noTimeScale: true,
      trendLineColor: "rgba(37, 99, 235, 1)",
      underLineColor: "rgba(37, 99, 235, 0.1)",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" style={{ height: 80 }}>
      <div ref={ref} className="tradingview-widget-container__widget" />
    </div>
  );
}
