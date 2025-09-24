from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


class JwtLoginView(APIView):
    """TODO: Implement JWT login wiring."""

    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request, *args, **kwargs):  # noqa: D401
        """Return a placeholder response until auth is implemented."""
        return Response({"detail": "TODO: implement login"}, status=status.HTTP_501_NOT_IMPLEMENTED)


class JwtRefreshView(APIView):
    """TODO: Implement refresh token exchange."""

    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request, *args, **kwargs):
        return Response({"detail": "TODO: implement refresh"}, status=status.HTTP_501_NOT_IMPLEMENTED)
