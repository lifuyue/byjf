from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


class ScorePreviewView(APIView):
    """Placeholder scoring endpoint."""

    def get(self, request, *args, **kwargs):
        return Response({"detail": "TODO: preview scoring results"}, status=status.HTTP_501_NOT_IMPLEMENTED)
