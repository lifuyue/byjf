from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


class FileUploadPlaceholderView(APIView):
    """Placeholder for file upload/download flows."""

    def get(self, request, *args, **kwargs):
        return Response({"detail": "TODO: list files"}, status=status.HTTP_501_NOT_IMPLEMENTED)

    def post(self, request, *args, **kwargs):
        return Response({"detail": "TODO: upload file"}, status=status.HTTP_501_NOT_IMPLEMENTED)
