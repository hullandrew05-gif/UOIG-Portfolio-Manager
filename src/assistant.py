"""Anthropic-backed research co-pilot for the terminal's Ask-Claude chat.

A thin wrapper over the Messages API (model claude-opus-4-8). The API key is read
from the ANTHROPIC_API_KEY environment variable, falling back to a git-ignored
`anthropic.key.txt` at the repo root (same pattern as the Kalshi key). The system
prompt — built by the caller — grounds answers in the live portfolio.
"""
from __future__ import annotations

import os
from pathlib import Path

MODEL = "claude-haiku-4-5"
_KEY_FILE = Path(__file__).resolve().parents[1] / "anthropic.key.txt"


def _parse_key(text: str) -> str | None:
    """Accept a bare key, a `ANTHROPIC_API_KEY=...` line, or a quoted value."""
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line and not line.startswith("sk-"):
            line = line.split("=", 1)[1]
        line = line.strip().strip('"').strip("'").strip()
        if line:
            return line
    return None


def api_key() -> str | None:
    """ANTHROPIC_API_KEY env var, else anthropic.key.txt, else None."""
    env = os.environ.get("ANTHROPIC_API_KEY")
    if env and env.strip():
        return _parse_key(env)
    try:
        return _parse_key(_KEY_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return None


# Only the most recent turns are sent each request, to bound input-token cost.
HISTORY_LIMIT = 8
# Max model round-trips per question when it reads repo files (bounds tool-use cost).
MAX_TOOL_TURNS = 6


def answer(messages: list[dict], system: str, max_tokens: int = 800) -> str:
    """Run one chat turn. `messages` is the [{role, content}] history."""
    key = api_key()
    if not key:
        raise RuntimeError("no_key")

    import anthropic  # imported lazily so the app boots without the SDK installed

    client = anthropic.Anthropic(api_key=key)
    msgs = [
        {"role": ("assistant" if m.get("role") == "assistant" else "user"),
         "content": str(m.get("content", ""))}
        for m in messages if str(m.get("content", "")).strip()
    ]
    msgs = msgs[-HISTORY_LIMIT:]
    # The Messages API requires the first turn to be a user message.
    while msgs and msgs[0]["role"] != "user":
        msgs.pop(0)
    if not msgs:
        return "Ask me anything about the portfolio."

    from src import repo_tools, data_tools
    tools = repo_tools.TOOLS + data_tools.TOOLS

    def _run(name, inp):
        return repo_tools.run_tool(name, inp) or data_tools.run_tool(name, inp) or (f"Unknown tool: {name}", True)

    # Manual agentic loop: let the model read the repo + per-stock data on demand, capped.
    def _text(resp):
        return "".join(b.text for b in resp.content if b.type == "text").strip()

    for _ in range(MAX_TOOL_TURNS):
        resp = client.messages.create(
            model=MODEL, max_tokens=max_tokens, system=system, messages=msgs, tools=tools,
        )
        tool_uses = [b for b in resp.content if b.type == "tool_use"]
        if not tool_uses:
            return _text(resp)
        msgs.append({"role": "assistant", "content": resp.content})
        results = []
        for b in tool_uses:
            content, is_error = _run(b.name, b.input)
            results.append({"type": "tool_result", "tool_use_id": b.id,
                            "content": content, "is_error": is_error})
        msgs.append({"role": "user", "content": results})

    return _text(resp) or "(stopped after reading the repository — try a narrower question.)"
