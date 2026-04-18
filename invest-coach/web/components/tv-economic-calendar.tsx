"use client";

import { useEffect, useRef } from "react";

export function TvEconomicCalendar({ height = 480 }: { height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML =
      '<div class="tradingview-widget-container__widget"></div>';

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.async = true;
    script.type = "text/javascript";
    script.text = JSON.stringify({
      colorTheme: "light",
      isTransparent: true,
      width: "100%",
      height,
      locale: "fr",
      importanceFilter: "0,1",
      countryFilter: "fr,de,eu,us,gb",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [height]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height }}
    />
  );
}
