"""Phase 0 guarantee: a fresh import reconciles to the source workbook exactly.

Runs the importer into a throwaway DB, then asserts every market value and
weight matches the original sheet within tolerance.
"""
from __future__ import annotations

import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.model import db as _db  # noqa: E402
_db.database_url = lambda: None  # hermetic: always use the throwaway SQLite file

from scripts.reconcile import MV_TOL, WEIGHT_TOL, reconcile  # noqa: E402
from src.config import load_config  # noqa: E402
from src.io.import_xlsx import import_workbook  # noqa: E402


def test_import_reconciles_to_workbook():
    cfg = load_config()
    with tempfile.TemporaryDirectory() as tmp:
        cfg["database"] = str(Path(tmp) / "test.db")
        import_workbook(cfg)
        report = reconcile(cfg)

    assert report["ok"], "reconciliation failed"
    for name, r in report["funds"].items():
        assert r["total_diff"] <= MV_TOL, f"{name} total off by {r['total_diff']}"
        assert r["max"]["mv"] <= MV_TOL, f"{name} a position MV is off"
        for field in ("class_w", "port_w", "active_w"):
            assert r["max"][field] <= WEIGHT_TOL, f"{name} {field} off"
        assert not r["mismatches"], f"{name} mismatches: {r['mismatches']}"


if __name__ == "__main__":
    test_import_reconciles_to_workbook()
    print("OK")
