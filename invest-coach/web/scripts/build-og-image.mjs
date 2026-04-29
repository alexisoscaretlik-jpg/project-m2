#!/usr/bin/env node
// One-off: render the brand Open Graph card as a 1200×630 PNG and write
// it to public/og-image.png. We can't use next/og at build time because
// @opennextjs/cloudflare on Next 16 fails on its WASM bundle (proven by
// PR #7's Cloudflare Workers Build failure). So we pre-bake.
//
// Run: cd invest-coach/web && node scripts/build-og-image.mjs
// Output: invest-coach/web/public/og-image.png

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "..", "public", "og-image.png");

const W = 1200;
const H = 630;

// SVG composed inline. Fonts use generic families because libvips picks
// from system fontconfig — sandbox has DejaVu / Liberation Sans, plenty
// crisp at this size. If you want a specific brand font (Inter Tight,
// Source Serif), drop the .ttf into ./fonts and point fontconfig at it.
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"  stop-color="#1c1542" />
      <stop offset="45%" stop-color="#2a1f5c" />
      <stop offset="100%" stop-color="#6747e0" />
    </linearGradient>
    <radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#c4b5fd" stop-opacity="0.95" />
      <stop offset="60%"  stop-color="#c4b5fd" stop-opacity="0.30" />
      <stop offset="100%" stop-color="#c4b5fd" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Background gradient -->
  <rect width="${W}" height="${H}" fill="url(#bg)" />

  <!-- Subtle dot field, lavender particles, top-right corner -->
  ${dotField(W, H)}

  <!-- Top brand row -->
  <g transform="translate(80, 80)">
    <!-- Glowing dot -->
    <circle cx="32" cy="20" r="48" fill="url(#dotGlow)" />
    <circle cx="32" cy="20" r="12" fill="#c4b5fd" />
    <text x="68" y="28"
          font-family="'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif"
          font-weight="700" font-size="22" letter-spacing="3.5"
          fill="#ddd6fe">INVEST COACH</text>
  </g>

  <!-- Headline -->
  <g transform="translate(80, 270)">
    <text x="0" y="0"
          font-family="'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif"
          font-weight="700" font-size="84" letter-spacing="-2.5"
          fill="#ffffff">Économiser de l'impôt,</text>
    <text x="0" y="100"
          font-family="'Source Serif 4', 'Source Serif Pro', 'Georgia', 'Times New Roman', serif"
          font-style="italic" font-weight="500" font-size="84" letter-spacing="-2"
          fill="#c4b5fd">c'est gagner de l'argent.</text>
  </g>

  <!-- Sub copy -->
  <g transform="translate(80, 480)">
    <text x="0" y="0"
          font-family="'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif"
          font-weight="400" font-size="28" letter-spacing="-0.4"
          fill="rgba(255,255,255,0.78)">Le coaching d'investissement pour les épargnants français.</text>
    <text x="0" y="40"
          font-family="'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif"
          font-weight="400" font-size="28" letter-spacing="-0.4"
          fill="rgba(255,255,255,0.78)">PEA · Assurance-vie · PER · IR.</text>
  </g>

  <!-- Footer line -->
  <g transform="translate(80, 580)">
    <text x="0" y="0"
          font-family="'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif"
          font-weight="400" font-size="18"
          fill="rgba(255,255,255,0.55)">Newsletter du dimanche · podcast hebdo · 6 articles fact-checkés</text>
  </g>
</svg>`;

// Generates a sparse pseudo-random dot field for the top-right area
// (suggests the particle globe on the landing without overpowering the
// headline). Deterministic so re-runs produce the same image.
function dotField(w, h) {
  let out = "";
  let seed = 7;
  function rng() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }
  // Concentrated in the top-right quadrant
  for (let i = 0; i < 240; i++) {
    const x = w * (0.55 + rng() * 0.45);
    const y = h * (0.05 + rng() * 0.55);
    const r = 0.8 + rng() * 1.6;
    const a = 0.10 + rng() * 0.40;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#c4b5fd" fill-opacity="${a.toFixed(2)}" />`;
  }
  return out;
}

console.log(`Generating ${W}×${H} OG image…`);

const png = await sharp(Buffer.from(svg), { density: 96 })
  .resize(W, H, { fit: "cover" })
  .png({ compressionLevel: 9, quality: 90 })
  .toBuffer();

writeFileSync(outPath, png);

const info = await sharp(png).metadata();
console.log(`✓ wrote ${outPath}`);
console.log(`  ${info.width}×${info.height} · ${info.format} · ${(png.byteLength / 1024).toFixed(1)} KB`);
