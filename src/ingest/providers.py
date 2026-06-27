"""Market-data provider adapter.

A thin, swappable interface so the rest of the system never depends on a
specific vendor. Phase 1 ships the yfinance implementation; Tiingo/FMP/Bloomberg
can be added later by implementing the same three methods.
"""
from __future__ import annotations

import datetime as dt
import time
from typing import Protocol

import pandas as pd
import yfinance as yf

PRICE_COLS = ["ticker", "date", "close", "adj_close"]
DIV_COLS = ["ticker", "ex_date", "amount"]


def to_yf(ticker: str) -> str:
    """Map our ticker convention to Yahoo's (e.g. BRK.B -> BRK-B)."""
    return ticker.replace(".", "-")


def _days_ago(n: int) -> str:
    return (dt.date.today() - dt.timedelta(days=n)).isoformat()


class MarketDataProvider(Protocol):
    def get_price_history(self, tickers, start, end=None) -> pd.DataFrame: ...
    def get_dividends(self, tickers, start, end=None) -> pd.DataFrame: ...
    def get_latest_prices(self, tickers) -> dict[str, float]: ...


class YFinanceProvider:
    """Yahoo Finance via yfinance. Per-ticker fetch (robust parsing), with a
    small in-instance cache so price + dividend pulls share one download."""

    def __init__(self, retries: int = 2, pause: float = 0.6):
        self.retries = retries
        self.pause = pause
        self._cache: dict[tuple, pd.DataFrame] = {}

    def _history(self, ticker, start, end) -> pd.DataFrame:
        key = (ticker, str(start), str(end))
        if key in self._cache:
            return self._cache[key]
        for attempt in range(self.retries + 1):
            try:
                h = yf.Ticker(to_yf(ticker)).history(
                    start=start, end=end, auto_adjust=False, actions=True
                )
                self._cache[key] = h
                return h
            except Exception:
                time.sleep(self.pause * (attempt + 1))
        self._cache[key] = pd.DataFrame()
        return self._cache[key]

    def get_price_history(self, tickers, start, end=None) -> pd.DataFrame:
        frames = []
        for t in tickers:
            h = self._history(t, start, end)
            if h.empty or "Close" not in h:
                continue
            sub = h.dropna(subset=["Close"])  # drop the unfinalized current-day bar
            if sub.empty:
                continue
            adj = sub["Adj Close"] if "Adj Close" in sub else sub["Close"]
            frames.append(pd.DataFrame({
                "ticker": t,
                "date": [d.date().isoformat() for d in sub.index],
                "close": sub["Close"].to_numpy(),
                "adj_close": adj.to_numpy(),
            }))
        return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame(columns=PRICE_COLS)

    def get_dividends(self, tickers, start, end=None) -> pd.DataFrame:
        frames = []
        for t in tickers:
            h = self._history(t, start, end)
            if h.empty or "Dividends" not in h:
                continue
            d = h[h["Dividends"] > 0]
            if d.empty:
                continue
            frames.append(pd.DataFrame({
                "ticker": t,
                "ex_date": [x.date().isoformat() for x in d.index],
                "amount": d["Dividends"].to_numpy(),
            }))
        return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame(columns=DIV_COLS)

    def get_latest_prices(self, tickers) -> dict[str, float]:
        ph = self.get_price_history(tickers, start=_days_ago(7))
        if ph.empty:
            return {}
        ph = ph.sort_values("date")
        return ph.groupby("ticker")["close"].last().to_dict()


def get_provider(cfg: dict) -> MarketDataProvider:
    name = (cfg.get("market_data") or {}).get("provider", "yfinance")
    if name == "yfinance":
        return YFinanceProvider()
    raise ValueError(f"Unknown market-data provider: {name!r}")
