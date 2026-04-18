"""
One-off helper: fill CIKs on EU tickers that cross-list in the US
via ADRs, using SEC's ticker→CIK mapping.

Run once:
    python resolve_ciks.py

Mapping: our EU ticker (Euronext symbol we track) → US ADR ticker
(what SEC knows). SEC's public company_tickers.json is the source
of truth for CIKs.
"""
import os
from pathlib import Path

import httpx
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent / ".env")

SEC_USER_AGENT = os.environ["SEC_USER_AGENT"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# Our companies table ticker → US ADR ticker (what SEC knows)
EU_TO_US_ADR = {
    "ASML.AS": "ASML",   # ASML Holding NV — NASDAQ
    "SAN.PA":  "SNY",    # Sanofi — NYSE
    "TTE.PA":  "TTE",    # TotalEnergies — NYSE
    # LVMH, Hermès, Airbus have no US listings — not on SEC
}


def main() -> None:
    print("Fetching SEC ticker→CIK map…")
    r = httpx.get(
        "https://www.sec.gov/files/company_tickers.json",
        headers={"User-Agent": SEC_USER_AGENT},
        timeout=30,
    )
    r.raise_for_status()
    by_ticker = {
        row["ticker"].upper(): str(row["cik_str"]).zfill(10)
        for row in r.json().values()
    }
    print(f"  Loaded {len(by_ticker)} tickers from SEC.")

    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    for eu_ticker, us_ticker in EU_TO_US_ADR.items():
        cik = by_ticker.get(us_ticker.upper())
        if not cik:
            print(f"[{eu_ticker}] no CIK for US ADR {us_ticker} — skip")
            continue
        sb.table("companies").update({"cik": cik}).eq("ticker", eu_ticker).execute()
        print(f"[{eu_ticker}] ✓ CIK={cik} (via {us_ticker})")


if __name__ == "__main__":
    main()
