"""FastAPI backend for the UOIG Endowment Terminal.

Serves the React frontend's data from the existing analytics layer. Run:
    python -m uvicorn api.main:app --reload --port 8000
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

from api.build import FUND_META, build_terminal_data  # noqa: E402
from src.analytics.pnl import load_positions  # noqa: E402
from src.analytics.risk import daily_returns_matrix  # noqa: E402
from src.analytics.series import (price_frame, period_return, synthetic_index,  # noqa: E402
                                  ticker_series)
from src.config import db_path, load_config  # noqa: E402
from src.model.schema import get_connection  # noqa: E402

CFG = load_config()
app = FastAPI(title="UOIG Endowment Terminal API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def _conn():
    return get_connection(db_path(CFG))


def _fund_name(key: str):
    for f in CFG["funds"]:
        if FUND_META.get(f["name"], {}).get("key") == key or f["name"] == key:
            return f["name"], f["benchmark"]
    return None, None


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/data")
def data():
    conn = _conn()
    try:
        return build_terminal_data(CFG, conn)
    finally:
        conn.close()


@app.get("/api/series/{ticker}")
def series(ticker: str, period: str = "YTD"):
    conn = _conn()
    try:
        pf = price_frame(conn)
        s = ticker_series(pf, ticker, period)
        if not s["close"]:
            raise HTTPException(404, f"no series for {ticker}")
        return {"ticker": ticker, "period": period,
                "ret": period_return(pf, ticker, period), **s}
    finally:
        conn.close()


@app.get("/api/fund-series/{fund}")
def fund_series(fund: str, period: str = "YTD"):
    conn = _conn()
    try:
        name, bench = _fund_name(fund)
        if not name:
            raise HTTPException(404, f"unknown fund {fund}")
        pos = load_positions(CFG, conn)
        rets = daily_returns_matrix(conn, (CFG.get("risk") or {}).get("beta_window_years", 3))
        weights = {r.ticker: r.port_w for r in
                   pos[(pos.fund == name) & (pos.sec_type != "cash")].itertuples()
                   if r.port_w == r.port_w}
        syn = synthetic_index(rets, weights, period)
        bs = ticker_series(pf := price_frame(conn), bench, period)
        bvals = [round(v / bs["close"][0] * 100, 3) for v in bs["close"]] if bs["close"] else []
        return {"fund": syn, "bench": {"dates": bs["dates"], "values": bvals, "ticker": bench}}
    finally:
        conn.close()


@app.post("/api/chat")
def chat(payload: dict):
    # Phase D: replace with an Anthropic proxy using payload['messages'] + context.
    return {"stub": True,
            "reply": "Ask Claude isn't wired to the model yet — this is a stubbed "
                     "response. The live research co-pilot arrives in Phase D."}


# Serve the built React terminal (single-container deploy). The /api routes above
# are matched first; this catch-all mount serves the SPA for everything else.
_DIST = Path(__file__).resolve().parents[1] / "web" / "dist"
if _DIST.exists():
    app.mount("/", StaticFiles(directory=str(_DIST), html=True), name="web")
