"""Pull the latest market data into the store.

Usage:
    python -m scripts.refresh            # incremental (nightly)
    python -m scripts.refresh --full     # re-backfill full history
    python -m scripts.refresh --years 3  # custom backfill window
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.config import load_config  # noqa: E402
from src.ingest.refresh import refresh  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--full", action="store_true", help="re-backfill full history")
    ap.add_argument("--years", type=float, help="backfill window in years")
    args = ap.parse_args()

    s = refresh(load_config(), history_years=args.years, full=args.full)
    print(f"Refreshed {s['tickers']} tickers: "
          f"{s['prices']} price rows, {s['dividends']} dividends")
    if s["failed"]:
        print(f"  failed ({len(s['failed'])}): {', '.join(s['failed'])}")


if __name__ == "__main__":
    main()
