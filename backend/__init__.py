"""Backend package initializer."""
from __future__ import annotations

from core.celery import celery_app

__all__ = ("celery_app",)
