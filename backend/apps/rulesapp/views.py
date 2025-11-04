from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


class RulePlaceholderView(APIView):
    """规则配置端点的占位视图。"""

    def get(self, request, *args, **kwargs):
        return Response({"detail": "TODO：列出规则"}, status=status.HTTP_501_NOT_IMPLEMENTED)
