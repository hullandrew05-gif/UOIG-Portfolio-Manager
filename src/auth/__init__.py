"""WorkOS-backed authentication for the terminal (invite-only Google OAuth).

Phase 1: sign-in flow only. The package wraps the WorkOS User Management /
AuthKit Python SDK so `api/main.py` stays thin:

  workos_client  — client singleton + secret/config loading (env -> git-ignored file)
  sessions       — authorization URL, code exchange, sealed-session encode/verify
  invitations    — invite-by-email (send only)

Roles are read and surfaced but not yet enforced (see DESIGN/plan).
"""
