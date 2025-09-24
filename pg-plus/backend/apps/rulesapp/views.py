from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


class RulePlaceholderView(APIView):
    """Placeholder for rules configuration endpoints."""

    def get(self, request, *args, **kwargs):
        return Response({"detail": "TODO: list rules"}, status=status.HTTP_501_NOT_IMPLEMENTED)
