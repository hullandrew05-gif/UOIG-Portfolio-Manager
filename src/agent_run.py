"""Run the user's Anthropic Managed Agent (e.g. the market-analysis agent) on
demand from the terminal's "Ask Claude" dock.

The agent is created ONCE in the Anthropic console/API; here we only reference it
by ID (the ANTHROPIC_AGENT_ID env var) and start a fresh **session** per run — the
mandatory Managed Agents flow is Agent (once) -> Session (every run). We stream the
session's events server-side and collect the agent's text until it goes idle, then
hand that back to the chat. The API key resolution is shared with the chat assistant.
"""
from __future__ import annotations

import io
import os
import time

from src.assistant import api_key

# A cloud environment (the per-session container host) is created once and reused.
# Pre-seed from ANTHROPIC_ENV_ID if set, else create lazily and cache in-process.
_ENV_CACHE = {"id": (os.environ.get("ANTHROPIC_ENV_ID") or "").strip() or None}
# Hard wall-clock cap for one run (the SDK stream timeout is per-chunk, not total).
RUN_TIMEOUT_S = 300


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


def run_agent(agent_id: str, task: str, context: str = "", attachments=None,
              title: str = "Market analysis") -> str:
    """Start a session against `agent_id`, send `context` + `task`, and return the
    agent's collected text output. `attachments` is a list of
    {filename, content (str), mount_path} files uploaded and mounted into the
    session workspace (e.g. the live holdings). Raises RuntimeError('no_key') /
    ('no_agent') for the configuration cases the caller maps to clean HTTP errors."""
    if not (agent_id or "").strip():
        raise RuntimeError("no_agent")
    client = _client()
    env_id = _environment_id(client)

    resources = []
    for att in (attachments or []):
        data = att["content"]
        if isinstance(data, str):
            data = data.encode("utf-8")
        up = client.beta.files.upload(file=(att["filename"], io.BytesIO(data), "application/json"))
        resources.append({"type": "file", "file_id": up.id,
                          "mount_path": att.get("mount_path") or ("/workspace/" + att["filename"])})

    kwargs = {"agent": agent_id, "environment_id": env_id, "title": title}
    if resources:
        kwargs["resources"] = resources
    session = client.beta.sessions.create(**kwargs)

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
