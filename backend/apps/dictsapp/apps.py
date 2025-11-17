from __future__ import annotations

from django.apps import AppConfig


class DictsappConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.dictsapp"
    verbose_name = "公共字典"
