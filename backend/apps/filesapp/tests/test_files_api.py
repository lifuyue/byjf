"""End-to-end tests for files app endpoints."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient

from apps.filesapp.models import File
from apps.scoringapp.models import Student


def _extract_items(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return list(payload)
    if isinstance(payload, dict):
        results = payload.get("results")
        if isinstance(results, list):
            return results
    return []


@pytest.mark.django_db
def test_student_uploads_and_lists_own_files(
    api_client: APIClient, student_user: Student, media_root: Path
) -> None:
    api_client.force_authenticate(student_user)
    response = api_client.post(
        "/api/v1/files/upload/",
        {
            "file": SimpleUploadedFile("proof.txt", b"hello world", content_type="text/plain"),
            "visibility": File.VIS_PRIVATE,
        },
        format="multipart",
    )
    assert response.status_code == status.HTTP_201_CREATED
    created_id = response.data["id"]

    list_response = api_client.get("/api/v1/files/")
    assert list_response.status_code == status.HTTP_200_OK
    items = list(_extract_items(list_response.data))
    assert any(item["id"] == created_id for item in items)


@pytest.mark.django_db
def test_private_files_hidden_from_other_students(
    api_client: APIClient, student_user: Student, another_student: Student, media_root: Path
) -> None:
    api_client.force_authenticate(student_user)
    api_client.post(
        "/api/v1/files/upload/",
        {
            "file": SimpleUploadedFile("secret.pdf", b"secret", content_type="application/pdf"),
            "visibility": File.VIS_PRIVATE,
        },
        format="multipart",
    )

    api_client.force_authenticate(another_student)
    list_response = api_client.get("/api/v1/files/")
    items = list(_extract_items(list_response.data))
    assert items == []


@pytest.mark.django_db
def test_teacher_can_download_private_file(
    api_client: APIClient, student_user: Student, teacher_user: Student, media_root: Path
) -> None:
    file_obj = File.objects.create(
        file=SimpleUploadedFile("report.docx", b"content", content_type="application/msword"),
        owner=student_user,
        visibility=File.VIS_PRIVATE,
    )

    api_client.force_authenticate(teacher_user)
    response = api_client.get(f"/api/v1/files/{file_obj.pk}/download/")
    assert response.status_code == status.HTTP_200_OK
    assert response.data["id"] == str(file_obj.pk)
    assert response.data["file_url"]


@pytest.mark.django_db
def test_download_denied_for_unrelated_student(
    api_client: APIClient, student_user: Student, another_student: Student, media_root: Path
) -> None:
    file_obj = File.objects.create(
        file=SimpleUploadedFile("private.png", b"img", content_type="image/png"),
        owner=student_user,
        visibility=File.VIS_PRIVATE,
    )

    api_client.force_authenticate(another_student)
    response = api_client.get(f"/api/v1/files/{file_obj.pk}/download/")
    assert response.status_code == status.HTTP_403_FORBIDDEN
