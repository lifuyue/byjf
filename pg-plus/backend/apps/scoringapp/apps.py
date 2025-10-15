from __future__ import annotations

from django.apps import AppConfig


class ScoringappConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.scoringapp"
    verbose_name = "评分"
