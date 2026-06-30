"""Run the user's Anthropic Managed Agent (e.g. the market-analysis agent) on
demand from the terminal's "Ask Claude" dock.

The agent is created ONCE in the Anthropic console/API; here we only reference it
by ID (the ANTHROPIC_AGENT_ID env var) and start a fresh **session** per run — the
mandatory Managed Agents flow is Agent (once) -> Session (every run). We stream the
session's events server-side and collect the agent's text until it goes idle, then
hand that back to the chat. The API key resolution is shared with the chat assistant.
"""
from __future__ import annotations

import os
import time

from src.assistant import api_key

AGENT_ENV_VAR = "ANTHROPIC_AGENT_ID"
# A cloud environment (the per-session container host) is created once and reused.
# Pre-seed from ANTHROPIC_ENV_ID if set, else create lazily and cache in-process.
_ENV_CACHE = {"id": (os.environ.get("ANTHROPIC_ENV_ID") or "").strip() or None}
# Hard wall-clock cap for one run (the SDK stream timeout is per-chunk, not total).
RUN_TIMEOUT_S = 300


def agent_id() -> str | None:
    """The configured Managed Agent id (ANTHROPIC_AGENT_ID), or None if unset."""
    v = os.environ.get(AGENT_ENV_VAR)
    return v.strip() if v and v.strip() else None


def _client():
    key = api_key()
    if not key:
        raise RuntimeError("no_key")
    import anthropic  # lazy import so the app boots without the SDK installed
    return anthropic.Anthropic(api_key=key)


def _environment_id(client) -> str:
    if _ENV_CACHE.get("id"):
        return _ENV_CACHE["id"]
    env = client.beta.environments.create(
        name="uoig-terminal",
        config={"type": "cloud", "networking": {"type": "unrestricted"}},
    )
    _ENV_CACHE["id"] = env.id
    return env.id


def run_agent(task: str, context: str = "", title: str = "Market analysis") -> str:
    """Start a session against the configured agent, send `context` + `task`, and
    return the agent's collected text output. Raises RuntimeError('no_key') /
    ('no_agent') for the configuration cases the caller maps to clean HTTP errors."""
    aid = agent_id()
    if not aid:
        raise RuntimeError("no_agent")
    client = _client()
    env_id = _environment_id(client)
    session = client.beta.sessions.create(agent=aid, environment_id=env_id, title=title)

    message = (context.strip() + "\n\n" + task.strip()).strip() if context else task.strip()
    parts: list[str] = []
    deadline = time.monotonic() + RUN_TIMEOUT_S

    # Stream-first: open the stream, then send, so no early events are missed.
    with client.beta.sessions.events.stream(session_id=session.id) as stream:
        client.beta.sessions.events.send(
            session_id=session.id,
            events=[{"type": "user.message",
                     "content": [{"type": "text", "text": message}]}],
        )
        for event in stream:
            if time.monotonic() > deadline:
                parts.append("\n\n_(stopped: the agent run exceeded the time limit.)_")
                break
            et = getattr(event, "type", "")
            if et == "agent.message":
                for block in getattr(event, "content", []) or []:
                    if getattr(block, "type", "") == "text":
                        parts.append(block.text)
            elif et in ("session.status_idle", "session.status_terminated"):
                break

    return "".join(parts).strip() or "The agent finished without returning any text."
