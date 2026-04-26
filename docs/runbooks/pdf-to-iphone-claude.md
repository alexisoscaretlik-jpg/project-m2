# Runbook: PDF reference accessible from iPhone Claude Code

Drop a PDF into the repo as a markdown reference so iPhone Claude Code can
read and search it.

## Prereqs (one-time)

```sh
pip3 install --user pymupdf
```

## Steps

1. **Extract**

   ```sh
   python3 scripts/pdf_to_md.py /path/to/book.pdf
   ```

   Writes `docs/reference/<slug>.md`. Pass a second arg to override the
   output path.

2. **Spot-check** the output. The script handles:
   - Stripping piracy-site watermarks (OceanofPDF, libgen, z-lib)
   - Joining dropped-capital first letters
   - Stitching paragraphs broken across PDF blocks
   - Promoting all-caps blocks to H2 headings

   Look for: garbled chapter headings, paragraphs collapsed into one block,
   stray header letters mid-sentence. Edit by hand if needed — the script
   is best-effort, not pixel-perfect.

3. **Commit + push**

   ```sh
   git add docs/reference/<slug>.md
   git commit -m "docs: add <title> reference"
   git push
   ```

4. **iPhone access**: open the repo in Claude Code mobile, point at the
   branch with the file. Reference is ~200 KB markdown — Claude can grep
   and quote it directly.

## Public-repo guardrail

`project-m2` is public. Don't commit the PDF binary itself if its source
is a piracy site (filename gives it away — `OceanofPDF`, `libgen`, etc.).
Markdown extraction of public-domain text is fine; the binary is not.

For US public domain: anything published before 1928 (as of 2026).
