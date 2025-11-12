from __future__ import annotations

from typing import Any

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


# Use SimpleJWT views for token obtain/refresh
class JwtLoginView(TokenObtainPairView):
    """登录以换取 access/refresh token（使用 Simple JWT 的实现）。"""
    pass


class JwtRefreshView(TokenRefreshView):
    """Refresh token endpoint."""
    pass


class CurrentUserView(APIView):
    """返回当前登录用户的基本信息（包含 role）。"""

    permission_classes = (IsAuthenticated,)

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        user = request.user
        data = {
            "id": user.id,
            "username": getattr(user, "username", None),
            "student_id": getattr(user, "student_id", None),
            "role": getattr(user, "role", None),
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        }
        return Response(data, status=status.HTTP_200_OK)
