"""
Fetch press releases from French / EU companies that don't file with
the SEC (LVMH, Hermès, Airbus). For each one, find recent regulated-
information releases on the company's IR page, extract signals with
Claude (8-K-style prompt — these are event-level disclosures), and
write filing + extraction + card rows.

Run once manually:
    python eu_filings.py
    python eu_filings.py MC.PA RMS.PA

Or scheduled via Render cron alongside run.py.
"""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx
from anthropic import Anthropic
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client

# Reuse the SEC worker's extract/body/tone — press releases fit the
# 8-K "event" schema cleanly.
from run import MODEL, body_8k, extract, tone_8k  # noqa: E402

load_dotenv(Path(__file__).parent.parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]

# Tickers that don't file with SEC → scrape the IR page.
EU_SOURCES = {
    "MC.PA":  {"index_url": "https://www.lvmh.com/en/news-documents",              "source": "lvmh_ir"},
    "RMS.PA": {"index_url": "https://finance.hermes.com/en/press-releases/",       "source": "hermes_ir"},
    "AIR.PA": {"index_url": "https://www.airbus.com/en/newsroom/press-releases",   "source": "airbus_ir"},
}

DEFAULT_TICKERS = list(EU_SOURCES.keys())
MAX_RELEASES_PER_RUN = 3
HTTP_UA = "Mozilla/5.0 (compatible; InvestCoach/1.0; +https://trading-bot-2-opal.vercel.app)"

LIST_PROMPT = """\
You are scanning a company's investor-relations page. Extract the
most recent regulated-information press releases (earnings,
guidance, M&A, governance, results). Skip marketing content
(product launches, sponsorships, ads, careers).

Return JSON only:
{"press_releases":[
  {"title": "...", "url": "https://absolute.url", "date": "YYYY-MM-DD"}
]}

- Use absolute URLs (prefix with the page's origin if href is relative).
- Return at most 5, most recent first.
- If the date is ambiguous, use null.
"""


def fetch_html(url: str) -> str:
    r = httpx.get(url, headers={"User-Agent": HTTP_UA}, timeout=30, follow_redirects=True)
    r.raise_for_status()
    return r.text


def clean_text(html: str, cap: int = 40_000) -> str:
    soup = BeautifulSoup(html, "html.parser")
    # Preserve links so Claude can see them.
    for a in soup.find_all("a", href=True):
        a.insert_after(f" [{a['href']}]")
    text = soup.get_text(separator="\n")
    text = "\n".join(line.strip() for line in text.splitlines() if line.strip())
    return text[:cap]


def list_releases(index_url: str) -> list[dict]:
    html = fetch_html(index_url)
    blob = clean_text(html)
    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        system=LIST_PROMPT,
        messages=[
            {"role": "user", "content": f"Page URL: {index_url}\n\n{blob}"},
            {"role": "assistant", "content": "{"},
        ],
    )
    data = json.loads("{" + response.content[0].text)
    out: list[dict] = []
    for r in data.get("press_releases", [])[:MAX_RELEASES_PER_RUN * 2]:
        url = (r.get("url") or "").strip()
        if not url.startswith("http"):
            continue
        out.append({
            "title": r.get("title") or "",
            "url": url,
            "date": r.get("date"),
        })
    return out[:MAX_RELEASES_PER_RUN]


def fetch_release_body(url: str, cap: int = 15_000) -> str:
    html = fetch_html(url)
    return clean_text(html, cap=cap)


def slug_for(ticker: str, filed_at: str, url: str) -> str:
    h = abs(hash(url)) % 10_000
    return f"{ticker.lower().replace('.', '-')}-eu-{filed_at}-{h:04d}"


def run_for_ticker(sb, ticker: str) -> None:
    src = EU_SOURCES[ticker]
    print(f"[{ticker}] index {src['index_url']}")

    company = (
        sb.table("companies").select("*").eq("ticker", ticker).single().execute().data
    )
    if not company:
        print(f"[{ticker}] not in companies table — skip")
        return

    try:
        releases = list_releases(src["index_url"])
    except Exception as e:
        print(f"[{ticker}] list failed: {e}")
        return
    print(f"[{ticker}]   {len(releases)} recent release(s)")

    for rel in releases:
        url = rel["url"]
        title = rel["title"]
        filed_at = rel["date"] or datetime.now(timezone.utc).strftime("%Y-%m-%d")

        existing = (
            sb.table("filings").select("id")
            .eq("source", src["source"]).eq("source_url", url)
            .execute().data
        )
        if existing:
            print(f"[{ticker}]   skip (already have): {title[:70]}")
            continue

        try:
            text = fetch_release_body(url)
        except Exception as e:
            print(f"[{ticker}]   fetch failed for {url}: {e}")
            continue
        if len(text) < 500:
            print(f"[{ticker}]   body too short — skip")
            continue

        print(f"[{ticker}]   extracting: {title[:70]}")
        try:
            signals = extract(text, "8-K")
        except Exception as e:
            print(f"[{ticker}]   extract failed: {e}")
            continue

        filing = (
            sb.table("filings").insert({
                "company_id": company["id"],
                "doc_type": "press_release",
                "source": src["source"],
                "source_url": url,
                "filed_at": datetime.strptime(filed_at, "%Y-%m-%d")
                    .replace(tzinfo=timezone.utc).isoformat(),
                "raw_text": text,
            }).execute().data[0]
        )
        extraction = (
            sb.table("extractions").insert({
                "filing_id": filing["id"],
                "model": MODEL,
                "prompt_version": "8k_v1_eu",
                "signals": signals,
                "the_one_thing": signals.get("the_one_thing"),
                "confidence": signals.get("confidence"),
            }).execute().data[0]
        )
        sb.table("cards").insert({
            "slug": slug_for(ticker, filed_at, url),
            "company_id": company["id"],
            "extraction_id": extraction["id"],
            "title": f"{company['name']} · {filed_at}",
            "body_markdown": body_8k(signals, url, filed_at),
            "tone": tone_8k(signals),
        }).execute()
        print(f"[{ticker}]   ✓ card written")


def main() -> None:
    argv = sys.argv[1:]
    tickers = argv or DEFAULT_TICKERS
    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    for t in tickers:
        if t not in EU_SOURCES:
            print(f"[{t}] no EU source configured — skip")
            continue
        try:
            run_for_ticker(sb, t)
        except Exception as e:
            print(f"[{t}] ERROR: {e}")


if __name__ == "__main__":
    main()
