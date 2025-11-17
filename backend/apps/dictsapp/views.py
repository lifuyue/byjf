from __future__ import annotations

from typing import Any

from django.db.models import QuerySet

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import DictEntry
from .serializers import DictEntrySerializer


class DictCategoriesView(generics.ListAPIView):
    """List available dictionary categories."""

    permission_classes = (IsAuthenticated,)
    serializer_class = DictEntrySerializer  # unused by get

    def list(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        categories = (
            DictEntry.objects.filter(is_active=True)
            .order_by("category")
            .values_list("category", flat=True)
            .distinct()
        )
        return Response({"categories": list(categories)})


class DictEntriesView(generics.ListAPIView):
    """List entries within a category (read-only)."""

    serializer_class = DictEntrySerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self) -> QuerySet[DictEntry]:
        category = self.kwargs["category"]
        return DictEntry.objects.filter(category=category, is_active=True).order_by("order", "code")
