"""One-time copy of the local SQLite store into Supabase/Postgres.

Reads every table from the local `data/portfolio.db` and bulk-loads it into the
Postgres database pointed to by `DATABASE_URL` (or `supabase.url.txt`). Creates the
schema first and truncates, so it's safe to re-run. Surrogate `id` columns
(holdings, transactions) are skipped — Postgres assigns fresh identity values.

Usage:  python -m scripts.migrate_to_postgres
"""
from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.config import db_path, load_config  # noqa: E402
from src.model import db, schema  # noqa: E402

# Parents before children so FK constraints hold during load.
_ORDER = ["securities", "holdings", "transactions", "prices", "dividends",
          "benchmarks", "nav_history", "import_meta", "fundamentals"]
_SKIP_COLS = {"holdings": {"id"}, "transactions": {"id"}}


def main() -> int:
    cfg = load_config()
    url = db.database_url()
    if not url:
        print("No DATABASE_URL / supabase.url.txt set — nothing to migrate to.")
        return 1

    src = sqlite3.connect(str(db_path(cfg)))
    src.row_factory = sqlite3.Row
    pg = db.connect_pg(url)
    try:
        schema.create_schema(pg)
        schema.truncate_all(pg)
        cur = pg.cursor()
        total = 0
        for table in _ORDER:
            all_cols = [r[1] for r in src.execute(f"PRAGMA table_info({table})")]
            cols = [c for c in all_cols if c not in _SKIP_COLS.get(table, set())]
            rows = src.execute(f"SELECT {', '.join(cols)} FROM {table}").fetchall()
            if not rows:
                print(f"  {table}: 0 rows")
                continue
            marks = ", ".join(["%s"] * len(cols))
            cur.executemany(
                f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({marks})",
                [tuple(r) for r in rows],
            )
            total += len(rows)
            print(f"  {table}: {len(rows)} rows")
        cur.close()
        pg.commit()
        print(f"Done — copied {total} rows into Postgres.")
    finally:
        src.close()
        pg.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
