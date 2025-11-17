"""Models for policiesapp."""
from __future__ import annotations

from django.conf import settings
from django.db import models


class PolicyTag(models.Model):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "政策标签"
        verbose_name_plural = "政策标签"
        ordering = ("order", "code")

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.name


class Policy(models.Model):
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to="policies/", blank=True, null=True)
    tags = models.ManyToManyField(PolicyTag, related_name="policies", blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="policies_uploaded",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "保研政策"
        verbose_name_plural = "保研政策"
        ordering = ("-created_at",)

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.title
