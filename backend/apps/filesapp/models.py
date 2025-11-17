"""Models for filesapp.

Tracks uploaded files, their visibility, processing status, and simple review metadata.
"""
from __future__ import annotations

import hashlib
import uuid
from typing import Any

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone


def upload_to_files(instance: models.Model, filename: str) -> str:
    today = timezone.now().date()
    return f"uploads/{today.year}/{today.month}/{today.day}/{uuid.uuid4().hex}_{filename}"


class File(models.Model):
    VIS_PRIVATE = "private"
    VIS_SCHOOL = "school"
    VIS_PUBLIC = "public"
    VISIBILITY_CHOICES = [
        (VIS_PRIVATE, "仅自己可见"),
        (VIS_SCHOOL, "校内可见"),
        (VIS_PUBLIC, "公开"),
    ]

    STATUS_QUEUED = "queued"
    STATUS_PROCESSING = "processing"
    STATUS_DONE = "done"
    STATUS_FAILED = "failed"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_QUEUED, "排队中"),
        (STATUS_PROCESSING, "处理中"),
        (STATUS_DONE, "已处理"),
        (STATUS_FAILED, "处理失败"),
        (STATUS_APPROVED, "已通过"),
        (STATUS_REJECTED, "已驳回"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to=upload_to_files)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="files",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    size = models.PositiveBigIntegerField(null=True, blank=True)
    mime_type = models.CharField(max_length=255, null=True, blank=True)
    checksum = models.CharField(max_length=128, null=True, blank=True)
    visibility = models.CharField(max_length=32, choices=VISIBILITY_CHOICES, default=VIS_PRIVATE)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_QUEUED)
    metadata = models.JSONField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_files",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.TextField(null=True, blank=True)

    # optional generic relation to business objects
    content_type = models.ForeignKey(ContentType, null=True, blank=True, on_delete=models.SET_NULL)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey("content_type", "object_id")

    class Meta:
        verbose_name = "文件"
        verbose_name_plural = "文件"

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"File {self.id} ({self.file.name})"

    def compute_checksum(self) -> str:
        """计算并返回 sha256 校验和（并保存）。"""
        h = hashlib.sha256()
        self.file.seek(0)
        for chunk in self.file.chunks():
            h.update(chunk)
        self.checksum = h.hexdigest()
        try:
            self.file.seek(0)
        except Exception:
            pass
        return self.checksum

    def save(self, *args: Any, **kwargs: Any) -> None:
        # populate size and mime_type when possible
        if self.file and (self.size is None or self.size == 0):
            try:
                self.size = self.file.size
            except Exception:
                pass
        super().save(*args, **kwargs)
