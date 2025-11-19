from __future__ import annotations

from rest_framework import serializers

from .models import ProjectSelection, StudentReviewTicket, TeacherProject, VolunteerRecord


class TeacherProjectSerializer(serializers.ModelSerializer):
    selected_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = TeacherProject
        fields = [
            "id",
            "title",
            "description",
            "points",
            "deadline",
            "slots",
            "status",
            "selected_count",
            "created_at",
            "updated_at",
        ]


class ProjectSelectionSerializer(serializers.ModelSerializer):
    project_id = serializers.CharField(read_only=True)

    class Meta:
        model = ProjectSelection
        fields = [
            "id",
            "project",
            "project_id",
            "student_name",
            "student_account",
            "student_id",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "project": {"write_only": True},
            "student_name": {"required": True},
            "student_account": {"required": True},
        }


class VolunteerRecordSerializer(serializers.ModelSerializer):
    hours = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        coerce_to_string=False,
    )

    class Meta:
        model = VolunteerRecord
        fields = [
            "id",
            "student_name",
            "student_account",
            "student_id",
            "activity",
            "hours",
            "proof",
            "require_ocr",
            "status",
            "review_stage",
            "review_notes",
            "review_trail",
            "submitted_via",
            "project",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "status",
            "review_stage",
            "review_trail",
        ]


class StudentReviewTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentReviewTicket
        fields = [
            "id",
            "student_name",
            "student_id",
            "college",
            "major",
            "status",
            "review_stage",
            "review_notes",
            "review_trail",
            "created_at",
            "updated_at",
        ]


class ReviewDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(
        choices=["advance", "reject", "reset"],
        default="advance",
    )
    reviewer = serializers.CharField(allow_blank=True, required=False, default="系统")
    note = serializers.CharField(allow_blank=True, required=False, default="")
