# UOIG Portfolio Manager

Dashboard + analytics for the **Tall Firs** and **Alumni Fund** portfolios: live
market data, P&L, returns, risk, and attribution. Replaces the manual
`Portfolio Holdings.xlsx` Google Sheet.

See [`DESIGN.md`](DESIGN.md) for the full architecture and build plan.

> **Status: Phase 2 complete** — live prices, P&L, holding-period returns, and
> 3-year daily beta. The DB reconciles to the source sheet to the cent; the
> dashboard serves Holdings / Performance / Risk tabs in a dark UOIG-branded UI.

## Quickstart

```bash
python -m pip install -r requirements.txt

python -m scripts.seed_db        # build data/portfolio.db from the workbook
python -m scripts.reconcile      # verify the DB matches the sheet (exit 0 = PASS)
python -m scripts.refresh --full # backfill prices + dividends from yfinance
python -m streamlit run app/streamlit_app.py   # launch the dashboard
```

Then open http://localhost:8501. After the first `--full` backfill, a plain
`python -m scripts.refresh` does a fast incremental update (and the dashboard's
**↻ Refresh prices** button does the same).

> On Windows the `streamlit` command may not be on PATH — always launch with
> `python -m streamlit run …`.

Run the tests with `python tests/test_reconcile.py && python tests/test_pnl.py`.

## How it works

`Portfolio Holdings.xlsx`  →  **importer** (`src/io/import_xlsx.py`)  →  **SQLite**
(`data/portfolio.db`)  →  analytics + dashboard (later phases).

The DB is reproducible: it's rebuilt from the workbook by `seed_db`, so it is
git-ignored. Each fund's positions are identified by having both a Name and a
Ticker, which excludes totals, sector summaries, and blank rows.

## Layout

```
config.yaml              funds, benchmarks, analytics params (single source of truth)
data/portfolio.db        SQLite store (generated)
src/
  config.py              config loading + path resolution
  model/schema.py        SQLite tables + connection helpers
  io/import_xlsx.py      workbook -> DB importer
  ingest/providers.py    market-data adapter (yfinance; swappable)
  ingest/refresh.py      pull prices + dividends into the store
  analytics/pnl.py       market value, P&L, total return, weights
app/streamlit_app.py     the dashboard
scripts/
  seed_db.py             rebuild the DB
  reconcile.py           verify DB == workbook
  refresh.py             pull latest market data
tests/                   reconcile + P&L guarantees
```

## Roadmap

| Phase | Status | What |
|---|---|---|
| 0 Foundation | done | Schema, importer, reconciliation |
| 1 Live prices & P&L | done | yfinance feed, market value, unrealized P&L, Holdings dashboard |
| 2 Returns | done | Holding-period returns (incl. divs), benchmark-relative, Performance tab |
| 3 Risk | done | 3-yr daily beta vs Russell, vol, R², Risk tab |
| 4 Attribution | | Brinson allocation vs selection; analyst scorecard |
| 5 Automation & handoff | | GitHub Actions refresh, Streamlit Cloud deploy, runbook |

## Handoff notes (for the next PM)

- All config lives in `config.yaml`. Adding/removing a fund or changing a
  benchmark is a config edit, not a code change.
- To refresh from a new workbook export, drop it in as `Portfolio Holdings.xlsx`
  and re-run `seed_db`. Always run `reconcile` after.
