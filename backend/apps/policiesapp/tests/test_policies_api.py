from __future__ import annotations

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient

from apps.policiesapp.models import Policy, PolicyTag
from apps.scoringapp.models import Student


@pytest.mark.django_db
def test_student_can_list_policies(api_client: APIClient, student_user: Student) -> None:
    tag = PolicyTag.objects.create(code="test", name="测试")
    Policy.objects.create(title="政策A", summary="说明A").tags.add(tag)

    api_client.force_authenticate(student_user)
    resp = api_client.get("/api/v1/policies/")
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    if isinstance(data, list):
        items = data
    else:
        items = data.get("results", [])
    assert any(item["title"] == "政策A" for item in items)


@pytest.mark.django_db
def test_student_cannot_create_policy(api_client: APIClient, student_user: Student) -> None:
    api_client.force_authenticate(student_user)
    resp = api_client.post("/api/v1/policies/", {"title": "X", "summary": "Y"}, format="json")
    assert resp.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_teacher_can_create_policy(api_client: APIClient, teacher_user: Student) -> None:
    tag = PolicyTag.objects.create(code="teacher", name="教师")
    api_client.force_authenticate(teacher_user)
    resp = api_client.post(
        "/api/v1/policies/",
        {"title": "教师政策", "summary": "说明", "tag_codes": [tag.code]},
        format="json",
    )
    assert resp.status_code == status.HTTP_201_CREATED
    body = resp.json()
    assert body["title"] == "教师政策"
    assert body["uploaded_by"] == teacher_user.id


@pytest.mark.django_db
def test_teacher_can_update_policy(api_client: APIClient, teacher_user: Student) -> None:
    policy = Policy.objects.create(title="初始", summary="old", uploaded_by=teacher_user)
    api_client.force_authenticate(teacher_user)
    resp = api_client.patch(
        f"/api/v1/policies/{policy.pk}/",
        {"summary": "new"},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    policy.refresh_from_db()
    assert policy.summary == "new"
