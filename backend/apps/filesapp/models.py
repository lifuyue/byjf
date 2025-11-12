"""Models for filesapp.

Provides a centralized File model used by other apps to store metadata about
uploaded files. The model intentionally keeps track of ownership, visibility,
and optional generic relation to a business object.
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

    STATUS_UPLOADED = "uploaded"
    STATUS_SCANNED = "scanned"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_ARCHIVED = "archived"
    STATUS_CHOICES = [
        (STATUS_UPLOADED, "已上传"),
        (STATUS_SCANNED, "已扫描"),
        (STATUS_APPROVED, "已批准"),
        (STATUS_REJECTED, "已驳回"),
        (STATUS_ARCHIVED, "已归档"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to=upload_to_files)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="files")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    size = models.PositiveBigIntegerField(null=True, blank=True)
    mime_type = models.CharField(max_length=255, null=True, blank=True)
    checksum = models.CharField(max_length=128, null=True, blank=True)
    visibility = models.CharField(max_length=32, choices=VISIBILITY_CHOICES, default=VIS_PRIVATE)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_UPLOADED)
    metadata = models.JSONField(null=True, blank=True)

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
        # read file in chunks
        self.file.seek(0)
        for chunk in self.file.chunks():
            h.update(chunk)
        self.checksum = h.hexdigest()
        # restore file pointer
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
