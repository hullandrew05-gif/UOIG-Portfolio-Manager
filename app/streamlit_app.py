"""UOIG Portfolio Manager — Streamlit dashboard.

Phase 1: live prices & P&L.  Phase 2: holding-period returns & 3-yr daily beta.
Run:  python -m streamlit run app/streamlit_app.py
"""
from __future__ import annotations

import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(APP_DIR.parent))  # project root (for `src`)
sys.path.insert(0, str(APP_DIR))         # app dir (for `theme`)

import altair as alt  # noqa: E402
import pandas as pd  # noqa: E402
import streamlit as st  # noqa: E402

from theme import PALETTE, brand_header, inject_theme  # noqa: E402

from src.config import db_path, load_config  # noqa: E402
from src.analytics.pnl import load_positions  # noqa: E402
from src.analytics.returns import enrich_returns, fund_performance, sector_performance  # noqa: E402
from src.analytics.risk import add_betas, daily_returns_matrix, fund_risk_table  # noqa: E402
from src.ingest.refresh import refresh  # noqa: E402
from src.model.schema import get_connection  # noqa: E402

st.set_page_config(page_title="UOIG Portfolio Manager", page_icon="📈", layout="wide")
inject_theme()
CFG = load_config()


@st.cache_data(ttl=300)
def get_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    conn = get_connection(db_path(CFG))
    try:
        pos = enrich_returns(load_positions(CFG, conn), conn)
        rets = daily_returns_matrix(conn, (CFG.get("risk") or {}).get("beta_window_years", 3))
    finally:
        conn.close()
    pos = add_betas(pos, rets)
    return pos, fund_risk_table(pos, rets, CFG)


def last_refresh() -> str:
    conn = get_connection(db_path(CFG))
    try:
        row = conn.execute("SELECT value FROM import_meta WHERE key='last_refresh'").fetchone()
    finally:
        conn.close()
    return row[0] if row else "never"


def _na_safe(spec):
    return lambda v: "—" if pd.isna(v) else spec.format(v)


def _sign_color(v):
    if pd.isna(v):
        return ""
    return f"color:{PALETTE['neg']}" if v < 0 else f"color:{PALETTE['pos']}"


def show_table(frame, fmt_map, color_cols=(), height=None):
    sty = frame.style.format({c: _na_safe(s) for c, s in fmt_map.items()})
    if color_cols:
        sty = sty.map(_sign_color, subset=list(color_cols))
    kwargs = {"width": "stretch", "hide_index": True}
    if height is not None:
        kwargs["height"] = height
    st.dataframe(sty, **kwargs)


def hbar(frame, value_col, label_col, fmt="+.0%", title=""):
    return (
        alt.Chart(frame)
        .mark_bar(cornerRadiusEnd=3, height=18)
        .encode(
            x=alt.X(f"{value_col}:Q", title=title, axis=alt.Axis(format=fmt)),
            y=alt.Y(f"{label_col}:N", sort="-x", title=None),
            color=alt.condition(f"datum.{value_col} >= 0",
                                alt.value(PALETTE["green_bright"]), alt.value(PALETTE["neg"])),
            tooltip=[alt.Tooltip(f"{label_col}:N"),
                     alt.Tooltip(f"{value_col}:Q", format="+.2%")],
        )
        .properties(height=max(160, 26 * len(frame)))
    )


# ── Sidebar ────────────────────────────────────────────────────────────────
st.sidebar.header("Controls")
if st.sidebar.button("↻ Refresh prices", width="stretch"):
    with st.spinner("Pulling latest market data…"):
        summary = refresh(CFG)
    get_data.clear()
    st.sidebar.success(f"+{summary['prices']} prices, {summary['dividends']} divs")
st.sidebar.caption(f"Last refresh: {last_refresh()}")
st.sidebar.divider()

df, fund_risk = get_data()
fund = st.sidebar.selectbox("Fund", ["All"] + sorted(df["fund"].unique()))
view_fund = df if fund == "All" else df[df["fund"] == fund]
sector = st.sidebar.selectbox("Sector", ["All"] + sorted(view_fund["sector"].unique()))
view = view_fund if sector == "All" else view_fund[view_fund["sector"] == sector]
stocks = view[view["sec_type"] == "stock"]

# ── Header + KPIs ──────────────────────────────────────────────────────────
brand_header()
st.title("Portfolio Overview")

aum = view["market_value"].sum()
day = view["day_chg"].sum()
prev_mv = (view["prev_close"] * view["shares"]).sum()
day_pct = (aum / prev_mv - 1) if prev_mv else float("nan")
active_mv, active_cost = stocks["market_value"].sum(), stocks["cost_basis"].sum()
unreal = active_mv - active_cost
unreal_pct = (active_mv / active_cost - 1) if active_cost else float("nan")

k = st.columns(4)
k[0].metric("AUM (market value)", f"${aum:,.0f}")
k[1].metric("Day change", f"${day:,.0f}", f"{day_pct:+.2%}")
k[2].metric("Active unrealized P&L", f"${unreal:,.0f}", f"{unreal_pct:+.1%}")
k[3].metric("Positions", f"{len(view)}")
st.caption("Unrealized P&L covers the active stock sleeve (index overlay & cash "
           "have no cost basis in the source data).")

tab_h, tab_p, tab_r = st.tabs(["Holdings", "Performance", "Risk"])

# ── Holdings tab ───────────────────────────────────────────────────────────
with tab_h:
    if not stocks.empty:
        st.subheader("Sector active weight (vs. benchmark)")
        sec_aw = stocks.groupby("sector")["active_w"].sum().reset_index(name="active_w")
        chart = (
            alt.Chart(sec_aw).mark_bar(cornerRadiusEnd=3, height=20).encode(
                x=alt.X("active_w:Q", title="Active weight", axis=alt.Axis(format="+.0%")),
                y=alt.Y("sector:N", sort="-x", title=None),
                color=alt.condition("datum.active_w >= 0",
                                    alt.value(PALETTE["green_bright"]), alt.value(PALETTE["gold"])),
                tooltip=[alt.Tooltip("sector:N", title="Sector"),
                         alt.Tooltip("active_w:Q", title="Active weight", format="+.2%")],
            ).properties(height=260)
        )
        st.altair_chart(chart, width="stretch")

    st.subheader("Holdings")
    cols = ["fund", "ticker", "name", "sector", "cap_class", "shares", "entry_price",
            "price", "day_chg_pct", "market_value", "port_w", "active_w",
            "unreal_pnl", "unreal_pnl_pct", "total_ret_pct"]
    labels = {"fund": "Fund", "ticker": "Ticker", "name": "Name", "sector": "Sector",
              "cap_class": "Cap", "shares": "Shares", "entry_price": "Entry", "price": "Price",
              "day_chg_pct": "Day %", "market_value": "Mkt Value", "port_w": "Port Wt",
              "active_w": "Active Wt", "unreal_pnl": "Unreal P&L", "unreal_pnl_pct": "Unreal %",
              "total_ret_pct": "Total Ret"}
    specs = {"Shares": "{:,.1f}", "Entry": "${:,.2f}", "Price": "${:,.2f}",
             "Day %": "{:+.2%}", "Mkt Value": "${:,.0f}", "Port Wt": "{:.2%}",
             "Active Wt": "{:+.2%}", "Unreal P&L": "${:,.0f}", "Unreal %": "{:+.1%}",
             "Total Ret": "{:+.1%}"}
    table = view[cols].sort_values("market_value", ascending=False).rename(columns=labels)
    show_table(table, specs, color_cols=["Day %", "Unreal P&L", "Unreal %", "Total Ret"], height=560)

# ── Performance tab ────────────────────────────────────────────────────────
with tab_p:
    st.caption("Holding-period total return (dividend-reinvested) since each name's entry — "
               "horizons differ by name. Annualized normalizes for holding length. "
               "Excess = return − benchmark over the same window.")
    fp = fund_performance(view_fund).rename(columns={
        "fund": "Fund", "hp_return": "HP Return", "ann_return": "Annualized",
        "excess": "Excess vs Bench", "names": "Names"})
    show_table(fp, {"HP Return": "{:+.1%}", "Annualized": "{:+.1%}", "Excess vs Bench": "{:+.1%}"},
               color_cols=["HP Return", "Annualized", "Excess vs Bench"])

    c1, c2 = st.columns(2)
    with c1:
        st.markdown("**Sector returns**")
        sp = sector_performance(view).rename(columns={
            "sector": "Sector", "weight": "Weight", "return": "Return",
            "contribution": "Contribution"})
        show_table(sp, {"Weight": "{:.1%}", "Return": "{:+.1%}", "Contribution": "{:+.2%}"},
                   color_cols=["Return", "Contribution"])
    with c2:
        st.markdown("**Top / bottom names** (holding-period return)")
        s = stocks.dropna(subset=["hp_tr"]).sort_values("hp_tr")
        picks = s if len(s) <= 14 else pd.concat([s.head(5), s.tail(9)])
        if not picks.empty:
            st.altair_chart(hbar(picks, "hp_tr", "ticker", title="Holding-period return"),
                            width="stretch")

# ── Risk tab ───────────────────────────────────────────────────────────────
with tab_r:
    st.caption("Beta = 3-yr daily regression of each name on its fund's benchmark "
               "(Tall Firs vs IWV / Russell 3000, Alumni vs IWM / Russell 2000). Fund beta is the "
               "portfolio-weighted average of constituent betas (index overlay β=1, cash β=0); "
               "synthetic β regresses a current-weights portfolio series on the benchmark.")
    fr = fund_risk[fund_risk["fund"].isin(view_fund["fund"].unique())].rename(columns={
        "fund": "Fund", "benchmark": "Bench", "beta": "Beta", "active_beta": "Active β",
        "syn_beta": "Synthetic β", "r2": "R²", "ann_vol": "Ann Vol"})
    show_table(fr, {"Beta": "{:.2f}", "Active β": "{:.2f}", "Synthetic β": "{:.2f}",
                    "R²": "{:.2f}", "Ann Vol": "{:.1%}"})

    st.markdown("**Per-name beta** (3-yr daily, vs fund benchmark)")
    nb = (stocks[["ticker", "name", "sector", "port_w", "beta", "beta_contrib", "r2", "n_obs"]]
          .sort_values("beta_contrib", ascending=False)
          .rename(columns={"ticker": "Ticker", "name": "Name", "sector": "Sector",
                           "port_w": "Port Wt", "beta": "Beta", "beta_contrib": "β Contrib",
                           "r2": "R²", "n_obs": "Obs"}))
    show_table(nb, {"Port Wt": "{:.2%}", "Beta": "{:.2f}", "β Contrib": "{:.3f}",
                    "R²": "{:.2f}", "Obs": "{:.0f}"}, height=520)

st.caption("Prices via yfinance (end-of-day). Returns are dividend-reinvested (adjusted close). "
           "Weights match the legacy sheet definitions.")
