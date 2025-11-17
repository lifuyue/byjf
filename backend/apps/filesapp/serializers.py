"""Serializers for filesapp."""
from __future__ import annotations

from typing import Any, Dict

from rest_framework import serializers

from .models import File


class FileSerializer(serializers.ModelSerializer):
    owner: serializers.StringRelatedField = serializers.StringRelatedField(read_only=True)
    reviewer: serializers.StringRelatedField = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = File
        fields = (
            "id",
            "file",
            "owner",
            "uploaded_at",
            "size",
            "mime_type",
            "checksum",
            "visibility",
            "status",
            "metadata",
            "error_message",
            "processed_at",
            "reviewer",
            "reviewed_at",
            "review_note",
            "content_type",
            "object_id",
        )
        read_only_fields = (
            "id",
            "owner",
            "uploaded_at",
            "size",
            "checksum",
            "status",
            "error_message",
            "processed_at",
            "reviewer",
            "reviewed_at",
            "review_note",
        )


class FileUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)

    class Meta:
        model = File
        fields = ("id", "file", "visibility", "metadata", "content_type", "object_id")
        read_only_fields = ("id",)

    def create(self, validated_data: Dict[str, Any]) -> File:
        request = self.context.get("request")
        owner = getattr(request, "user", None)
        file_obj = validated_data.pop("file")
        new_file = File(file=file_obj, owner=owner, **validated_data)
        new_file.save()
        try:
            new_file.compute_checksum()
            new_file.save(update_fields=["checksum"])
        except Exception:
            pass
        return new_file


class FileReviewSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(
        choices=[File.STATUS_APPROVED, File.STATUS_REJECTED]
    )
    review_note = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = File
        fields = ("status", "review_note")
