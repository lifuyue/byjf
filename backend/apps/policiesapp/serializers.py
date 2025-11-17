"""Serializers for policiesapp."""
from __future__ import annotations

from typing import Any, Dict

from rest_framework import serializers

from .models import Policy, PolicyTag


class PolicyTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = PolicyTag
        fields = ("id", "code", "name", "description", "order", "is_active")
        read_only_fields = ("id",)


class PolicySerializer(serializers.ModelSerializer):
    tags = PolicyTagSerializer(many=True, read_only=True)
    tag_codes = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False, allow_empty=True
    )

    class Meta:
        model = Policy
        fields = (
            "id",
            "title",
            "summary",
            "file",
            "tags",
            "tag_codes",
            "uploaded_by",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "uploaded_by", "created_at", "updated_at")

    def _resolve_tags(self, codes: list[str]) -> list[PolicyTag]:
        return list(PolicyTag.objects.filter(code__in=codes, is_active=True))

    def create(self, validated_data: Dict[str, Any]) -> Policy:
        tag_codes = validated_data.pop("tag_codes", [])
        request = self.context.get("request")
        user = getattr(request, "user", None)
        policy = Policy.objects.create(uploaded_by=user, **validated_data)
        if tag_codes:
            policy.tags.set(self._resolve_tags(tag_codes))
        return policy

    def update(self, instance: Policy, validated_data: Dict[str, Any]) -> Policy:
        tag_codes = validated_data.pop("tag_codes", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tag_codes is not None:
            instance.tags.set(self._resolve_tags(tag_codes))
        return instance
