"""Coverage tests for rules app endpoints."""
from __future__ import annotations

from pathlib import Path

import pytest
from django.contrib.contenttypes.models import ContentType
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient

from apps.rulesapp.models import ProofReview, ScoreLimit
from apps.scoringapp.models import AcademicExpertise, Student


@pytest.mark.django_db
def test_admin_can_read_and_update_score_limits(api_client: APIClient, admin_user: Student) -> None:
    ScoreLimit.objects.create(a_max=70, b_max=15, c_max=5)
    api_client.force_authenticate(admin_user)

    get_response = api_client.get("/api/v1/rules/score-limits/")
    assert get_response.status_code == status.HTTP_200_OK
    assert get_response.data["a_max"] == 70

    update_response = api_client.put(
        "/api/v1/rules/score-limits/",
        {"a_max": 60, "b_max": 12},
        format="json",
    )
    assert update_response.status_code == status.HTTP_200_OK
    assert update_response.data["a_max"] == 60
    assert update_response.data["b_max"] == 12


@pytest.mark.django_db
def test_teacher_can_approve_proof(
    api_client: APIClient, teacher_user: Student, student_user: Student, media_root: Path
) -> None:
    api_client.force_authenticate(teacher_user)
    expertise = AcademicExpertise.objects.create(
        student=student_user,
        name="Paper",
        score=5,
        material=SimpleUploadedFile("paper.pdf", b"pdf", content_type="application/pdf"),
    )

    response = api_client.post(
        "/api/v1/rules/proof-review/",
        {
            "content_type": "scoringapp.academicexpertise",
            "object_id": expertise.pk,
            "action": "approve",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    review = ProofReview.objects.get(object_id=expertise.pk, content_type=ContentType.objects.get_for_model(expertise))
    assert review.status == ProofReview.STATUS_APPROVED
    assert review.reviewer == teacher_user


@pytest.mark.django_db
def test_reject_clears_material(
    api_client: APIClient, teacher_user: Student, student_user: Student, media_root: Path
) -> None:
    api_client.force_authenticate(teacher_user)
    expertise = AcademicExpertise.objects.create(
        student=student_user,
        name="Poster",
        score=4,
        material=SimpleUploadedFile("poster.png", b"img", content_type="image/png"),
    )

    response = api_client.post(
        "/api/v1/rules/proof-review/",
        {
            "content_type": "scoringapp.academicexpertise",
            "object_id": expertise.pk,
            "action": "reject",
            "reason": "资料不完整",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    expertise.refresh_from_db()
    assert not expertise.material
    review = ProofReview.objects.get(object_id=expertise.pk)
    assert review.status == ProofReview.STATUS_REJECTED
    assert review.reason == "资料不完整"
