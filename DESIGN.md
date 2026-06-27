# UOIG Portfolio Manager — Design & Build Plan

A dashboard + analytics tool to track the **Tall Firs** and **Alumni Fund** portfolios,
pull live market data, and compute P&L, returns, risk, and attribution.

_Status: design / planning. Last updated by the design session._

---

## 1. Current state (what we're replacing)

The existing tracker is a **Google Sheet** exported to `.xlsx` (the `GOOGLEFINANCE()`
formulas are the giveaway). It is well-structured but manual and brittle.

**Funds (~$3.1M combined):**

| Fund | Active stocks | Index overlay | ~Total | Benchmark in sheet | Tilt |
|---|---|---|---|---|---|
| Tall Firs | ~$2.05M (33 names) | IWV ~$0.65M (Russell 3000) | **~$2.71M** | Russell 3000 (IWV) | Large/mid-cap |
| Alumni Fund | ~$0.16M (13 names) | IWM ~$0.28M (Russell 2000) | **~$0.44M** | Russell 2000 (IWM) | Small/mid-cap |

Each fund = **passive index core + active satellite tilts**, plus a money-market cash
sweep (BGNXX / BNGXX). Analysts are graded on **excess return vs. the benchmark ETF**.

**Sector taxonomy (analyst teams):** TMT, Consumer, Financial, IME (Industrials/Materials/Energy), Healthcare.
**Cap classes:** Large / Mid / Small Cap, plus Index ETF and Cash.

**Column meaning + formula logic (reverse-engineered, to be preserved):**

| Column | Meaning | Formula in sheet |
|---|---|---|
| Shares | Position size (split-adjusted, fractional) | manual |
| Price | Live price | `GOOGLEFINANCE(ticker,"price")` |
| Market Value | `Price × Shares` | `=F*E` |
| Last Update Price | Entry / buy-in reference price (split-adjusted) | manual |
| Last Update Date | Entry / buy-in date | manual |
| Passive Weight | Stock's weight in the benchmark index | manual (pasted) |
| Class Weight | `MV ÷ (Total − Cash − Index)` = weight within active sleeve | `=G/($G$37-$G$36-$G$35)` |
| Portfolio Weight | `MV ÷ (Total − Cash)` = weight of invested capital | `=G/($G$37-$G$35)` |
| Active Weight | `Portfolio Weight − Passive Weight` | `=L-J` |
| Last Update ETF Price | Benchmark ETF price on the entry date | manual |
| Market Return Since Update | Benchmark return since entry | `=liveETF/N-1` |
| Return Since Update | **Position price return since entry** | `=Price/LastUpdatePrice-1` |
| Excess Return Since Update | Position − benchmark | `=P-O` |
| Days Since Update | `TODAY() − entry date` | `=TODAY()-I` |

**Problems to solve:**
1. **Prices are stale & manual** — "Days Since Update" runs up to 1,611 days; GOOGLEFINANCE
   breaks (`#VALUE!` errors in the All Positions tab).
2. **No dividends** — "Return Since Update" is price-only, not total return.
3. **No transaction ledger** — share counts are hand-maintained (e.g. the IWV line is
   literally `=1167.0996+34+129+233`). No realized P&L, no audit trail.
4. **No real risk analytics** — no beta, volatility, tracking error, or attribution.
5. **Spreadsheet fragility** — logic lives in cell formulas that silently break.

---

## 2. Locked decisions

| Decision | Choice |
|---|---|
| Platform | **Python web dashboard (Streamlit)** — members open a URL; one maintainer runs it |
| Market data | **Free/low-cost API**, source-agnostic adapter (start with `yfinance`) |
| Cost basis | **Buy-in price + start date** from the sheet (today's "Last Update Price/Date") |
| Storage | **SQLite** single-file DB (`data/portfolio.db`) |
| Cadence | **EOD daily**, automated, + manual refresh button |
| Hosting | **GitHub** (org repo) + **Streamlit Community Cloud** + **GitHub Actions** cron |

---

## 3. Architecture (four layers)

```
┌─────────────────────────────────────────────────────────────┐
│  4. DASHBOARD (Streamlit + Plotly)                           │
│     Overview · Holdings · Performance · Risk · Attribution   │
│     · Analyst Scorecard · Admin/Refresh                      │
├─────────────────────────────────────────────────────────────┤
│  3. ANALYTICS ENGINE (pandas / numpy / statsmodels)          │
│     P&L · Returns (TWR/IRR) · Risk (beta, vol, TE, active    │
│     share) · Brinson attribution                             │
├─────────────────────────────────────────────────────────────┤
│  2. STORE (SQLite)                                           │
│     holdings · transactions · prices · dividends ·           │
│     benchmarks · nav_history · securities                    │
├─────────────────────────────────────────────────────────────┤
│  1. INGEST (provider adapter)                                │
│     yfinance → (swappable: Tiingo / FMP / Bloomberg)         │
└─────────────────────────────────────────────────────────────┘
```

### Layer 1 — Data ingestion

A provider-agnostic interface so we never get locked to one vendor:

```python
class MarketDataProvider(Protocol):
    def get_latest_prices(self, tickers: list[str]) -> dict[str, float]: ...
    def get_price_history(self, tickers, start, end) -> pd.DataFrame: ...   # adjusted close
    def get_dividends(self, tickers, start, end) -> pd.DataFrame: ...
    def get_fundamentals(self, tickers) -> pd.DataFrame: ...                # optional
```

- **Default impl: `yfinance`** — free, batch downloads, OHLCV + dividends + splits,
  `auto_adjust=True` for split/dividend-adjusted history. Mitigate flakiness with local
  caching + retry/backoff.
- **Swap-in impls:** Tiingo / FMP (cheap, API-key, more reliable) implement the same
  interface; selected via `config.yaml`.
- **`refresh()`** pulls latest prices + new dividends, appends to the DB, snapshots NAV.
- **Corporate actions** handled via adjusted closes so historical returns stay correct.

### Layer 2 — Data model (SQLite)

| Table | Purpose | Key fields |
|---|---|---|
| `securities` | Reference data | ticker, name, sector, cap_class, type (stock/etf/cash), benchmark |
| `holdings` | Current positions (source of truth until ledger is populated) | fund, ticker, shares, entry_price, entry_date, passive_weight |
| `transactions` | **NEW** trade ledger | date, fund, ticker, action (buy/sell/div/fee), shares, price, amount |
| `prices` | Daily price history (cached from API) | date, ticker, close, adj_close |
| `dividends` | Dividend history | ex_date, ticker, amount_per_share |
| `benchmarks` | Index levels | date, index (IWV/IWM/SPY), close |
| `nav_history` | Daily fund value + flows | date, fund, total_value, net_flow |

Holdings can eventually be **derived** from `transactions`; until full history exists,
`holdings` stays primary and the ledger captures trades **going forward**.

### Layer 3 — Analytics engine

**Position level**
- Market value = `shares × price`
- Unrealized P&L: `$ = shares × (price − entry_price)`; `% = price/entry − 1` (matches your "Return Since Update")
- **Total return incl. dividends** (upgrade): `(price + Σ div/share)/entry − 1`
- Realized P&L (from `transactions` once populated)
- Day change `$/%`, days held, annualized return
- Weights: class / portfolio / active (your exact definitions)

**Aggregations** — by sector, cap class, and fund: MV, weights, active weight, P&L,
and contribution to return = `Σ(weightᵢ × returnᵢ)`.

**Fund returns** _(from the current book — see deferred note)_
- **Holding-period return** per position, sector, and fund — price + dividends since
  entry date; computable from current holdings without any transaction history
- **Benchmark-relative** — holding-period excess return vs each fund's index (IWV/IWM)
- _Deferred:_ time-weighted return / since-inception NAV needs the Charles Schwab
  transaction history (not yet available). The `nav_history` schema is ready for when it is.

**Risk**
- **Beta** — **3-year daily**, each fund regressed on its OWN benchmark (Tall Firs vs
  IWV / Russell 3000, Alumni vs IWM / Russell 2000); per-name betas → portfolio beta =
  `Σ(weight × beta)` cross-check
- **Volatility** (annualized), **Sharpe** (rf from BIL/^IRX), **tracking error**,
  **max drawdown**, **R² / correlation**
- **Active share** = `½ Σ|portfolio_weightᵢ − benchmark_weightᵢ|`

**Attribution (showcase for a sector-team club)**
- **Brinson-Hood-Beebower** by sector: split excess return into **Allocation**
  (sector tilts) vs **Selection** (stock picking) vs Interaction — answers "did the
  TMT team add value via picks, and did the PM add value via sector bets?"
- Existing **excess-return-since-entry** retained as the analyst scorecard view

### Layer 4 — Dashboard (Streamlit pages)

1. **Overview** — combined AUM, per-fund value, day/MTD/YTD/since-inception vs benchmark, total P&L, beta, top movers; NAV chart
2. **Holdings** — live, sortable/filterable table per fund (replaces the sheet)
3. **Performance** — cumulative vs benchmark, TWR by period, rolling returns, drawdown
4. **Risk** — beta, vol, Sharpe, TE, active share, sector active-weight bars, per-name beta/contribution
5. **Attribution** — Brinson allocation vs selection; contribution waterfall
6. **Analyst Scorecard** — performance by sector team, excess-return leaderboard, stale-position flags
7. **Admin/Refresh** — pull prices, upload holdings, log a transaction, last-refresh + data-quality warnings

---

## 4. Tech stack & repo layout

**Stack:** Python 3.11+, `streamlit`, `pandas`, `numpy`, `yfinance` (+ optional `tiingo`),
`sqlite3`/`SQLModel`, `plotly`, `statsmodels`, `openpyxl`.

```
uoig-portfolio/
  data/portfolio.db            # SQLite source of truth
  src/
    ingest/providers.py        # adapter interface + yfinance/tiingo impls
    ingest/refresh.py          # daily price pull + NAV snapshot
    model/schema.py            # tables / ORM
    analytics/pnl.py
    analytics/returns.py       # TWR, IRR
    analytics/risk.py          # beta, vol, tracking error, active share
    analytics/attribution.py   # Brinson
    io/import_xlsx.py          # seed DB from the current sheet
  app/                         # streamlit pages
  tests/
  config.yaml                  # benchmark map, beta window, provider keys
  requirements.txt
  README.md                    # runbook for next year's PM
```

**Continuity (rotating membership):** org-owned GitHub repo; Streamlit Community Cloud
(free) hosts the app; GitHub Actions cron runs the nightly refresh and commits the
updated DB/NAV snapshot — fully automated; README runbook for handoff.

---

## 5. Phased build plan

| Phase | Deliverable | Outcome |
|---|---|---|
| **0. Foundation** ✅ | Schema + `import_xlsx` seeds holdings (clean cash/index/total, normalize sectors, capture entry price+date), SQLite stood up; reconciles to the cent | **Done** — clean data model |
| **1. Live prices & P&L** ✅ | yfinance adapter, daily price pull, MV + unrealized P&L + weights, Holdings page | **Done** — replaces the Google Sheet |
| **2. Returns** | Holding-period return (incl. divs) per position/sector/fund, benchmark-relative, Performance page | Performance from current book |
| **3. Risk** | Beta (SPY + IWV/IWM), vol, Sharpe, tracking error, active share, Risk page | Institutional risk view |
| **4. Attribution & scorecard** | Brinson sector attribution, analyst scorecard, contribution analysis | IC-meeting-ready |
| **5. Automation & handoff** | GitHub Actions nightly refresh, deploy to Streamlit Cloud, transaction-logging UI, README/runbook | Set-and-forget + survives graduations |

---

## 6. Defaults (change any)

- Provider **yfinance** to start; interface allows Tiingo/FMP later
- Cadence **EOD daily** (GitHub Action) + manual refresh
- Beta **3-yr daily**, each fund vs its own index (Tall Firs→IWV, Alumni→IWM); rf from BIL
- Storage **SQLite**
- Returns **include dividends** (total return)

---

## 7. Open items to confirm

1. **Cost basis precision** — "Last Update Price/Date" = true buy-in? Values are
   split-adjusted (fine for % return; for exact $ cost we'd use actual cash paid).
2. **Trade logging going forward** — adopt the `transactions` ledger so realized P&L
   and cost basis stay clean as positions change.
3. **Style benchmarks** — sheet uses IWV (Russell 3000) and IWM (Russell 2000).
   You described the funds as "value" and "growth" — do you want style benchmarks
   (e.g. IWD/IWF or IVE/IVW) instead of/alongside these? Which fund is which style?
4. **Transaction history (Charles Schwab)** — once accessible, unlocks true TWR /
   since-inception NAV. Until then, returns are holding-period from current positions
   (each name's entry date → today).
