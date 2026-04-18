"""
Worker: fetch the most recent 8-K and 10-K for a given ticker, run
extraction, write filing + extraction + card rows to Supabase.

Usage (from invest-coach/worker/ with venv active):
    python run.py                      # default: AAPL MSFT NVDA BRK.B
    python run.py AAPL
    python run.py AAPL --forms 8-K     # only 8-K
    python run.py AAPL --forms 10-K    # only 10-K

Requires a CIK on the companies row — US tickers only.
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

MODEL = "claude-haiku-4-5"
DEFAULT_TICKERS = ["AAPL", "MSFT", "NVDA", "BRK.B"]

# Per-form configuration. Each form has its own prompt, schema, body
# renderer and tone classifier.

PROMPT_8K = """\
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

PROMPT_10K = """\
ROLE: You are an investment analyst extracting signals from
a 10-K annual filing. You do not summarize — you flag what
a portfolio manager needs to know in 2 minutes.

EXTRACT — populate this schema:

{
  "business_one_liner": "What the company actually sells, in plain language",
  "revenue": {
    "total": number,
    "yoy_growth_pct": number,
    "segments": [{"name": "...", "revenue": number, "yoy_pct": number, "pct_of_total": number}],
    "concentration_risk": "top customer or segment % of revenue if >10%"
  },
  "margins": {
    "gross_pct": number, "gross_trend": "expanding|stable|compressing",
    "operating_pct": number, "operating_trend": "expanding|stable|compressing",
    "net_pct": number
  },
  "cash_quality": {
    "ocf": number, "net_income": number,
    "ocf_ni_ratio": number,
    "flag": "healthy | watch | red"
  },
  "balance_sheet_stress": {
    "net_debt_ebitda": number,
    "inventory_days_change_yoy": number,
    "receivables_days_change_yoy": number,
    "flags": ["inventory buildup", "AR stretching"]
  },
  "new_risks_vs_prior_year": ["..."],
  "mda_tone_shift": "more confident | same | hedging more",
  "mda_hedging_phrases": ["..."],
  "capital_allocation": {
    "buybacks": number, "dividends": number, "capex": number,
    "stock_based_comp": number,
    "dilution_pct": number,
    "judgment": "shareholder-friendly | reinvesting | diluting"
  },
  "red_flags": ["..."],
  "the_one_thing": "Single sentence. Specific. Quantitative.",
  "confidence": "high | medium | low",
  "pages_cited": [1, 23, 47]
}

CRITICAL OUTPUT RULES — violation breaks the pipeline:
- Response MUST start with { and end with }
- No markdown, no tables, no headings, no prose before or after
- No ```json fences
- Use null for missing values — never invent
- All keys in schema must be present, even if value is null

CONTENT RULES:
- "the_one_thing" must be specific and numeric.
- Compare to prior year whenever data permits.
- Flag anything a short-seller would flag.
- If a section isn't in the provided text, leave the field null. Do not guess.
"""

FORM_CONFIG = {
    "8-K": {
        "prompt": PROMPT_8K,
        "prompt_version": "8k_v1",
        "text_cap": 15000,
        "max_tokens": 1500,
    },
    "10-K": {
        "prompt": PROMPT_10K,
        "prompt_version": "10k_v2",
        "text_cap": 40000,
        "max_tokens": 2500,
    },
}


def fetch_recent(cik: str, form: str) -> dict | None:
    """Return the most recent filing of the given form, or None."""
    cik_padded = cik.zfill(10)
    headers = {"User-Agent": SEC_USER_AGENT}

    r = httpx.get(
        f"https://data.sec.gov/submissions/CIK{cik_padded}.json",
        headers=headers,
        timeout=30,
    )
    r.raise_for_status()
    recent = r.json()["filings"]["recent"]

    for i, f in enumerate(recent["form"]):
        if f != form:
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
            "text": text[: FORM_CONFIG[form]["text_cap"]],
        }
    return None


def extract(text: str, form: str) -> dict:
    cfg = FORM_CONFIG[form]
    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=MODEL,
        max_tokens=cfg["max_tokens"],
        system=cfg["prompt"],
        messages=[
            {"role": "user", "content": text},
            {"role": "assistant", "content": "{"},
        ],
    )
    return json.loads("{" + response.content[0].text)


# ---------- Tone ----------

def tone_8k(signals: dict) -> str:
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


def tone_10k(signals: dict) -> str:
    if signals.get("red_flags"):
        return "red_flag"
    cash = ((signals.get("cash_quality") or {}).get("flag") or "").lower()
    if cash == "red":
        return "red_flag"
    mda = (signals.get("mda_tone_shift") or "").lower()
    if "hedging" in mda:
        return "cautious"
    margins = signals.get("margins") or {}
    if margins.get("gross_trend") == "expanding" and margins.get("operating_trend") == "expanding":
        return "bullish"
    if "compressing" in {margins.get("gross_trend"), margins.get("operating_trend")}:
        return "cautious"
    return "educational"


# ---------- Card body renderers ----------

def _maybe(value, suffix=""):
    return f"{value}{suffix}" if value is not None else "—"


def body_8k(signals: dict, filing_url: str, filed_at: str) -> str:
    lines = [f"**{(signals.get('the_one_thing') or '').strip()}**", ""]

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
        f"Event: `{signals.get('event_type') or '—'}`",
        f"Materiality: `{signals.get('materiality') or '—'}`",
        f"Guidance: `{signals.get('guidance_change') or '—'}`",
        f"Tone vs prior: `{signals.get('tone_shift_vs_prior') or '—'}`",
        f"Confidence: `{signals.get('confidence') or '—'}`",
    ]
    lines.append(" · ".join(meta))
    lines.append("")
    lines.append(f"Filed {filed_at} · [Source 8-K]({filing_url})")
    return "\n".join(lines)


def body_10k(signals: dict, filing_url: str, filed_at: str) -> str:
    lines = [f"**{(signals.get('the_one_thing') or '').strip()}**", ""]

    bol = signals.get("business_one_liner")
    if bol:
        lines.append(f"*{bol}*")
        lines.append("")

    rev = signals.get("revenue") or {}
    if rev:
        lines.append("### Revenue")
        total = rev.get("total")
        yoy = rev.get("yoy_growth_pct")
        lines.append(f"- **Total**: {_maybe(total)} · YoY {_maybe(yoy, '%')}")
        segs = rev.get("segments") or []
        for s in segs[:5]:
            lines.append(
                f"- **{s.get('name', '?')}**: {_maybe(s.get('revenue'))} "
                f"({_maybe(s.get('pct_of_total'), '%')} of total, YoY {_maybe(s.get('yoy_pct'), '%')})"
            )
        if rev.get("concentration_risk"):
            lines.append(f"- Concentration: {rev['concentration_risk']}")
        lines.append("")

    margins = signals.get("margins") or {}
    if margins:
        lines.append("### Margins")
        lines.append(
            f"- **Gross**: {_maybe(margins.get('gross_pct'), '%')} "
            f"(`{margins.get('gross_trend') or '—'}`)"
        )
        lines.append(
            f"- **Operating**: {_maybe(margins.get('operating_pct'), '%')} "
            f"(`{margins.get('operating_trend') or '—'}`)"
        )
        lines.append(f"- **Net**: {_maybe(margins.get('net_pct'), '%')}")
        lines.append("")

    cash = signals.get("cash_quality") or {}
    if cash:
        lines.append("### Cash quality")
        lines.append(
            f"- OCF/NI ratio: {_maybe(cash.get('ocf_ni_ratio'))} · "
            f"flag: `{cash.get('flag') or '—'}`"
        )
        lines.append("")

    new_risks = signals.get("new_risks_vs_prior_year") or []
    if new_risks:
        lines.append("### New risks vs last year")
        for r in new_risks:
            lines.append(f"- {r}")
        lines.append("")

    red_flags = signals.get("red_flags") or []
    if red_flags:
        lines.append("### Red flags")
        for rf in red_flags:
            lines.append(f"- {rf}")
        lines.append("")

    capital = signals.get("capital_allocation") or {}
    if capital:
        lines.append("### Capital allocation")
        lines.append(
            f"- Buybacks: {_maybe(capital.get('buybacks'))} · "
            f"Dividends: {_maybe(capital.get('dividends'))} · "
            f"Capex: {_maybe(capital.get('capex'))}"
        )
        judgment = capital.get("judgment")
        if judgment:
            lines.append(f"- Judgment: `{judgment}`")
        lines.append("")

    meta = [
        f"MD&A tone: `{signals.get('mda_tone_shift') or '—'}`",
        f"Confidence: `{signals.get('confidence') or '—'}`",
    ]
    lines.append(" · ".join(meta))
    lines.append("")
    lines.append(f"Filed {filed_at} · [Source 10-K]({filing_url})")
    return "\n".join(lines)


BODY_RENDERERS = {"8-K": body_8k, "10-K": body_10k}
TONE_CLASSIFIERS = {"8-K": tone_8k, "10-K": tone_10k}


def _write_card(sb, company, form, filing_id, extraction_id, signals, url, filed_at, accession):
    ticker = company["ticker"]
    sb.table("cards").insert(
        {
            "slug": f"{ticker.lower()}-{form.lower()}-{filed_at}-{accession[-6:]}",
            "company_id": company["id"],
            "extraction_id": extraction_id,
            "title": f"{company['name']} {form} · {filed_at}",
            "body_markdown": BODY_RENDERERS[form](signals, url, filed_at),
            "tone": TONE_CLASSIFIERS[form](signals),
        }
    ).execute()


def run_for_ticker_form(sb, company: dict, form: str) -> None:
    ticker = company["ticker"]
    cfg = FORM_CONFIG[form]

    print(f"[{ticker}:{form}] fetching…")
    doc = fetch_recent(company["cik"], form)
    if not doc:
        print(f"[{ticker}:{form}] no filing found")
        return
    print(f"[{ticker}:{form}]   filed {doc['filed_at']} · {len(doc['text'])} chars")

    existing_filing = (
        sb.table("filings")
        .select("id")
        .eq("source", "edgar")
        .eq("source_url", doc["url"])
        .execute()
        .data
    )

    if existing_filing:
        filing_id = existing_filing[0]["id"]
        existing_card = (
            sb.table("cards").select("id").eq("company_id", company["id"])
            .ilike("slug", f"{ticker.lower()}-{form.lower()}-{doc['filed_at']}-%")
            .execute().data
        )
        if existing_card:
            print(f"[{ticker}:{form}] card exists — skip")
            return
        # Filing + extraction already exist, card missing. Rebuild card
        # from stored signals (no re-fetch, no re-Haiku call).
        extraction = (
            sb.table("extractions").select("id, signals")
            .eq("filing_id", filing_id)
            .order("created_at", desc=True).limit(1).execute().data
        )
        if not extraction:
            print(f"[{ticker}:{form}] filing exists but no extraction — skip (manual)")
            return
        print(f"[{ticker}:{form}] repairing card from stored extraction…")
        _write_card(
            sb, company, form, filing_id, extraction[0]["id"],
            extraction[0]["signals"], doc["url"], doc["filed_at"], doc["accession"],
        )
        print(f"[{ticker}:{form}] ✓ card repaired")
        return

    print(f"[{ticker}:{form}] extracting with {MODEL}…")
    signals = extract(doc["text"], form)

    filing = (
        sb.table("filings")
        .insert(
            {
                "company_id": company["id"],
                "doc_type": form,
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
                "prompt_version": cfg["prompt_version"],
                "signals": signals,
                "the_one_thing": signals.get("the_one_thing"),
                "confidence": signals.get("confidence"),
            }
        )
        .execute()
        .data[0]
    )

    _write_card(
        sb, company, form, filing["id"], extraction["id"],
        signals, doc["url"], doc["filed_at"], doc["accession"],
    )
    print(f"[{ticker}:{form}] ✓ card written")


def run_for_ticker(ticker: str, forms: list[str]) -> None:
    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    company = (
        sb.table("companies").select("*").eq("ticker", ticker).single().execute().data
    )
    if not company:
        print(f"[{ticker}] not in companies table — skip")
        return
    if not company.get("cik"):
        print(f"[{ticker}] no CIK — skip (non-US?)")
        return

    for form in forms:
        try:
            run_for_ticker_form(sb, company, form)
        except Exception as e:
            print(f"[{ticker}:{form}] ERROR: {e}")


def parse_args(argv: list[str]) -> tuple[list[str], list[str]]:
    forms = ["8-K", "10-K"]
    tickers: list[str] = []
    i = 0
    while i < len(argv):
        if argv[i] == "--forms":
            forms = [f.strip() for f in argv[i + 1].split(",")]
            i += 2
        else:
            tickers.append(argv[i])
            i += 1
    if not tickers:
        tickers = DEFAULT_TICKERS
    return tickers, forms


def main() -> None:
    tickers, forms = parse_args(sys.argv[1:])
    print(f"Running: tickers={tickers} forms={forms}")
    for t in tickers:
        run_for_ticker(t, forms)


if __name__ == "__main__":
    main()
