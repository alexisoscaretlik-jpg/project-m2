import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { type CerfaMapping, SUPPORTED_BOXES } from "./cerfa";

// PDF generator — produces a clean one-page (or two) summary of the
// user's declaration, grouped by Cerfa 2042 section.
//
// We generate from scratch because impots.gouv.fr only publishes the
// flat non-fillable print PDF (empty /Fields array). Overlaying text
// on that flat form would require pixel-perfect coordinates per box
// — possible but brittle. The summary sheet is the pragmatic version:
// a cheat-sheet the user copies line-by-line into the online
// télédéclaration on impots.gouv.fr.

// Section grouping — maps prefixes/codes to a human-readable French
// section heading. Rendered in the order below.
const SECTIONS: { title: string; match: (code: string) => boolean }[] = [
  {
    title: "Situation familiale",
    match: (c) => ["M", "O", "D", "C", "V", "F"].includes(c),
  },
  { title: "1. Traitements, salaires, pensions", match: (c) => c.startsWith("1") },
  { title: "2. Revenus de capitaux mobiliers", match: (c) => c.startsWith("2") },
  { title: "3. Plus-values mobilières & crypto", match: (c) => c.startsWith("3") },
  { title: "4. Revenus fonciers", match: (c) => c.startsWith("4") },
  { title: "5. BNC / BIC", match: (c) => c.startsWith("5") },
  { title: "6. Charges déductibles du revenu global", match: (c) => c.startsWith("6") },
  { title: "7. Réductions & crédits d'impôt", match: (c) => c.startsWith("7") },
  { title: "8. Retenues et prélèvements", match: (c) => c.startsWith("8") },
];

// Formatting helpers
function fmtValue(v: number | boolean | null): string {
  if (v === null) return "—";
  if (typeof v === "boolean") return v ? "Oui (cocher)" : "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

function todayFr(): string {
  return new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

type DrawCtx = {
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  y: number;
  width: number;
  height: number;
  margin: number;
};

function newPage(pdf: PDFDocument, font: PDFFont, bold: PDFFont): DrawCtx {
  const page = pdf.addPage([595, 842]); // A4 portrait, in points
  const { width, height } = page.getSize();
  return { page, font, bold, y: height - 56, width, height, margin: 48 };
}

function ensureSpace(ctx: DrawCtx, needed: number, pdf: PDFDocument): DrawCtx {
  if (ctx.y - needed < ctx.margin) {
    return newPage(pdf, ctx.font, ctx.bold);
  }
  return ctx;
}

function drawLine(
  ctx: DrawCtx,
  text: string,
  opts?: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number },
) {
  const size = opts?.size ?? 10;
  const font = opts?.bold ? ctx.bold : ctx.font;
  const color = opts?.color ?? [0.1, 0.1, 0.12];
  ctx.page.drawText(text, {
    x: ctx.margin,
    y: ctx.y,
    size,
    font,
    color: rgb(color[0], color[1], color[2]),
  });
  ctx.y -= (opts?.gap ?? size + 4);
}

function drawRow(
  ctx: DrawCtx,
  code: string,
  description: string,
  value: string,
) {
  // Three columns: code (bold, ~50pt), description (wraps), value (right-aligned)
  const codeX = ctx.margin;
  const descX = ctx.margin + 55;
  const valueRightX = ctx.width - ctx.margin;

  // Truncate description if too long (wrapping would be nicer but keeps it tight)
  const maxDescChars = 64;
  const desc = description.length > maxDescChars
    ? description.slice(0, maxDescChars - 1) + "…"
    : description;

  ctx.page.drawText(code, {
    x: codeX,
    y: ctx.y,
    size: 10,
    font: ctx.bold,
    color: rgb(0.15, 0.3, 0.7),
  });
  ctx.page.drawText(desc, {
    x: descX,
    y: ctx.y,
    size: 9.5,
    font: ctx.font,
    color: rgb(0.25, 0.25, 0.3),
  });

  const valueWidth = ctx.font.widthOfTextAtSize(value, 10);
  ctx.page.drawText(value, {
    x: valueRightX - valueWidth,
    y: ctx.y,
    size: 10,
    font: ctx.bold,
    color: rgb(0.1, 0.5, 0.2),
  });
  ctx.y -= 16;
}

function drawSeparator(ctx: DrawCtx) {
  ctx.page.drawLine({
    start: { x: ctx.margin, y: ctx.y + 4 },
    end: { x: ctx.width - ctx.margin, y: ctx.y + 4 },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.88),
  });
  ctx.y -= 8;
}

export type FillResult = {
  pdfBytes: Uint8Array;
  filled: string[];
  unmatched: string[];
};

/**
 * Generate a one-page (or few) summary PDF of the user's Cerfa 2042
 * mapping. Returns bytes + diagnostics.
 *
 * The `blankPdfPath` parameter is kept in the signature for backward
 * compatibility but ignored — we generate from scratch.
 */
export async function fillCerfa2042(
  mapping: CerfaMapping,
  _blankPdfPath?: string,
  extras?: { year?: number; assumptions?: string[]; userEmail?: string },
): Promise<FillResult> {
  // _blankPdfPath is accepted for backward compatibility with earlier
  // callers but intentionally unused — we generate from scratch.
  void _blankPdfPath;
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let ctx = newPage(pdf, font, bold);

  // Header
  const year = extras?.year ?? new Date().getFullYear();
  drawLine(ctx, `Déclaration Cerfa 2042 — revenus ${year}`, {
    size: 16,
    bold: true,
    gap: 22,
  });
  drawLine(ctx, `Généré le ${todayFr()}${extras?.userEmail ? ` · ${extras.userEmail}` : ""}`, {
    size: 9,
    color: [0.5, 0.5, 0.55],
    gap: 18,
  });
  drawLine(
    ctx,
    "Feuille de saisie — à reporter ligne par ligne sur impots.gouv.fr.",
    { size: 9.5, color: [0.3, 0.3, 0.35], gap: 16 },
  );
  drawSeparator(ctx);

  // Group mapping entries by section
  const filled: string[] = [];
  const unmatched: string[] = [];
  const entries = Object.entries(mapping);

  for (const section of SECTIONS) {
    const rows = entries.filter(([code]) => section.match(code));
    if (rows.length === 0) continue;

    ctx = ensureSpace(ctx, 30, pdf);
    drawLine(ctx, section.title, { size: 11, bold: true, gap: 16 });

    for (const [code, value] of rows) {
      const desc = SUPPORTED_BOXES[code];
      if (!desc) {
        unmatched.push(code);
        continue;
      }
      ctx = ensureSpace(ctx, 20, pdf);
      drawRow(ctx, code, desc, fmtValue(value));
      filled.push(code);
    }
    ctx.y -= 4;
  }

  // Assumptions Claude made
  if (extras?.assumptions && extras.assumptions.length > 0) {
    ctx = ensureSpace(ctx, 40, pdf);
    drawSeparator(ctx);
    drawLine(ctx, "Hypothèses retenues par l'assistant", { size: 11, bold: true, gap: 14 });
    for (const a of extras.assumptions) {
      ctx = ensureSpace(ctx, 16, pdf);
      const bullet = `• ${a}`;
      // Crude wrap: break at ~90 chars
      const chunks: string[] = [];
      let remaining = bullet;
      while (remaining.length > 90) {
        chunks.push(remaining.slice(0, 90));
        remaining = "  " + remaining.slice(90);
      }
      chunks.push(remaining);
      for (const c of chunks) {
        drawLine(ctx, c, { size: 9, color: [0.4, 0.4, 0.45], gap: 12 });
      }
    }
  }

  // Footer disclaimer
  ctx = ensureSpace(ctx, 50, pdf);
  drawSeparator(ctx);
  drawLine(
    ctx,
    "Avertissement — Document de préparation. Ne remplace pas la déclaration",
    { size: 8.5, color: [0.5, 0.5, 0.55], gap: 10 },
  );
  drawLine(
    ctx,
    "officielle. Vous restez responsable des montants déclarés sur",
    { size: 8.5, color: [0.5, 0.5, 0.55], gap: 10 },
  );
  drawLine(
    ctx,
    "impots.gouv.fr. Ne constitue pas un conseil fiscal personnalisé.",
    { size: 8.5, color: [0.5, 0.5, 0.55], gap: 10 },
  );

  const pdfBytes = await pdf.save();
  return { pdfBytes, filled, unmatched };
}
