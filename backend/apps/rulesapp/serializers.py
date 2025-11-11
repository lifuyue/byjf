"""rulesapp 的序列化器。"""
from __future__ import annotations

from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType

from .models import ScoreLimit, Policy, ProofReview


class ScoreLimitSerializer(serializers.ModelSerializer):
	class Meta:
		model = ScoreLimit
		fields = ("id", "a_max", "b_max", "c_max", "updated_at")


class PolicySerializer(serializers.ModelSerializer):
	uploaded_by = serializers.StringRelatedField(read_only=True)

	class Meta:
		model = Policy
		fields = ("id", "title", "file", "uploaded_by", "uploaded_at")


class ProofReviewSerializer(serializers.ModelSerializer):
	reviewer = serializers.StringRelatedField(read_only=True)
	student = serializers.StringRelatedField(read_only=True)
	content_type = serializers.SlugRelatedField(slug_field="model", queryset=ContentType.objects.all())

	class Meta:
		model = ProofReview
		fields = (
			"id",
			"content_type",
			"object_id",
			"student",
			"file_path",
			"status",
			"reason",
			"reviewer",
			"reviewed_at",
			"created_at",
		)
