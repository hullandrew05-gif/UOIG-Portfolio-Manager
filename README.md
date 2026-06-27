# UOIG Endowment Terminal

A Bloomberg-style portfolio terminal for the **Tall Firs** and **Alumni Fund**
portfolios: live market data, P&L, holding-period returns, 3-year daily beta,
and per-stock / per-sector research views. React frontend + FastAPI backend over
the existing Python analytics.

See [`DESIGN.md`](DESIGN.md) for the original architecture and build plan.

> **Status: terminal complete.** Real data end-to-end; the legacy Streamlit
> dashboard has been retired. "Ask Claude" is built but stubbed (flip to the live
> Anthropic API when ready).

## Architecture
```
web/        React + Vite frontend (the terminal UI)
api/        FastAPI backend (serves data + the built frontend)
src/        analytics: pnl, returns, risk, series + ingest/model
data/       SQLite store (generated; git-ignored)
scripts/    seed / reconcile / refresh / fundamentals
```

## Run it (development — hot reload)
Two processes; the Vite dev server proxies `/api` to the backend.
```bash
python -m pip install -r requirements.txt
python -m uvicorn api.main:app --port 8000        # backend  -> :8000
npm --prefix web install
npm --prefix web run dev                          # frontend -> :5173
```
Open http://localhost:5173.

## Run it (single server — production style)
Build the frontend once; FastAPI then serves the API **and** the built app on one port.
```bash
npm --prefix web run build
python -m uvicorn api.main:app --port 8000
```
Open http://localhost:8000.

## Run it (Docker — one command, reproducible)
Requires Docker Desktop. Builds the frontend and backend into one image.
```bash
docker build -t uoig-terminal .
docker run -p 8000:8000 uoig-terminal
```
Open http://localhost:8000.

## Data
```bash
python -m scripts.seed_db        # build data/portfolio.db from the workbook
python -m scripts.refresh        # pull latest prices + dividends (yfinance)
python -m scripts.fundamentals   # pull P/E, P/B, sector, 52-wk, descriptions
python -m scripts.reconcile      # verify DB == source workbook
```
Tests: `python tests/test_reconcile.py && python tests/test_pnl.py && python tests/test_returns.py && python tests/test_risk.py`

## Roadmap
| Phase | Status | What |
|---|---|---|
| 0 Foundation | done | Schema, importer, reconciliation |
| 1 Live prices & P&L | done | yfinance feed, market value, unrealized P&L |
| 2 Returns | done | Holding-period returns, benchmark-relative |
| 3 Risk | done | 3-yr daily beta vs Russell, vol, R² |
| A Backend API | done | FastAPI + fundamentals enrichment |
| B–D Terminal UI | done | Pixel-faithful React terminal; Ask-Claude stubbed |
| E Packaging | done | Single-container Docker, this runbook, Streamlit retired |
| Later | | Live Ask-Claude (Anthropic API); migrate to Vercel + Supabase (Postgres) |

## Handoff notes (for the next PM)
- Config lives in `config.yaml` (funds, benchmarks, beta window).
- The DB is reproducible: `seed_db` → `refresh` → `fundamentals`.
- Frontend API base is configurable via `VITE_API_BASE` (empty = same origin).
  When the frontend later moves to Vercel, point it at the hosted backend.
- Secrets (e.g. Kalshi keys) are git-ignored; keep them out of the repo.
