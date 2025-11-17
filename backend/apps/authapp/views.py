from __future__ import annotations

from typing import Any

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import (
    ChangePasswordSerializer,
    JwtTokenObtainPairSerializer,
    RegistrationSerializer,
    UserProfileSerializer,
)
from .tokens import issue_token_pair


class RegisterView(APIView):
    """Register a new user with a specific role."""

    permission_classes = (AllowAny,)

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh, access = issue_token_pair(user)
        payload = {
            "user": UserProfileSerializer(user).data,
            "access": str(access),
            "refresh": str(refresh),
        }
        return Response(payload, status=status.HTTP_201_CREATED)


class JwtLoginView(TokenObtainPairView):
    """Issue JWT token pair via Simple JWT."""

    permission_classes = (AllowAny,)  # type: ignore[assignment]
    serializer_class = JwtTokenObtainPairSerializer


class JwtRefreshView(TokenRefreshView):
    """Refresh token endpoint."""

    permission_classes = (AllowAny,)  # type: ignore[assignment]


class CurrentUserView(APIView):
    """Return the authenticated user's profile."""

    permission_classes = (IsAuthenticated,)

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        data = UserProfileSerializer(request.user).data
        return Response(data, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    """Allow authenticated users to update their password."""

    permission_classes = (IsAuthenticated,)

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "密码已更新。"}, status=status.HTTP_200_OK)
