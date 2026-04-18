"""
Worker: fetch the most recent 8-K for a given ticker, run extraction,
and write filing + extraction + card rows to Supabase.

Usage (from invest-coach/worker/ with venv active):
    python run.py AAPL
    python run.py MSFT NVDA BRK.B   # multiple

Requires a CIK on the companies row — so this only works for US tickers
for now (AAPL, MSFT, NVDA, BRK.B in the seed).
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

load_dotenv(Path(__file__).parent.parent / ".env")

SEC_USER_AGENT = os.environ["SEC_USER_AGENT"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

PROMPT_VERSION = "8k_v1"
MODEL = "claude-haiku-4-5"

SYSTEM_PROMPT = """\
You are an investment analyst extracting signals from SEC 8-K
filings. You do not summarize — you flag what a portfolio
manager needs to know in 30 seconds.

Populate this schema:

{
  "event_type": "earnings | guidance_change | M&A | exec_change | material_agreement | other",
  "materiality": "high | medium | low",
  "key_numbers": [
    {"label": "...", "value": "...", "yoy_change": "..."}
  ],
  "tone_shift_vs_prior": "more confident | same | hedging more | n/a",
  "guidance_change": "raised | maintained | lowered | withdrawn | none given",
  "red_flags": [],
  "the_one_thing": "Single specific sentence with numbers.",
  "confidence": "high | medium | low"
}

CRITICAL OUTPUT RULES:
- Response MUST start with { and end with }
- No markdown, no prose, no code fences
- Use null for missing values — never invent
"""


def fetch_recent_8k(cik: str) -> dict:
    """Returns dict with url, filed_at, accession, text — or None."""
    cik_padded = cik.zfill(10)
    headers = {"User-Agent": SEC_USER_AGENT}

    r = httpx.get(
        f"https://data.sec.gov/submissions/CIK{cik_padded}.json",
        headers=headers,
        timeout=30,
    )
    r.raise_for_status()
    data = r.json()
    recent = data["filings"]["recent"]

    for i, form in enumerate(recent["form"]):
        if form != "8-K":
            continue
        accession = recent["accessionNumber"][i].replace("-", "")
        primary_doc = recent["primaryDocument"][i]
        filed_at = recent["filingDate"][i]
        url = (
            f"https://www.sec.gov/Archives/edgar/data/"
            f"{int(cik)}/{accession}/{primary_doc}"
        )
        r = httpx.get(url, headers=headers, timeout=30)
        r.raise_for_status()
        text = BeautifulSoup(r.text, "html.parser").get_text(separator="\n")
        text = "\n".join(line.strip() for line in text.splitlines() if line.strip())
        return {
            "url": url,
            "filed_at": filed_at,
            "accession": accession,
            "text": text[:15000],
        }

    return None


def extract(text: str) -> dict:
    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": text},
            {"role": "assistant", "content": "{"},
        ],
    )
    return json.loads("{" + response.content[0].text)


def tone_from_signals(signals: dict) -> str:
    if signals.get("red_flags"):
        return "red_flag"
    guidance = (signals.get("guidance_change") or "").lower()
    if guidance == "raised":
        return "bullish"
    if guidance in {"lowered", "withdrawn"}:
        return "cautious"
    shift = (signals.get("tone_shift_vs_prior") or "").lower()
    if "hedging" in shift:
        return "cautious"
    if "more confident" in shift:
        return "bullish"
    return "educational"


def card_body(signals: dict, filing_url: str, filed_at: str) -> str:
    lines = [f"**{signals.get('the_one_thing', '').strip()}**", ""]

    numbers = signals.get("key_numbers") or []
    if numbers:
        lines.append("### Key numbers")
        for n in numbers:
            label = n.get("label") or ""
            value = n.get("value") or ""
            yoy = n.get("yoy_change")
            tail = f" ({yoy} YoY)" if yoy and yoy not in {"n/a", "null"} else ""
            lines.append(f"- **{label}**: {value}{tail}")
        lines.append("")

    red_flags = signals.get("red_flags") or []
    if red_flags:
        lines.append("### Red flags")
        for rf in red_flags:
            lines.append(f"- {rf}")
        lines.append("")

    meta = [
        f"Event: `{signals.get('event_type', '—')}`",
        f"Materiality: `{signals.get('materiality', '—')}`",
        f"Guidance: `{signals.get('guidance_change', '—')}`",
        f"Tone vs prior: `{signals.get('tone_shift_vs_prior', '—')}`",
        f"Confidence: `{signals.get('confidence', '—')}`",
    ]
    lines.append(" · ".join(meta))
    lines.append("")
    lines.append(f"Filed {filed_at} · [Source 8-K]({filing_url})")
    return "\n".join(lines)


def run_for_ticker(ticker: str) -> None:
    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    company = sb.table("companies").select("*").eq("ticker", ticker).single().execute().data
    if not company:
        print(f"[{ticker}] not in companies table — skip")
        return
    if not company.get("cik"):
        print(f"[{ticker}] no CIK on record — skip (non-US?)")
        return

    print(f"[{ticker}] fetching most recent 8-K…")
    doc = fetch_recent_8k(company["cik"])
    if not doc:
        print(f"[{ticker}] no 8-K found — skip")
        return
    print(f"[{ticker}]   filed {doc['filed_at']} · {len(doc['text'])} chars")

    existing = (
        sb.table("filings")
        .select("id")
        .eq("source", "edgar")
        .eq("source_url", doc["url"])
        .execute()
        .data
    )
    if existing:
        print(f"[{ticker}] already in db (filing {existing[0]['id']}) — skip")
        return

    print(f"[{ticker}] extracting with {MODEL}…")
    signals = extract(doc["text"])

    filing = (
        sb.table("filings")
        .insert(
            {
                "company_id": company["id"],
                "doc_type": "8-K",
                "source": "edgar",
                "source_url": doc["url"],
                "filed_at": datetime.strptime(doc["filed_at"], "%Y-%m-%d")
                .replace(tzinfo=timezone.utc)
                .isoformat(),
                "raw_text": doc["text"],
            }
        )
        .execute()
        .data[0]
    )

    extraction = (
        sb.table("extractions")
        .insert(
            {
                "filing_id": filing["id"],
                "model": MODEL,
                "prompt_version": PROMPT_VERSION,
                "signals": signals,
                "the_one_thing": signals.get("the_one_thing"),
                "confidence": signals.get("confidence"),
            }
        )
        .execute()
        .data[0]
    )

    sb.table("cards").insert(
        {
            "slug": f"{ticker.lower()}-8k-{doc['filed_at']}-{doc['accession'][-6:]}",
            "company_id": company["id"],
            "extraction_id": extraction["id"],
            "title": f"{company['name']} 8-K · {doc['filed_at']}",
            "body_markdown": card_body(signals, doc["url"], doc["filed_at"]),
            "tone": tone_from_signals(signals),
        }
    ).execute()

    print(f"[{ticker}] ✓ card written")


def main() -> None:
    tickers = sys.argv[1:] or ["AAPL"]
    for t in tickers:
        try:
            run_for_ticker(t)
        except Exception as e:
            print(f"[{t}] ERROR: {e}")


if __name__ == "__main__":
    main()
