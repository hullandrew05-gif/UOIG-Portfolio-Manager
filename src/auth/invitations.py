"""Invite-by-email via WorkOS User Management.

Phase 1 ships send-only; invitations can also be created from the WorkOS
dashboard. The accept flow is handled by WorkOS + the normal sign-in callback
(an accepted invitation makes the user an org member, which the gate requires).
"""
from __future__ import annotations

from typing import Optional

from src.auth import workos_client as wc


def send_invite(email: str, role_slug: Optional[str] = None,
                inviter_user_id: Optional[str] = None):
    """Send an invitation to join the configured org, optionally with a role."""
    return wc.client().user_management.send_invitation(
        email=email,
        organization_id=wc.org_id(),
        role_slug=role_slug,
        inviter_user_id=inviter_user_id,
    )
