import { ImageResponse } from "next/og";

// Dynamically generated Open Graph image for the landing.
// Next.js builds /opengraph-image at deploy time, dimensions 1200×630
// per the metadata flags below. Used as the default share preview when
// the site is shared on Twitter, LinkedIn, WhatsApp, Slack, etc.
//
// The same file shape powers /twitter-image (re-exported from
// app/twitter-image.tsx) so we keep one source of truth.

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Invest Coach — coaching fiscal pour épargnants français";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #1c1542 0%, #2a1f5c 45%, #6747e0 100%)",
          color: "#ffffff",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#c4b5fd",
              boxShadow: "0 0 32px 8px rgba(196,181,253,0.55)",
            }}
          />
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#ddd6fe",
            }}
          >
            Invest Coach
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#ffffff",
              maxWidth: 980,
            }}
          >
            Économiser de l&apos;impôt,
            <br />
            <span style={{ fontStyle: "italic", color: "#c4b5fd" }}>
              c&apos;est gagner de l&apos;argent.
            </span>
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 400,
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.78)",
              maxWidth: 880,
            }}
          >
            Le coaching d&apos;investissement pour les épargnants français.
            <br />
            PEA · Assurance-vie · PER · IR.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 18,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <div>Newsletter du dimanche · podcast hebdo · 5 articles fact-checkés</div>
          <div style={{ fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
            invest-coach
          </div>
        </div>
      </div>
    ),
    size,
  );
}
