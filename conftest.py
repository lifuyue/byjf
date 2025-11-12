"""Pytest configuration and shared fixtures."""
from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import TYPE_CHECKING

import pytest
from rest_framework.test import APIClient

if TYPE_CHECKING:
    from apps.scoringapp.models import Student

REPO_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = REPO_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
os.environ.setdefault("PG_PLUS_DB_ENGINE", "sqlite")


@pytest.fixture
def api_client() -> APIClient:
    """Shared DRF APIClient instance."""
    return APIClient()


@pytest.fixture
def student_user(db) -> "Student":
    """Create a baseline student user."""
    from apps.scoringapp.models import Student

    return Student.objects.create_user(
        username="student1",
        student_id="20230001",
        password="password123",
        role=Student.ROLE_STUDENT,
    )


@pytest.fixture
def another_student(db) -> "Student":
    from apps.scoringapp.models import Student

    return Student.objects.create_user(
        username="student2",
        student_id="20230002",
        password="password123",
        role=Student.ROLE_STUDENT,
    )


@pytest.fixture
def teacher_user(db) -> "Student":
    from apps.scoringapp.models import Student

    return Student.objects.create_user(
        username="teacher1",
        student_id="T0001",
        password="password123",
        role=Student.ROLE_TEACHER,
    )


@pytest.fixture
def admin_user(db) -> "Student":
    from apps.scoringapp.models import Student

    return Student.objects.create_user(
        username="admin1",
        student_id="A0001",
        password="password123",
        role=Student.ROLE_ADMIN,
    )


@pytest.fixture
def media_root(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    return tmp_path
