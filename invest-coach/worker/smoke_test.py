"""
Smoke test: fetch Apple's most recent 8-K from SEC EDGAR, run it
through the 8-K extraction prompt, print the parsed JSON.

Proves end-to-end: SEC access + Claude API + prompt produces valid JSON.
Does NOT write to Supabase yet — that's the next step once this passes.

Run from invest-coach/worker/ with venv activated:
    python smoke_test.py
"""
import json
import os
from pathlib import Path

import httpx
from anthropic import Anthropic
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

SEC_USER_AGENT = os.environ["SEC_USER_AGENT"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
APPLE_CIK = "0000320193"

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


def fetch_recent_8k() -> tuple[str, str]:
    """Returns (filing_url, extracted_text) for Apple's most recent 8-K."""
    headers = {"User-Agent": SEC_USER_AGENT}

    submissions_url = f"https://data.sec.gov/submissions/CIK{APPLE_CIK}.json"
    r = httpx.get(submissions_url, headers=headers, timeout=30)
    r.raise_for_status()
    data = r.json()

    recent = data["filings"]["recent"]
    for i, form in enumerate(recent["form"]):
        if form != "8-K":
            continue
        accession_raw = recent["accessionNumber"][i]
        accession = accession_raw.replace("-", "")
        primary_doc = recent["primaryDocument"][i]
        filing_url = (
            f"https://www.sec.gov/Archives/edgar/data/"
            f"{int(APPLE_CIK)}/{accession}/{primary_doc}"
        )
        r = httpx.get(filing_url, headers=headers, timeout=30)
        r.raise_for_status()
        text = BeautifulSoup(r.text, "html.parser").get_text(separator="\n")
        # Collapse whitespace and cap for cost
        text = "\n".join(line.strip() for line in text.splitlines() if line.strip())
        return filing_url, text[:15000]

    raise RuntimeError("No 8-K found in recent filings")


def extract(text: str) -> dict:
    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=1500,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": text},
            {"role": "assistant", "content": "{"},
        ],
    )
    raw = "{" + response.content[0].text
    return json.loads(raw)


def main() -> None:
    print("Fetching Apple's most recent 8-K from EDGAR...")
    url, text = fetch_recent_8k()
    print(f"  Source: {url}")
    print(f"  Text:   {len(text)} chars")

    print("\nRunning Claude Haiku 4.5 extraction (with JSON prefill)...")
    result = extract(text)

    print("\n--- EXTRACTION RESULT ---")
    print(json.dumps(result, indent=2))
    print("\nSmoke test passed.")


if __name__ == "__main__":
    main()
