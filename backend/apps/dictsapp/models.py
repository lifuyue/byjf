"""Model definitions for dictsapp."""
from __future__ import annotations

from django.db import models


class DictEntry(models.Model):
    """Generic dictionary entry grouped by category."""

    category = models.CharField(max_length=64, db_index=True)
    code = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "字典项"
        verbose_name_plural = "字典项"
        unique_together = ("category", "code")
        ordering = ("category", "order", "code")

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"{self.category}:{self.code} ({self.name})"
