"""Configuration loading and path resolution.

All paths in config.yaml are resolved relative to the project root so scripts
work regardless of the current working directory.
"""
from __future__ import annotations

from pathlib import Path

import yaml

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_config(path: str | Path | None = None) -> dict:
    cfg_path = Path(path) if path else PROJECT_ROOT / "config.yaml"
    with open(cfg_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _resolve(value: str) -> Path:
    p = Path(value)
    return p if p.is_absolute() else PROJECT_ROOT / p


def db_path(cfg: dict) -> Path:
    return _resolve(cfg["database"])


def workbook_path(cfg: dict) -> Path:
    return _resolve(cfg["source_workbook"])
