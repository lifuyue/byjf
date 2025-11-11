"""Serializers for filesapp."""
from __future__ import annotations

from rest_framework import serializers
from .models import File


class FileSerializer(serializers.ModelSerializer):
	owner = serializers.StringRelatedField(read_only=True)

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

	def create(self, validated_data):
		request = self.context.get("request")
		owner = getattr(request, "user", None)
		file_obj = validated_data.pop("file")
		f = File(file=file_obj, owner=owner, **validated_data)
		f.save()
		# compute checksum lazily (safe to call after save)
		try:
			f.compute_checksum()
			f.save(update_fields=["checksum"])
		except Exception:
			pass
		return f
