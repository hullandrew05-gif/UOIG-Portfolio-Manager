"""Per-fund portfolio diagnostics for the optimization page.

Everything here is framed as ACTIVE risk versus the fund's benchmark (Tall Firs
-> IWV, Alumni -> IWM), which is how the club actually manages the books:

  tracking error    realized std of (fund - benchmark) daily returns, annualized
  beta / vol        fund beta vs its benchmark; total annualized vol
  active share      0.5 * sum |w_port - w_bench| over the union of names
  risk contribution each holding's share of active risk, from a' Σ a on the
                    active weights (an ex-ante decomposition over held names)
  sector tilts      portfolio minus benchmark weight per UOIG sector group
  concentration     HHI, effective number of names, top-5 weight

Benchmark constituent + sector weights come from the ``benchmark_holdings`` /
``benchmark_sectors`` tables (Alpha Vantage ETF_PROFILE, see
``src.ingest.benchmark_holdings``). Return-series inputs reuse the existing
analytics layer (``daily_returns_matrix``). Nothing here mutates state.
"""
from __future__ import annotations

import sqlite3

import numpy as np
import pandas as pd

from src.analytics.pnl import load_positions
from src.analytics.risk import _beta, daily_returns_matrix
from src.model import db as _db

TRADING_DAYS = 252


UOIG_GROUPS = ["TMT", "IME", "Healthcare", "Financial", "Consumer"]
# Our securities table already tags each stock with its UOIG group name; the
# Alpha Vantage benchmark feed uses standard GICS sector names. Map both.
_EXACT = {g.lower(): g for g in UOIG_GROUPS}


def _uoig_group(sector: str | None) -> str | None:
    """Map a sector label — our own UOIG group name OR a GICS sector (yfinance or
    standard-GICS spelling, any case) — to one of the five UOIG groups. Returns
    None for cash / index overlay / unmapped."""
    if not sector:
        return None
    s = sector.strip().lower()
    if s in _EXACT:
        return _EXACT[s]
    if "technolog" in s or "communication" in s:
        return "TMT"
    if "industrial" in s or "utilit" in s or "material" in s or "energy" in s:
        return "IME"
    if "health" in s:
        return "Healthcare"
    if "financ" in s or "real estate" in s:
        return "Financial"
    if "consumer" in s:
        return "Consumer"
    return None


def _bench_weights(conn, index_ticker: str) -> dict[str, float]:
    """{ticker: weight} for a benchmark's constituents (weight as a fraction)."""
    rows = conn.execute(
        _db.q(conn, "SELECT ticker, weight FROM benchmark_holdings WHERE index_ticker = ?"),
        (index_ticker,)).fetchall()
    return {r[0]: float(r[1]) for r in rows if r[1] is not None}


def _bench_sector_groups(conn, index_ticker: str) -> dict[str, float]:
    """Benchmark weight per UOIG group, from the provider's sector allocation."""
    rows = conn.execute(
        _db.q(conn, "SELECT sector, weight FROM benchmark_sectors WHERE index_ticker = ?"),
        (index_ticker,)).fetchall()
    out: dict[str, float] = {g: 0.0 for g in UOIG_GROUPS}
    for sector, w in rows:
        g = _uoig_group(sector)
        if g and w is not None:
            out[g] += float(w)
    return out


def _fund_daily(rets: pd.DataFrame, weights: dict[str, float]) -> pd.Series:
    """Current-weights daily return series over names we have returns for."""
    cols = [t for t in weights if t in rets.columns]
    if not cols:
        return pd.Series(dtype=float)
    w = pd.Series({t: weights[t] for t in cols})
    w = w / w.sum()
    return rets[cols].mul(w, axis=1).sum(axis=1, min_count=1)


def fund_diagnostics(cfg: dict, conn: sqlite3.Connection, fund_name: str) -> dict:
    """The full diagnostics payload for one fund, framed vs its benchmark."""
    bench = next((f["benchmark"] for f in cfg["funds"] if f["name"] == fund_name), None)
    if bench is None:
        raise ValueError(f"unknown fund {fund_name!r}")

    years = (cfg.get("risk") or {}).get("beta_window_years", 3)
    rets = daily_returns_matrix(conn, years)

    pos = load_positions(cfg, conn)
    g = pos[(pos.fund == fund_name) & (pos.sec_type != "cash")].copy()
    names = {r.ticker: r.name for r in g.itertuples()}

    # Split the sleeve: individual stocks are the active bets; any index ETF is a
    # PASSIVE OVERLAY that tracks the benchmark. All weights are fractions of the
    # invested (ex-cash) book, so stock weights + overlay weight `o` sum to ~1.
    all_w = {r.ticker: float(r.port_w) for r in g.itertuples() if r.port_w == r.port_w}
    tot = sum(all_w.values()) or 1.0
    all_w = {t: w / tot for t, w in all_w.items()}
    stock_w = {r.ticker: all_w[r.ticker] for r in g.itertuples()
               if r.sec_type == "stock" and r.ticker in all_w}
    overlay = 1.0 - sum(stock_w.values())  # benchmark-tracking fraction
    sectors = {r.ticker: r.sector for r in g.itertuples()}

    bench_w = _bench_weights(conn, bench)
    # Look-through active weight of a held stock: its direct weight minus the
    # benchmark exposure the non-overlay part of the book "should" carry. A pure
    # overlay (overlay=1) yields zero active weight everywhere, as it must.
    def active_w(t: str) -> float:
        return stock_w.get(t, 0.0) - (1.0 - overlay) * bench_w.get(t, 0.0)

    # ---- return-series metrics (realized, uses the whole book incl. overlay) ----
    fund_ret = _fund_daily(rets, all_w)
    te = beta = vol = None
    if not fund_ret.empty and bench in rets.columns:
        pair = pd.concat([fund_ret, rets[bench]], axis=1, keys=["f", "b"]).dropna()
        if len(pair) >= 2:
            active = pair["f"] - pair["b"]
            te = float(active.std(ddof=1) * np.sqrt(TRADING_DAYS) * 100)
            vol = float(pair["f"].std(ddof=1) * np.sqrt(TRADING_DAYS) * 100)
            beta = _beta(pair["f"], pair["b"])[0]

    # ---- active share (look-through, over the union of stock + benchmark names) ----
    union = set(stock_w) | set(bench_w)
    active_share = 0.5 * sum(abs(active_w(t)) for t in union) * 100

    # ---- concentration of the STOCK sleeve (renormalized; the overlay is a
    # diversified index, so including it would overstate concentration) ----
    sv = np.array(list(stock_w.values()))
    ssum = sv.sum()
    svn = sv / ssum if ssum else sv
    hhi = float((svn ** 2).sum() * 10000) if svn.size else 0.0
    eff_n = float(1.0 / (svn ** 2).sum()) if svn.size else 0.0
    top5 = float(np.sort(sv)[::-1][:5].sum() * 100)  # actual % of fund in top-5 stocks

    # ---- active risk contribution (ex-ante a' Σ a over held stocks) ----
    cols = [t for t in stock_w if t in rets.columns]
    contrib: dict[str, float] = {}
    if cols:
        sig = (rets[cols].cov() * TRADING_DAYS).to_numpy()
        a = np.array([active_w(t) for t in cols])
        var = float(a @ sig @ a)
        if var > 0:
            mctr = (sig @ a) * a  # component contributions to a'Σa
            for t, c in zip(cols, mctr):
                contrib[t] = float(c / var)  # fraction of active variance

    rows = []
    for t in stock_w:
        rows.append({
            "t": t,
            "name": names.get(t, t),
            "port_w": round(stock_w[t] * 100, 2),
            "bench_w": round(bench_w.get(t, 0.0) * 100, 3),
            "active_w": round(active_w(t) * 100, 2),
            "risk_contrib": round(contrib.get(t, 0.0) * 100, 1),
        })
    rows.sort(key=lambda r: r["risk_contrib"], reverse=True)

    # ---- active sector tilts (look-through: stock tilts + overlay = benchmark) ----
    bench_grp = _bench_sector_groups(conn, bench)
    port_grp = {gname: overlay * bench_grp.get(gname, 0.0) for gname in UOIG_GROUPS}
    for t, w in stock_w.items():
        grp = _uoig_group(sectors.get(t))
        if grp:
            port_grp[grp] += w
    tilts = [{
        "group": gname,
        "port_w": round(port_grp[gname] * 100, 1),
        "bench_w": round(bench_grp.get(gname, 0.0) * 100, 1),
        "active": round((port_grp[gname] - bench_grp.get(gname, 0.0)) * 100, 1),
    } for gname in UOIG_GROUPS]

    return {
        "fund": fund_name,
        "benchmark": bench,
        "overlay": round(overlay * 100, 1),  # % of book in the benchmark ETF
        "kpis": {
            "tracking_error": round(te, 2) if te is not None else None,
            "active_share": round(active_share, 1),
            "beta": round(beta, 2) if beta is not None else None,
            "vol": round(vol, 1) if vol is not None else None,
        },
        "concentration": {
            "holdings": len(stock_w),  # number of individual stock picks
            "effective_n": round(eff_n, 1),
            "top5": round(top5, 1),
            "hhi": round(hhi),
        },
        "risk_contribution": rows,
        "sector_tilts": tilts,
    }
