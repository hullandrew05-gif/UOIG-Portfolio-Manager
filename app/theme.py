"""UOIG dark theme for the Streamlit dashboard.

Ports the design language of the team's reference dashboard (Fraunces serif
headings, IBM Plex Sans/Mono, stat-tile cards, mono uppercase micro-labels)
into a dark skin built on the UOIG brand palette:

    green  #004f27   (primary)
    gold   #ffc000   (secondary accent)
    grey   #5f5f62   (muted)

on a near-black canvas.
"""
from __future__ import annotations

import streamlit as st

# Shared palette for charts / table styling (kept in sync with the CSS vars).
PALETTE = {
    "green": "#004f27",
    "green_bright": "#2faa63",   # legible green on near-black
    "gold": "#ffc000",
    "grey": "#5f5f62",
    "pos": "#2faa63",
    "neg": "#e0625e",
    "ink": "#e9e9ec",
    "ink_soft": "#b6b7ba",
    "ink_dim": "#8a8b8e",
    "rule": "#2a2c2f",
}

_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

:root {
  --bg: #0e0f10; --bg-raised: #16181a; --bg-sunken: #0a0b0c; --bg-hover: #1e2023;
  --ink: #e9e9ec; --ink-soft: #b6b7ba; --ink-dim: #8a8b8e; --ink-faint: #5f5f62;
  --rule: #2a2c2f; --rule-strong: #3a3d41;
  --green: #004f27; --green-bright: #2faa63; --gold: #ffc000;
  --green-soft: rgba(0,79,39,0.35); --gold-soft: rgba(255,192,0,0.13);
  --font-serif: "Fraunces", Georgia, serif;
  --font-sans: "IBM Plex Sans", -apple-system, "Segoe UI", sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, Consolas, monospace;
}

/* base */
.stApp { background: var(--bg); }
html, body, [data-testid="stAppViewContainer"] *:not(svg):not(path) { font-family: var(--font-sans); }
[data-testid="stMainBlockContainer"] { padding-top: 2.2rem; max-width: 1280px; }

/* chrome: blend the header, drop the toolbar for a clean branded look */
[data-testid="stHeader"] { background: transparent; }
[data-testid="stToolbar"] { display: none; }
[data-testid="stDecoration"] { background: linear-gradient(90deg, var(--green), var(--gold)); }

/* headings */
.stApp h1 {
  font-family: var(--font-serif); font-weight: 600; letter-spacing: -0.02em;
  color: var(--ink); font-size: 30px;
}
.stApp h2, .stApp h3 {
  font-family: var(--font-mono); font-weight: 600; font-size: 12px !important;
  letter-spacing: 0.13em; text-transform: uppercase; color: var(--ink-dim);
  border-bottom: 1px solid var(--rule); padding-bottom: 8px; margin: 6px 0 2px;
}

/* brand bar */
.uoig-brand {
  display: flex; align-items: center; gap: 13px;
  padding: 2px 0 16px; margin-bottom: 12px; border-bottom: 1px solid var(--rule);
}
.uoig-mark {
  width: 30px; height: 30px; border-radius: 7px; flex-shrink: 0; position: relative;
  background: linear-gradient(140deg, var(--green-bright) 0%, var(--green) 75%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), 0 0 0 1px rgba(255,192,0,0.30);
}
.uoig-mark::after {
  content: ""; position: absolute; left: 7px; right: 7px; top: 12px; height: 3px;
  border-radius: 2px; background: var(--gold);
}
.uoig-name { font-family: var(--font-serif); font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }
.uoig-name .sub { color: var(--ink-dim); font-weight: 400; }
.uoig-spacer { flex: 1; }
.uoig-pill {
  font-family: var(--font-mono); font-size: 10px; font-weight: 600;
  letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold);
  border: 1px solid var(--gold); border-radius: 99px; padding: 3px 11px;
}
.uoig-pill .dot {
  display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: var(--gold); margin-right: 6px; vertical-align: middle;
}

/* metrics -> stat tiles */
[data-testid="stMetric"] {
  background: var(--bg-raised); border: 1px solid var(--rule);
  border-radius: 10px; padding: 14px 16px 12px;
}
[data-testid="stMetric"]::before {
  content: ""; display: block; height: 2px; width: 26px;
  background: var(--green-bright); border-radius: 2px; margin-bottom: 11px;
}
[data-testid="stMetricLabel"] * {
  font-family: var(--font-mono) !important; font-size: 10.5px !important;
  font-weight: 600 !important; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--ink-dim) !important;
}
[data-testid="stMetricValue"] {
  font-family: var(--font-serif) !important; font-weight: 600;
  font-size: 1.7rem !important; color: var(--ink) !important;
  font-variant-numeric: tabular-nums;
}
[data-testid="stMetricDelta"] { font-family: var(--font-mono) !important; font-size: 12px !important; }
[data-testid="stMetricDelta"] * { font-variant-numeric: tabular-nums; }

/* sidebar */
[data-testid="stSidebar"] { background: var(--bg-raised); border-right: 1px solid var(--rule); }
[data-testid="stSidebar"] h1 { font-family: var(--font-serif); font-size: 19px; }

/* buttons */
.stButton button {
  font-family: var(--font-mono); font-weight: 600; font-size: 12px;
  letter-spacing: 0.07em; text-transform: uppercase;
  background: var(--green); color: #f3fbf6;
  border: 1px solid var(--green-bright); border-radius: 6px;
}
.stButton button:hover { background: var(--green-bright); border-color: var(--gold); color: #06140c; }

/* captions */
[data-testid="stCaptionContainer"] {
  color: var(--ink-faint) !important; font-family: var(--font-mono); font-size: 10.5px;
  line-height: 1.5;
}

/* inputs */
[data-baseweb="select"] > div {
  background: var(--bg-sunken) !important; border-color: var(--rule) !important;
}

/* dataframe */
[data-testid="stDataFrame"] { border: 1px solid var(--rule); border-radius: 8px; }
</style>
"""


def inject_theme() -> None:
    st.markdown(_CSS, unsafe_allow_html=True)


def brand_header() -> None:
    st.markdown(
        '<div class="uoig-brand">'
        '<div class="uoig-mark"></div>'
        '<div class="uoig-name">UOIG <span class="sub">Portfolio Manager</span></div>'
        '<div class="uoig-spacer"></div>'
        '<div class="uoig-pill"><span class="dot"></span>Live</div>'
        '</div>',
        unsafe_allow_html=True,
    )
