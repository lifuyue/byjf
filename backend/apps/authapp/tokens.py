"""Utility helpers for issuing JWT tokens with role claims."""
from __future__ import annotations

from typing import Tuple

from rest_framework_simplejwt.tokens import AccessToken, RefreshToken, Token

from apps.scoringapp.models import Student


def attach_user_claims(token: Token, user: Student) -> Token:
    """Annotate a token with basic user claims for downstream checks."""

    token["role"] = user.role
    token["student_id"] = user.student_id
    token["is_staff"] = user.is_staff
    token["is_superuser"] = user.is_superuser
    return token


def issue_token_pair(user: Student) -> Tuple[RefreshToken, AccessToken]:
    """Create a refresh/access token pair carrying role claims."""

    refresh = RefreshToken.for_user(user)
    attach_user_claims(refresh, user)
    access = refresh.access_token
    attach_user_claims(access, user)
    return refresh, access
