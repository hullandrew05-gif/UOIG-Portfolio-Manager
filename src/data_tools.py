"""Per-stock data tools for the Ask-Claude co-pilot.

Exposes the same enriched data the terminal's stock-detail tabs use — live
yfinance fundamentals/earnings/news/analyst research, Kalshi prediction markets,
and the team's written thesis — as read-only tools the model can pull on demand.
Payloads are JSON, trimmed to bound token cost.
"""
from __future__ import annotations

import json

from src.ingest.predictions import stock_predictions
from src.ingest.research import stock_research
from src.ingest.thesis import stock_thesis

_LIMIT = 9000


def _json(obj) -> str:
    s = json.dumps(obj, default=str, separators=(",", ":"))
    return s if len(s) <= _LIMIT else s[:_LIMIT] + "…[truncated]"


TOOLS = [
    {"name": "get_stock_fundamentals",
     "description": "Live yfinance data for a holding: quarterly financials (revenue, "
                    "margins, net income, FCF, EPS), the most recent earnings report "
                    "(actual vs estimate, surprise, next date), recent news headlines, and "
                    "analyst research (consensus rating, price-target low/mean/high, forward "
                    "estimates, recent upgrades/downgrades). Use for any question about a "
                    "holding's financials, earnings, news, or the Street's view.",
     "input_schema": {"type": "object", "properties": {
         "ticker": {"type": "string", "description": "Ticker, e.g. NVDA."}}, "required": ["ticker"]}},
    {"name": "get_predictions",
     "description": "Kalshi prediction-market cards mapped to a holding (curated). Each card "
                    "has the market question, top outcomes with implied probability, and "
                    "volume. Use for forward-looking, market-implied odds on a name.",
     "input_schema": {"type": "object", "properties": {
         "ticker": {"type": "string"}}, "required": ["ticker"]}},
    {"name": "get_thesis",
     "description": "The team's most recent investment thesis (three points, with date and "
                    "analyst) for a holding, from THESIS.md. Use when asked why we own a name "
                    "or what the pitch is.",
     "input_schema": {"type": "object", "properties": {
         "ticker": {"type": "string"}}, "required": ["ticker"]}},
]


def run_tool(name: str, inp: dict):
    """Execute a data tool. Returns (content, is_error), or None if not handled here."""
    ticker = str((inp or {}).get("ticker", "")).upper().strip()
    try:
        if name == "get_stock_fundamentals":
            return (_json(stock_research(ticker)), False)
        if name == "get_predictions":
            return (_json(stock_predictions(ticker)), False)
        if name == "get_thesis":
            return (_json(stock_thesis(ticker)), False)
    except Exception as exc:  # noqa: BLE001
        return (f"Tool error: {exc}", True)
    return None
