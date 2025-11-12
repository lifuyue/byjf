from __future__ import annotations

from typing import Any

from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


class PolicyPlaceholderView(APIView):
    """Placeholder for policy endpoints."""

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        return Response({"detail": "TODO: fetch policies"}, status=status.HTTP_501_NOT_IMPLEMENTED)
