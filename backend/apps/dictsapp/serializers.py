"""Serializers for dictsapp."""
from __future__ import annotations

from rest_framework import serializers

from .models import DictEntry


class DictEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = DictEntry
        fields = (
            "id",
            "category",
            "code",
            "name",
            "description",
            "order",
            "is_active",
        )
        read_only_fields = ("id",)
