"""Investment theses for the stock page's Thesis tab.

Reads THESIS.md (repo root): per ticker, one or more dated blocks of three
numbered points. The tab shows the most recent block. Pure local parse — no
network — with a mtime-based reload so edits show up without a restart.
"""
from __future__ import annotations

import re
from pathlib import Path

_PATH = Path(__file__).resolve().parents[2] / "THESIS.md"
_cache: tuple[float, dict] | None = None

_SECTION = re.compile(r"^###\s+([A-Za-z0-9.\-]+)\b(.*?)(?=^###\s|\Z)", re.S | re.M)
_BLOCK = re.compile(r"\*\*(\d{4}-\d{2}-\d{2})\s*·\s*(.*?)\*\*(.*?)(?=\*\*\d{4}-\d{2}-\d{2}|\Z)", re.S)
_POINT = re.compile(r"^\s*\d+\.\s+(.*\S.*)$", re.M)


def load_theses() -> dict[str, list[dict]]:
    """Parse THESIS.md -> {TICKER: [{date, analyst, points}]}, newest-first."""
    global _cache
    try:
        mtime = _PATH.stat().st_mtime
    except FileNotFoundError:
        return {}
    if _cache and _cache[0] == mtime:
        return _cache[1]

    txt = _PATH.read_text(encoding="utf-8")
    out: dict[str, list[dict]] = {}
    for sec in _SECTION.finditer(txt):
        ticker = sec.group(1).strip().upper()
        blocks = []
        for b in _BLOCK.finditer(sec.group(2)):
            pts = [p.strip() for p in _POINT.findall(b.group(3)) if p.strip()]
            if pts:
                blocks.append({"date": b.group(1), "analyst": b.group(2).strip(), "points": pts})
        if blocks:
            blocks.sort(key=lambda x: x["date"], reverse=True)
            out[ticker] = blocks
    _cache = (mtime, out)
    return out


def stock_thesis(ticker: str) -> dict:
    blocks = load_theses().get(ticker.upper(), [])
    return {"ticker": ticker.upper(), "thesis": blocks[0] if blocks else None}
