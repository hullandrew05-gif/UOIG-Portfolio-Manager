"""UOIG Portfolio Manager — Streamlit dashboard (Phase 1: live prices & P&L).

Run:  streamlit run app/streamlit_app.py
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import altair as alt  # noqa: E402
import pandas as pd  # noqa: E402
import streamlit as st  # noqa: E402

from src.config import db_path, load_config  # noqa: E402
from src.analytics.pnl import load_positions  # noqa: E402
from src.ingest.refresh import refresh  # noqa: E402
from src.model.schema import get_connection  # noqa: E402

st.set_page_config(page_title="UOIG Portfolio Manager", page_icon="📈", layout="wide")
CFG = load_config()


@st.cache_data(ttl=300)
def get_positions() -> pd.DataFrame:
    return load_positions(CFG)


def last_refresh() -> str:
    conn = get_connection(db_path(CFG))
    try:
        row = conn.execute("SELECT value FROM import_meta WHERE key='last_refresh'").fetchone()
    finally:
        conn.close()
    return row[0] if row else "never"


# ── Sidebar ────────────────────────────────────────────────────────────────
st.sidebar.title("📈 UOIG")
st.sidebar.caption("Portfolio Manager")

if st.sidebar.button("↻ Refresh prices", width="stretch"):
    with st.spinner("Pulling latest market data…"):
        summary = refresh(CFG)
    get_positions.clear()
    st.sidebar.success(f"+{summary['prices']} prices, {summary['dividends']} divs")

st.sidebar.caption(f"Last refresh: {last_refresh()}")
st.sidebar.divider()

df = get_positions()
fund = st.sidebar.selectbox("Fund", ["All"] + sorted(df["fund"].unique()))
view = df if fund == "All" else df[df["fund"] == fund]
sectors = ["All"] + sorted(view["sector"].unique())
sector = st.sidebar.selectbox("Sector", sectors)
if sector != "All":
    view = view[view["sector"] == sector]

# ── KPIs ───────────────────────────────────────────────────────────────────
st.title("Portfolio Overview")

aum = view["market_value"].sum()
day = view["day_chg"].sum()
prev_mv = (view["prev_close"] * view["shares"]).sum()
day_pct = (aum / prev_mv - 1) if prev_mv else float("nan")
stocks = view[view["sec_type"] == "stock"]
active_mv, active_cost = stocks["market_value"].sum(), stocks["cost_basis"].sum()
unreal = active_mv - active_cost
unreal_pct = (active_mv / active_cost - 1) if active_cost else float("nan")

k = st.columns(4)
k[0].metric("AUM (market value)", f"${aum:,.0f}")
k[1].metric("Day change", f"${day:,.0f}", f"{day_pct:+.2%}")
k[2].metric("Active unrealized P&L", f"${unreal:,.0f}", f"{unreal_pct:+.1%}")
k[3].metric("Positions", f"{len(view)}")
st.caption("Unrealized P&L covers the active stock sleeve (index overlay & cash "
           "have no cost basis in the source data; total-fund return arrives with "
           "TWR in Phase 2).")

# ── Sector active weight ───────────────────────────────────────────────────
if not stocks.empty:
    st.subheader("Sector active weight (vs. benchmark)")
    sec_aw = stocks.groupby("sector")["active_w"].sum().reset_index(name="active_w")
    chart = (
        alt.Chart(sec_aw)
        .mark_bar()
        .encode(
            x=alt.X("active_w:Q", title="Active weight", axis=alt.Axis(format="+.1%")),
            y=alt.Y("sector:N", sort="-x", title=None),
            color=alt.condition(
                "datum.active_w >= 0",
                alt.value("#1e8449"),   # overweight = green
                alt.value("#c0392b"),   # underweight = red
            ),
            tooltip=[
                alt.Tooltip("sector:N", title="Sector"),
                alt.Tooltip("active_w:Q", title="Active weight", format="+.2%"),
            ],
        )
        .properties(height=260)
    )
    st.altair_chart(chart, width="stretch")

# ── Holdings table ─────────────────────────────────────────────────────────
st.subheader("Holdings")
cols = ["fund", "ticker", "name", "sector", "cap_class", "shares", "entry_price",
        "price", "day_chg_pct", "market_value", "port_w", "active_w",
        "unreal_pnl", "unreal_pnl_pct", "total_ret_pct"]
table = view[cols].sort_values("market_value", ascending=False)

fmt = {
    "shares": "{:,.1f}", "entry_price": "${:,.2f}", "price": "${:,.2f}",
    "day_chg_pct": "{:+.2%}", "market_value": "${:,.0f}",
    "port_w": "{:.2%}", "active_w": "{:+.2%}",
    "unreal_pnl": "${:,.0f}", "unreal_pnl_pct": "{:+.1%}", "total_ret_pct": "{:+.1%}",
}


def _sign_color(v):
    if pd.isna(v):
        return ""
    return "color:#c0392b" if v < 0 else "color:#1e8449"


styler = (table.style
          .format(fmt, na_rep="—")
          .map(_sign_color, subset=["day_chg_pct", "unreal_pnl", "unreal_pnl_pct", "total_ret_pct"]))
st.dataframe(styler, width="stretch", hide_index=True, height=560)

st.caption("Prices via yfinance (end-of-day). Total return includes dividends "
           "since entry. Weights match the legacy sheet definitions.")
