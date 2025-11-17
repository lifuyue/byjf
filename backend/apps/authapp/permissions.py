"""Custom permission classes for role-based access control."""
from __future__ import annotations

from typing import Iterable

from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


class RolePermission(BasePermission):
    """
    Enforce role-based access control declared on the view.

    Usage:
        class SomeView(APIView):
            permission_classes = (IsAuthenticated, RolePermission)
            required_roles = ("teacher", "admin")
    """

    message = "You do not have permission to perform this action."

    def has_permission(self, request: Request, view: APIView) -> bool:
        required_roles = getattr(view, "required_roles", ())
        if not required_roles:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True

        if isinstance(required_roles, str):
            required = (required_roles,)
        elif isinstance(required_roles, Iterable):
            required = tuple(required_roles)
        else:
            required = (required_roles,)

        return request.user.role in required
