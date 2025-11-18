from __future__ import annotations

import uuid
from typing import Any

from django.conf import settings
from django.db import models
from django.utils import timezone


def generate_project_id() -> str:
    return f"proj-{uuid.uuid4().hex[:10]}"


def generate_selection_id() -> str:
    return f"sel-{uuid.uuid4().hex[:10]}"


def generate_volunteer_id() -> str:
    return f"vol-{uuid.uuid4().hex[:10]}"


def generate_student_ticket_id() -> str:
    return f"stu-{uuid.uuid4().hex[:10]}"


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ReviewableModel(TimestampedModel):
    class ReviewStage(models.TextChoices):
        STAGE1 = "stage1", "一审"
        STAGE2 = "stage2", "二审"
        STAGE3 = "stage3", "三审"
        COMPLETED = "completed", "已完成"

    class ReviewStatus(models.TextChoices):
        PENDING = "pending", "待审核"
        APPROVED = "approved", "已通过"
        REJECTED = "rejected", "已驳回"
        CANCELLED = "cancelled", "已撤销"

    review_stage = models.CharField(
        max_length=32,
        choices=ReviewStage.choices,
        default=ReviewStage.STAGE1,
    )
    status = models.CharField(
        max_length=32,
        choices=ReviewStatus.choices,
        default=ReviewStatus.PENDING,
    )
    review_notes = models.TextField(blank=True)
    review_trail = models.JSONField(default=list, blank=True)

    class Meta:
        abstract = True

    def append_review_log(self, *, stage: str, reviewer: str, note: str | None = None) -> None:
        logs: list[dict[str, Any]] = list(self.review_trail or [])
        logs.append(
            {
                "stage": stage,
                "reviewer": reviewer,
                "note": note or "",
                "timestamp": timezone.now().isoformat(),
            }
        )
        self.review_trail = logs


class TeacherProject(TimestampedModel):
    class ProjectStatus(models.TextChoices):
        ACTIVE = "active", "进行中"
        PAUSED = "paused", "暂停中"
        ARCHIVED = "archived", "已归档"

    id = models.CharField(
        primary_key=True,
        max_length=64,
        default=generate_project_id,
        editable=False,
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    points = models.FloatField(default=0)
    deadline = models.DateField(null=True, blank=True)
    slots = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=32,
        choices=ProjectStatus.choices,
        default=ProjectStatus.ACTIVE,
    )
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="published_projects",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.id})"

    @property
    def selected_count(self) -> int:
        return self.selections.filter(status=ProjectSelection.SelectionStatus.ACTIVE).count()


class ProjectSelection(TimestampedModel):
    class SelectionStatus(models.TextChoices):
        ACTIVE = "active", "已选择"
        CANCELLED = "cancelled", "已取消"

    id = models.CharField(
        primary_key=True,
        max_length=64,
        default=generate_selection_id,
        editable=False,
    )
    project = models.ForeignKey(
        TeacherProject,
        related_name="selections",
        on_delete=models.CASCADE,
    )
    student_name = models.CharField(max_length=128)
    student_account = models.CharField(max_length=128)
    student_id = models.CharField(max_length=32, blank=True)
    status = models.CharField(
        max_length=32,
        choices=SelectionStatus.choices,
        default=SelectionStatus.ACTIVE,
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "student_account"],
                condition=models.Q(status="active"),
                name="unique_active_selection_per_student",
            )
        ]

    def __str__(self) -> str:
        return f"{self.project_id} -> {self.student_account}"


class VolunteerRecord(ReviewableModel):
    class SubmitChannel(models.TextChoices):
        STUDENT = "student", "学生提交"
        TEACHER = "teacher", "教师创建"

    id = models.CharField(
        primary_key=True,
        max_length=64,
        default=generate_volunteer_id,
        editable=False,
    )
    student_name = models.CharField(max_length=128)
    student_account = models.CharField(max_length=128)
    student_id = models.CharField(max_length=32, blank=True)
    activity = models.CharField(max_length=255)
    hours = models.DecimalField(max_digits=6, decimal_places=2)
    proof = models.CharField(max_length=255, blank=True)
    require_ocr = models.BooleanField(default=False)
    submitted_via = models.CharField(
        max_length=32,
        choices=SubmitChannel.choices,
        default=SubmitChannel.STUDENT,
    )
    project = models.ForeignKey(
        TeacherProject,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="volunteer_records",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.student_name} - {self.activity}"


class StudentReviewTicket(ReviewableModel):
    id = models.CharField(
        primary_key=True,
        max_length=64,
        default=generate_student_ticket_id,
        editable=False,
    )
    student_name = models.CharField(max_length=128)
    student_id = models.CharField(max_length=32)
    college = models.CharField(max_length=128)
    major = models.CharField(max_length=128)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.student_name} ({self.student_id})"
