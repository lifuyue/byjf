from __future__ import annotations

from django.apps import AppConfig


class ProgramsAppConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.programsapp"
    verbose_name = "项目与志愿管理"
