"""SQLite schema and connection helpers for the UOIG portfolio store.

Tables
------
securities    Intrinsic, ticker-keyed reference data (name, sector, cap, type).
holdings      Current positions per fund (shares, cost basis, benchmark weight).
transactions  Trade ledger (buys/sells/dividends/fees) — populated going forward.
prices        Daily price history per ticker (cached from the data provider).
dividends     Dividend history per ticker.
benchmarks    Index level history (IWV, IWM, SPY, ...).
nav_history   Daily fund value and net external cash flow (for TWR).
import_meta   Key/value provenance for the last seed/import.
"""
from __future__ import annotations

import sqlite3
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS securities (
    ticker      TEXT PRIMARY KEY,
    name        TEXT,
    sector      TEXT,
    cap_class   TEXT,
    sec_type    TEXT CHECK (sec_type IN ('stock', 'etf', 'cash'))
);

CREATE TABLE IF NOT EXISTS holdings (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    fund              TEXT NOT NULL,
    ticker            TEXT NOT NULL,
    shares            REAL,
    entry_price       REAL,   -- split-adjusted buy-in (cost basis); cash = 1.0
    entry_date        TEXT,   -- ISO date
    passive_weight    REAL,   -- weight in the fund's benchmark at entry
    bench_ticker      TEXT,   -- benchmark used for active weight / excess return
    bench_entry_price REAL,   -- benchmark ETF price on the entry date
    UNIQUE (fund, ticker),
    FOREIGN KEY (ticker) REFERENCES securities (ticker)
);

CREATE TABLE IF NOT EXISTS transactions (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    date    TEXT NOT NULL,
    fund    TEXT NOT NULL,
    ticker  TEXT NOT NULL,
    action  TEXT CHECK (action IN ('buy', 'sell', 'div', 'fee')),
    shares  REAL,
    price   REAL,
    amount  REAL,
    note    TEXT
);

CREATE TABLE IF NOT EXISTS prices (
    ticker     TEXT NOT NULL,
    date       TEXT NOT NULL,
    close      REAL,
    adj_close  REAL,
    source     TEXT,
    PRIMARY KEY (ticker, date)
);

CREATE TABLE IF NOT EXISTS dividends (
    ticker  TEXT NOT NULL,
    ex_date TEXT NOT NULL,
    amount  REAL,
    PRIMARY KEY (ticker, ex_date)
);

CREATE TABLE IF NOT EXISTS benchmarks (
    index_ticker TEXT NOT NULL,
    date         TEXT NOT NULL,
    close        REAL,
    PRIMARY KEY (index_ticker, date)
);

CREATE TABLE IF NOT EXISTS nav_history (
    fund        TEXT NOT NULL,
    date        TEXT NOT NULL,
    total_value REAL,
    net_flow    REAL,
    PRIMARY KEY (fund, date)
);

CREATE TABLE IF NOT EXISTS import_meta (
    key   TEXT PRIMARY KEY,
    value TEXT
);
"""

_TABLES = [
    "import_meta", "nav_history", "benchmarks", "dividends",
    "prices", "transactions", "holdings", "securities",
]


def get_connection(db: str | Path) -> sqlite3.Connection:
    Path(db).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def create_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA)
    conn.commit()


def truncate_all(conn: sqlite3.Connection) -> None:
    """Clear all rows for an idempotent reseed (schema preserved)."""
    for table in _TABLES:
        conn.execute(f"DELETE FROM {table}")
    conn.commit()
