"""Unit tests around scoring logic and models."""
from __future__ import annotations

import pytest

from apps.rulesapp.models import ScoreLimit
from apps.scoringapp.models import (
    AcademicExpertise,
    ComprehensivePerformance,
    Student,
    SubjectScore,
    get_score_limits,
)


@pytest.mark.django_db
def test_get_score_limits_uses_singleton() -> None:
    # default before singleton exists
    defaults = get_score_limits()
    assert defaults == (80, 15, 5)

    ScoreLimit.objects.create(a_max=60, b_max=10, c_max=8)
    assert get_score_limits() == (60.0, 10.0, 8.0)


@pytest.mark.django_db
def test_subject_score_and_totals_respect_limits() -> None:
    ScoreLimit.objects.create(a_max=50, b_max=12, c_max=10)
    student = Student.objects.create_user(username="stu", student_id="S1", password="pwd")

    subject = SubjectScore.objects.create(student=student, gpa=4, a_value=80)
    assert subject.calculated_score == 50

    AcademicExpertise.objects.create(student=student, name="PaperA", score=8)
    AcademicExpertise.objects.create(student=student, name="PaperB", score=10)
    ComprehensivePerformance.objects.create(student=student, name="Volunteer", score=9)
    ComprehensivePerformance.objects.create(student=student, name="Club", score=6)

    student.refresh_from_db()
    assert student.total_score == 50 + 12 + 10
    assert student.ranking == 1


@pytest.mark.django_db
def test_student_manager_flags_teacher_and_admin() -> None:
    teacher = Student.objects.create_user(username="teach", student_id="T1", password="pwd", role=Student.ROLE_TEACHER)
    admin = Student.objects.create_superuser(username="boss", student_id="B1", password="pwd")

    assert teacher.is_staff is True
    assert admin.is_staff is True
    assert admin.is_superuser is True
