"use client";

import { useEffect, useRef } from "react";

export function TvMarketOverview() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML =
      '<div class="tradingview-widget-container__widget"></div>';

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.type = "text/javascript";
    script.text = JSON.stringify({
      colorTheme: "light",
      dateRange: "12M",
      showChart: true,
      locale: "fr",
      width: "100%",
      height: 520,
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      plotLineColorGrowing: "rgba(90, 124, 79, 1)",
      plotLineColorFalling: "rgba(204, 116, 72, 1)",
      gridLineColor: "rgba(216, 193, 148, 0.5)",
      scaleFontColor: "rgba(42, 40, 32, 1)",
      belowLineFillColorGrowing: "rgba(90, 124, 79, 0.18)",
      belowLineFillColorFalling: "rgba(204, 116, 72, 0.18)",
      belowLineFillColorGrowingBottom: "rgba(90, 124, 79, 0)",
      belowLineFillColorFallingBottom: "rgba(204, 116, 72, 0)",
      symbolActiveColor: "rgba(90, 124, 79, 0.18)",
      tabs: [
        {
          title: "Indices",
          symbols: [
            { s: "EURONEXT:PX1", d: "CAC 40" },
            { s: "INDEX:SX5E", d: "Euro Stoxx 50" },
            { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
            { s: "NASDAQ:NDX", d: "Nasdaq 100" },
            { s: "INDEX:DEU40", d: "DAX" },
            { s: "INDEX:UKX", d: "FTSE 100" },
          ],
          originalTitle: "Indices",
        },
        {
          title: "Actions FR",
          symbols: [
            { s: "EURONEXT:MC", d: "LVMH" },
            { s: "EURONEXT:RMS", d: "Hermès" },
            { s: "EURONEXT:TTE", d: "TotalEnergies" },
            { s: "EURONEXT:SAN", d: "Sanofi" },
            { s: "EURONEXT:AIR", d: "Airbus" },
          ],
          originalTitle: "FR",
        },
        {
          title: "Tech US",
          symbols: [
            { s: "NASDAQ:AAPL", d: "Apple" },
            { s: "NASDAQ:MSFT", d: "Microsoft" },
            { s: "NASDAQ:NVDA", d: "Nvidia" },
            { s: "NASDAQ:GOOGL", d: "Alphabet" },
            { s: "NASDAQ:META", d: "Meta" },
          ],
          originalTitle: "Tech",
        },
        {
          title: "Forex",
          symbols: [
            { s: "FX_IDC:EURUSD", d: "EUR / USD" },
            { s: "FX_IDC:EURGBP", d: "EUR / GBP" },
            { s: "FX_IDC:EURJPY", d: "EUR / JPY" },
            { s: "FX_IDC:EURCHF", d: "EUR / CHF" },
          ],
          originalTitle: "FX",
        },
      ],
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height: 520 }}
    />
  );
}
