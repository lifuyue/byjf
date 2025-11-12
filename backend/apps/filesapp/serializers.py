"""Serializers for filesapp."""
from __future__ import annotations

from typing import Any

from rest_framework import serializers

from .models import File

class FileSerializer(serializers.ModelSerializer):
	owner: serializers.StringRelatedField = serializers.StringRelatedField(read_only=True)

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
			"content_type",
			"object_id",
		)
		read_only_fields = ("id", "owner", "uploaded_at", "size", "checksum", "status")


class FileUploadSerializer(serializers.ModelSerializer):
	file = serializers.FileField(write_only=True)

	class Meta:
		model = File
		fields = ("id", "file", "visibility", "metadata", "content_type", "object_id")
		read_only_fields = ("id",)

	def create(self, validated_data: dict[str, Any]) -> File:
		request = self.context.get("request")
		owner = getattr(request, "user", None)
		file_obj = validated_data.pop("file")
		new_file = File(file=file_obj, owner=owner, **validated_data)
		new_file.save()
		# compute checksum lazily (safe to call after save)
		try:
			new_file.compute_checksum()
			new_file.save(update_fields=["checksum"])
		except Exception:
			pass
		return new_file
