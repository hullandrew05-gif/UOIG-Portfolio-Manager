"""Pull benchmark ETF constituents + sector weights from Alpha Vantage.

The optimization page's active-risk framing (active weight, active share, active
risk contribution, active sector tilts) needs each fund benchmark's holdings and
their weights — which yfinance can't give (it caps ETF holdings at the top ~10).
Alpha Vantage's ``ETF_PROFILE`` returns the full constituent list with weights
plus a sector allocation, which we mirror into ``benchmark_holdings`` /
``benchmark_sectors`` for the analytics layer to read offline.

API key: read from the ALPHAVANTAGE_API_KEY env var, falling back to a
git-ignored ``alphavantage.key.txt`` at the repo root (same pattern as the
Anthropic / WorkOS keys). Free tier is 25 req/day, 5/min — we only pull the two
fund benchmarks per refresh, so we stay well inside the limits.
"""
from __future__ import annotations

import datetime as dt
import os
import sqlite3
from pathlib import Path

import requests

from src.config import db_path
from src.model import db, schema

_KEY_FILE = Path(__file__).resolve().parents[2] / "alphavantage.key.txt"
_ENDPOINT = "https://www.alphavantage.co/query"
# Alpha Vantage marks quota/error conditions with these top-level keys.
_MSG_KEYS = ("Information", "Note", "Error Message")


def _parse_key(text: str) -> str | None:
    """Accept a bare key, an ``ALPHAVANTAGE_API_KEY=...`` line, or a quoted value."""
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            line = line.split("=", 1)[1]
        return line.strip().strip('"').strip("'").strip()
    return None


def api_key() -> str | None:
    """ALPHAVANTAGE_API_KEY env var, else alphavantage.key.txt, else None."""
    env = os.environ.get("ALPHAVANTAGE_API_KEY")
    if env and env.strip():
        return _parse_key(env)
    try:
        return _parse_key(_KEY_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return None


def _num(v) -> float | None:
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def fetch_etf_profile(symbol: str, key: str | None = None, timeout: int = 40) -> dict:
    """Raw ETF_PROFILE payload for one symbol. Raises on a quota/error response."""
    key = key or api_key()
    if not key:
        raise RuntimeError("no Alpha Vantage API key (set ALPHAVANTAGE_API_KEY "
                           "or create alphavantage.key.txt)")
    r = requests.get(_ENDPOINT, params={"function": "ETF_PROFILE",
                                        "symbol": symbol, "apikey": key}, timeout=timeout)
    r.raise_for_status()
    data = r.json()
    for k in _MSG_KEYS:
        if k in data:
            raise RuntimeError(f"Alpha Vantage {k} for {symbol}: {data[k]}")
    return data


def _clean_holdings(payload: dict) -> list[tuple[str, float, str]]:
    """(ticker, weight, sector) rows, dropping the provider's non-equity lines
    (index futures, cash sweeps) which come through with symbol 'n/a'."""
    out = []
    for h in payload.get("holdings", []):
        sym = (h.get("symbol") or "").strip().upper()
        if not sym or sym == "N/A":
            continue
        w = _num(h.get("weight"))
        if w is None:
            continue
        out.append((sym, w, (h.get("sector") or "").strip().upper()))
    return out


def _clean_sectors(payload: dict) -> list[tuple[str, float]]:
    out = []
    for s in payload.get("sectors", []):
        name = (s.get("sector") or "").strip().upper()
        w = _num(s.get("weight"))
        if name and w is not None:
            out.append((name, w))
    return out


def pull_benchmark_holdings(cfg: dict, conn: sqlite3.Connection | None = None,
                            symbols: list[str] | None = None) -> dict:
    """Fetch each fund benchmark's constituents + sector weights into the store.
    Replaces prior rows for each index so weights never go stale."""
    own = conn is None
    if own:
        conn = schema.get_connection(db_path(cfg))
    schema.create_schema(conn)

    if symbols is None:
        symbols = sorted({f["benchmark"] for f in cfg["funds"]})
    key = api_key()
    today = dt.date.today().isoformat()
    summary = {"indexes": 0, "holdings": 0, "sectors": 0, "failed": []}

    for sym in symbols:
        try:
            payload = fetch_etf_profile(sym, key)
        except Exception as exc:  # noqa: BLE001 — record and continue
            summary["failed"].append(f"{sym}: {exc}")
            continue

        holds = _clean_holdings(payload)
        sects = _clean_sectors(payload)

        conn.execute(db.q(conn, "DELETE FROM benchmark_holdings WHERE index_ticker = ?"), (sym,))
        conn.execute(db.q(conn, "DELETE FROM benchmark_sectors WHERE index_ticker = ?"), (sym,))
        db.executemany(
            conn,
            db.upsert_sql(conn, "benchmark_holdings",
                          ["index_ticker", "ticker", "weight", "sector", "updated"],
                          ["index_ticker", "ticker"]),
            [(sym, t, w, sec, today) for (t, w, sec) in holds],
        )
        db.executemany(
            conn,
            db.upsert_sql(conn, "benchmark_sectors",
                          ["index_ticker", "sector", "weight", "updated"],
                          ["index_ticker", "sector"]),
            [(sym, name, w, today) for (name, w) in sects],
        )
        summary["indexes"] += 1
        summary["holdings"] += len(holds)
        summary["sectors"] += len(sects)

    conn.execute(
        db.upsert_sql(conn, "import_meta", ["key", "value"], ["key"]),
        ("last_benchmark_holdings", dt.datetime.now().isoformat(timespec="seconds")),
    )
    conn.commit()
    if own:
        conn.close()
    return summary
