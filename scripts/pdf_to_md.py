#!/usr/bin/env python3
"""Extract a PDF to markdown for use as Claude Code reference material.

Usage:
    python3 scripts/pdf_to_md.py INPUT.pdf [OUTPUT.md]

If OUTPUT.md is omitted, writes to docs/reference/<slug>.md.

Requires: pip install pymupdf
"""
import argparse, re, sys, pathlib

try:
    import fitz
except ImportError:
    sys.exit("pymupdf not installed. Run: pip install --user pymupdf")


def slugify(name: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", name).strip("-").lower()
    return s or "document"


def extract(pdf_path: pathlib.Path) -> str:
    doc = fitz.open(pdf_path)
    blocks_text = []
    for page in doc:
        blocks = page.get_text("blocks")
        blocks.sort(key=lambda b: (round(b[1]), round(b[0])))
        for b in blocks:
            txt = b[4]
            if not txt.strip():
                continue
            # Strip common piracy-site watermarks
            if re.search(r"OceanofPDF\.com|libgen|z-?lib\.org", txt, re.I):
                continue
            para = re.sub(r"\s+", " ", txt).strip()
            if para:
                blocks_text.append(para)

    # Stitch dropped capitals (single-letter block followed by body)
    fixed = []
    i = 0
    while i < len(blocks_text):
        cur = blocks_text[i]
        if re.fullmatch(r"[A-Z]", cur) and i + 1 < len(blocks_text):
            fixed.append(cur + blocks_text[i + 1])
            i += 2
            continue
        fixed.append(cur)
        i += 1

    # Stitch paragraphs broken mid-sentence
    stitched = []
    for para in fixed:
        if stitched and not re.search(r"[.!?\"\)]\s*$", stitched[-1]) \
                and para and (para[0].islower() or para[0] in "',\""):
            stitched[-1] = stitched[-1] + " " + para
            continue
        stitched.append(para)

    # Promote all-caps blocks to H2 headings
    out_lines = []
    for para in stitched:
        if para == para.upper() and any(c.isalpha() for c in para) and len(para) < 80:
            out_lines.append("")
            out_lines.append(f"## {para.title()}")
            out_lines.append("")
        else:
            out_lines.append(para)
            out_lines.append("")

    text = "\n".join(out_lines)

    # Normalize fancy punctuation to ASCII-friendly forms
    repl = {"‘": "'", "’": "'", "“": '"', "”": '"',
            "—": "--", "–": "-", "…": "..."}
    for k, v in repl.items():
        text = text.replace(k, v)

    # Strip single-letter floater artifacts (PDF page-header bleed)
    text = re.sub(r" [a-z] (?=[a-z])", " ", text)
    text = re.sub(r" [a-z] (?=[a-z])", " ", text)
    text = re.sub(r"  +", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    title = doc.metadata.get("title") or pdf_path.stem
    return f"# {title}\n\n*Source: {pdf_path.name}*\n\n{text.lstrip()}"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("pdf", type=pathlib.Path)
    ap.add_argument("output", type=pathlib.Path, nargs="?")
    args = ap.parse_args()

    if not args.pdf.exists():
        sys.exit(f"not found: {args.pdf}")

    md = extract(args.pdf)

    out = args.output or pathlib.Path("docs/reference") / f"{slugify(args.pdf.stem)}.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(md)
    print(f"wrote {out} ({len(md):,} chars)")


if __name__ == "__main__":
    main()
