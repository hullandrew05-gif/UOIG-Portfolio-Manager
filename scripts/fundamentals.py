"""Pull company fundamentals from yfinance into the store.

Usage:  python -m scripts.fundamentals
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.config import load_config  # noqa: E402
from src.ingest.fundamentals import pull_fundamentals  # noqa: E402


def main() -> None:
    s = pull_fundamentals(load_config())
    print(f"Fundamentals updated for {s['updated']} tickers")
    if s["failed"]:
        print(f"  no data ({len(s['failed'])}): {', '.join(s['failed'])}")


if __name__ == "__main__":
    main()
