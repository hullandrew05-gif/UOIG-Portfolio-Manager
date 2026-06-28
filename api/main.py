"""FastAPI backend for the UOIG Endowment Terminal.

Serves the React frontend's data from the existing analytics layer. Run:
    python -m uvicorn api.main:app --reload --port 8000
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import secrets as _secrets  # noqa: E402

from fastapi import FastAPI, HTTPException, Request  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import JSONResponse, RedirectResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

from api.build import FUND_META, build_terminal_data  # noqa: E402
from src.auth import sessions as auth_sessions  # noqa: E402
from src.auth import invitations as auth_invites  # noqa: E402
from src.auth import workos_client as wc  # noqa: E402
from src.analytics.pnl import load_positions  # noqa: E402
from src.ingest.research import stock_research  # noqa: E402
from src.ingest.lookup import (search_symbols, quote_overview,  # noqa: E402
                               live_series)
from src.ingest.predictions import stock_predictions  # noqa: E402
from src.ingest.thesis import stock_thesis  # noqa: E402
from src.assistant import answer as llm_answer, api_key as llm_key  # noqa: E402
from src.analytics.risk import daily_returns_matrix  # noqa: E402
from src.analytics.series import (price_frame, period_return, synthetic_index,  # noqa: E402
                                  ticker_series)
from src.config import db_path, load_config  # noqa: E402
from src.model.schema import get_connection  # noqa: E402

CFG = load_config()
app = FastAPI(title="UOIG Endowment Terminal API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ---------------------------------------------------------------------------
# Authentication (WorkOS, invite-only Google OAuth). The whole app is gated:
# every /api/* route except health and /api/auth/* requires a valid session.
# The SPA (static mount at /) stays public; the client redirects to sign-in.
# ---------------------------------------------------------------------------
_AUTH_PUBLIC = ("/api/health", "/api/auth/")


def _set_session_cookie(resp, sealed: str) -> None:
    resp.set_cookie(wc.COOKIE_NAME, sealed, max_age=wc.SESSION_MAX_AGE,
                    httponly=True, samesite="lax", secure=wc.is_secure(), path="/")


def _current(request: Request):
    """(session_result, new_sealed) for the request's cookie, or (None, None)."""
    sealed = request.cookies.get(wc.COOKIE_NAME)
    if not sealed or not wc.configured():
        return None, None
    return auth_sessions.authenticate(sealed)


@app.middleware("http")
async def _auth_gate(request: Request, call_next):
    path = request.url.path
    gated = path.startswith("/api/") and not path.startswith(_AUTH_PUBLIC)
    if gated and not wc.auth_disabled():
        res, new_sealed = _current(request)
        if res is None:
            return JSONResponse({"detail": "authentication required"}, status_code=401)
        request.state.user = res
        response = await call_next(request)
        if new_sealed:
            _set_session_cookie(response, new_sealed)
        return response
    return await call_next(request)


@app.get("/api/auth/login")
def auth_login():
    """Begin Google OAuth: stash a CSRF state cookie, 302 to WorkOS."""
    if not wc.configured():
        raise HTTPException(503, "WorkOS is not configured on the server")
    state = _secrets.token_urlsafe(24)
    resp = RedirectResponse(auth_sessions.authorization_url(state), status_code=302)
    resp.set_cookie(wc.STATE_COOKIE, state, max_age=600, httponly=True,
                    samesite="lax", secure=wc.is_secure(), path="/")
    return resp


@app.get("/api/auth/callback")
def auth_callback(request: Request, code: str = "", state: str = ""):
    """OAuth return: verify state, exchange code, enforce invite-only, set cookie."""
    if not code or not state or state != request.cookies.get(wc.STATE_COOKIE):
        return RedirectResponse("/?auth_error=bad_state", status_code=302)
    try:
        auth = auth_sessions.complete_login(code)
    except Exception:  # noqa: BLE001
        return RedirectResponse("/?auth_error=auth_failed", status_code=302)
    if not auth_sessions.is_member(auth):
        return RedirectResponse("/?auth_error=not_invited", status_code=302)
    resp = RedirectResponse("/", status_code=302)
    resp.delete_cookie(wc.STATE_COOKIE, path="/")
    _set_session_cookie(resp, auth_sessions.seal(auth))
    return resp


@app.get("/api/auth/me")
def auth_me(request: Request):
    """Current user + role (+ canInvite), or 401. The frontend gate calls this on load."""
    if wc.auth_disabled():
        return {"user": {"id": "dev", "email": "dev@local", "name": "Dev User",
                         "firstName": "Dev", "lastName": "User", "profilePictureUrl": None},
                "role": wc.pm_role(), "canInvite": True}
    res, new_sealed = _current(request)
    if res is None:
        raise HTTPException(401, "not authenticated")
    payload, role = auth_sessions.user_payload(res)
    resp = JSONResponse({"user": payload, "role": role, "canInvite": wc.is_pm(role)})
    if new_sealed:
        _set_session_cookie(resp, new_sealed)
    return resp


@app.post("/api/auth/logout")
def auth_logout():
    resp = JSONResponse({"ok": True})
    resp.delete_cookie(wc.COOKIE_NAME, path="/")
    return resp


@app.post("/api/auth/invite")
def auth_invite(request: Request, payload: dict):
    """Invite a teammate by email. PM-only (the first role-gated action); enforced
    server-side as well as hidden in the UI. Invites can also be sent from the dashboard."""
    if not wc.auth_disabled():
        res, _ = _current(request)
        if res is None:
            raise HTTPException(401, "not authenticated")
        if not wc.is_pm(getattr(res, "role", None)):
            raise HTTPException(403, "only a PM can invite teammates")
    if not wc.configured():
        raise HTTPException(503, "WorkOS is not configured on the server")
    email = (payload.get("email") or "").strip()
    if not email:
        raise HTTPException(400, "email is required")
    inv = auth_invites.send_invite(email, payload.get("role_slug"))
    return {"ok": True, "id": getattr(inv, "id", None), "email": email}


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
        if s["close"]:
            return {"ticker": ticker, "period": period,
                    "ret": period_return(pf, ticker, period), **s}
    finally:
        conn.close()
    # Not a portfolio holding — pull a live series straight from yfinance.
    live = live_series(ticker, period)
    if not live["close"]:
        raise HTTPException(404, f"no series for {ticker}")
    return {"ticker": ticker.upper(), "period": period, **live}


@app.get("/api/search")
def search(q: str = "", limit: int = 8):
    """Yahoo Finance symbol search (equities only) for the global search box."""
    return {"results": search_symbols(q, limit)}


@app.get("/api/quote/{ticker}")
def quote(ticker: str):
    """Live overview for any equity, so off-portfolio tickers can open a stock
    page. Returns 404 for non-equities / unknown symbols."""
    try:
        ov = quote_overview(ticker)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(502, f"quote fetch failed: {exc}")
    if ov is None:
        raise HTTPException(404, f"no equity quote for {ticker}")
    return ov


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


@app.get("/api/stock/{ticker}")
def stock_detail(ticker: str):
    """Live yfinance research for the stock-detail tabs (financials, earnings,
    news, analysts). Cached in-process; see src/ingest/research.py."""
    try:
        return stock_research(ticker.upper())
    except Exception as exc:  # noqa: BLE001 — surface upstream failure as 502
        raise HTTPException(502, f"research fetch failed: {exc}")


@app.get("/api/predictions/{ticker}")
def predictions(ticker: str):
    """Kalshi prediction-market cards for the stock-detail Predictions tab,
    from the curated PREDICTION_MARKETS.md map. See src/ingest/predictions.py."""
    try:
        return stock_predictions(ticker.upper())
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(502, f"prediction fetch failed: {exc}")


@app.get("/api/thesis/{ticker}")
def thesis(ticker: str):
    """Most recent investment thesis (three points) from THESIS.md."""
    return stock_thesis(ticker.upper())


def _chat_system(conn, context: str) -> str:
    """System prompt that grounds the co-pilot in the live portfolio."""
    data = build_terminal_data(CFG, conn)
    lines = [
        "You are the research co-pilot embedded in the University of Oregon Investment "
        "Group (UOIG) endowment terminal. You help the portfolio manager reason about the "
        "Tall Firs and Alumni Fund portfolios.",
        "Be concise and specific; ground every claim in the data below. Use plain text "
        "with **bold** for key figures. If something isn't in the data, say so rather than "
        "guessing. This is for an internal student investment club — not personalized "
        "financial advice.",
        "You can read this project's source repository with the list_files, read_file, and "
        "search_repo tools — use them for how the terminal works, how a number is computed, or "
        "the analytics/data pipeline. Secrets, the database, and ignored files are not "
        "accessible; don't claim otherwise.",
        "For deeper per-holding analysis you have: get_stock_fundamentals (live yfinance "
        "financials, earnings, news, analyst research), get_predictions (Kalshi market-implied "
        "odds), and get_thesis (the team's written pitch). Pull these on demand for a ticker; "
        "read only what the question needs.",
        "",
        f"PORTFOLIO SNAPSHOT (as of {data.get('asOf')}):",
    ]
    for f in data["funds"].values():
        ret = (f.get("ret") or {})
        ytd = ret.get("YTD")
        lines.append(
            f"- {f['name']}: AUM ${f.get('aum')}M · YTD {round(ytd * 100, 1) if ytd is not None else '—'}% "
            f"· beta {f.get('beta')} vs {f.get('benchShort')} · α {f.get('alpha')}%"
        )
    lines.append("")
    lines.append("HOLDINGS (ticker · sector · fund · weight% · MTD%):")
    for h in sorted(data["holdings"], key=lambda x: -(x.get("w") or 0)):
        lines.append(f"- {h['t']} · {h.get('s')} · {h['fund']} · {h.get('w')}% · {h.get('mtd')}%")
    if context:
        lines += ["", f"The user is currently viewing: {context}. "
                      "Resolve 'this'/'it'/'here' to that context when ambiguous."]
    return "\n".join(lines)


@app.post("/api/chat")
def chat(payload: dict):
    """Live Ask-Claude turn via the Anthropic API (claude-opus-4-8)."""
    messages = payload.get("messages") or []
    context = str(payload.get("context") or "")
    if not llm_key():
        return {"reply": "⚠ Ask Claude isn't configured yet. Set the **ANTHROPIC_API_KEY** "
                         "environment variable (or drop the key in `anthropic.key.txt` at the "
                         "repo root) and restart the backend."}
    conn = _conn()
    try:
        system = _chat_system(conn, context)
    finally:
        conn.close()
    try:
        return {"reply": llm_answer(messages, system)}
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(502, f"chat failed: {exc}")


# Serve the built React terminal (single-container deploy). The /api routes above
# are matched first; this catch-all mount serves the SPA for everything else.
_DIST = Path(__file__).resolve().parents[1] / "web" / "dist"
if _DIST.exists():
    app.mount("/", StaticFiles(directory=str(_DIST), html=True), name="web")
