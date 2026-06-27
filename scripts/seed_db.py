"""Build (or rebuild) the SQLite store from the source workbook.

Usage:  python -m scripts.seed_db
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.config import db_path, load_config  # noqa: E402
from src.io.import_xlsx import import_workbook  # noqa: E402


def main() -> None:
    cfg = load_config()
    summary = import_workbook(cfg)

    print(f"Seeded {db_path(cfg)}")
    total = 0
    for fund, n in summary["funds"].items():
        print(f"  {fund:<14} {n:>3} positions")
        total += n
    print(f"  {'TOTAL':<14} {total:>3} positions across "
          f"{summary.get('n_securities', '?')} unique securities")
    for w in summary["warnings"]:
        print(f"  ! {w}")


if __name__ == "__main__":
    main()
