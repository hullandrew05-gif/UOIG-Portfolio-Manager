"""WorkOS client singleton + secret/config loading.

Secrets follow the same convention as src/assistant.py: an environment variable
first, then a git-ignored text file at the repo root. The three real secrets are
WORKOS_API_KEY, WORKOS_CLIENT_ID and WORKOS_COOKIE_PASSWORD; org id, redirect URI
and the cookie-secure flag are plain config (env, with sane dev defaults).
"""
from __future__ import annotations

import os
import re
from functools import lru_cache
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
_ENVNAME = re.compile(r"^[A-Z][A-Z0-9_]*$")

# Session cookie (sealed WorkOS session) and the short-lived OAuth CSRF-state cookie.
COOKIE_NAME = "uoig_session"
STATE_COOKIE = "uoig_oauth_state"
SESSION_MAX_AGE = 60 * 60 * 24 * 14  # 14 days


def _parse_file(text: str) -> str | None:
    """First meaningful line: bare value, or `NAME=value` (only split when the
    left side looks like an env-var name, so base64 cookie passwords survive)."""
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            name, _, rest = line.partition("=")
            if _ENVNAME.match(name.strip()):
                line = rest.strip()
        return line.strip().strip('"').strip("'")
    return None


def _secret(env_name: str, filename: str) -> str | None:
    """`env_name` env var (verbatim), else repo-root `filename`, else None."""
    env = os.environ.get(env_name)
    if env and env.strip():
        return env.strip()
    try:
        return _parse_file((_ROOT / filename).read_text(encoding="utf-8"))
    except FileNotFoundError:
        return None


def api_key() -> str | None:
    return _secret("WORKOS_API_KEY", "workos.key.txt")


def client_id() -> str | None:
    return _secret("WORKOS_CLIENT_ID", "workos.client.txt")


def cookie_password() -> str | None:
    return _secret("WORKOS_COOKIE_PASSWORD", "workos.cookie.txt")


def org_id() -> str | None:
    """The WorkOS organization whose membership gates access (invite-only)."""
    return _secret("WORKOS_ORG_ID", "workos.org.txt")


def redirect_uri() -> str:
    """OAuth callback URL registered in WorkOS. Defaults to the dev Vite origin
    (Vite proxies /api to the backend), so the whole flow stays on :5173 locally."""
    return os.environ.get("WORKOS_REDIRECT_URI") or "http://localhost:5173/api/auth/callback"


def is_secure() -> bool:
    """Set UOIG_COOKIE_SECURE=1 in production (HTTPS) for Secure cookies."""
    return os.environ.get("UOIG_COOKIE_SECURE", "").lower() in ("1", "true", "yes")


def auth_disabled() -> bool:
    """Local-dev escape hatch — bypass the auth gate. NEVER set in production."""
    return os.environ.get("UOIG_AUTH_DISABLED", "").lower() in ("1", "true", "yes")


def configured() -> bool:
    """True once the three secrets needed to run the sign-in flow are present."""
    return bool(api_key() and client_id() and cookie_password())


@lru_cache(maxsize=1)
def _build(key: str, cid: str):
    from workos import WorkOSClient  # lazy: app boots without the SDK/creds
    return WorkOSClient(api_key=key, client_id=cid)


def client():
    key, cid = api_key(), client_id()
    if not (key and cid):
        raise RuntimeError("workos_not_configured")
    return _build(key, cid)
