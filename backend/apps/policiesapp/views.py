from __future__ import annotations

from typing import Any, Iterable

from django.db.models import QuerySet
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request

from apps.authapp.permissions import RolePermission
from .models import Policy, PolicyTag
from .serializers import PolicySerializer, PolicyTagSerializer


def _is_teacher_or_admin(user: Any) -> bool:
    return getattr(user, "role", None) == "teacher" or user.is_staff or user.is_superuser


class PolicyTagListView(generics.ListAPIView):
    queryset = PolicyTag.objects.filter(is_active=True).order_by("order", "code")
    serializer_class = PolicyTagSerializer
    permission_classes = (IsAuthenticated,)


class PolicyListCreateView(generics.ListCreateAPIView):
    serializer_class = PolicySerializer
    permission_classes = (IsAuthenticated, RolePermission)
    required_roles: Iterable[str] = ("teacher", "admin")

    def get_permissions(self) -> list:
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [IsAuthenticated()]
        return [IsAuthenticated(), RolePermission()]

    def get_queryset(self) -> QuerySet[Policy]:
        qs = Policy.objects.filter(is_active=True).order_by("-created_at")
        params = self.request.query_params
        tag = params.get("tag")
        search = params.get("search")
        uploader = params.get("uploaded_by")

        if tag:
            qs = qs.filter(tags__code=tag)
        if search:
            qs = qs.filter(title__icontains=search)
        if uploader and _is_teacher_or_admin(self.request.user):
            qs = qs.filter(uploaded_by__pk=uploader)
        return qs


class PolicyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Policy.objects.all()
    serializer_class = PolicySerializer
    permission_classes = (IsAuthenticated, RolePermission)
    required_roles: Iterable[str] = ("teacher", "admin")

    def get_permissions(self) -> list:
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [IsAuthenticated()]
        return [IsAuthenticated(), RolePermission()]

    def perform_destroy(self, instance: Policy) -> None:
        instance.is_active = False
        instance.save(update_fields=["is_active"])
