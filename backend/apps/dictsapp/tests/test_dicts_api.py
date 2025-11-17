from __future__ import annotations

import pytest
from rest_framework import status
from rest_framework.test import APIClient
from apps.scoringapp.models import Student


@pytest.mark.django_db
def test_list_categories(api_client: APIClient, student_user: Student) -> None:
    api_client.force_authenticate(student_user)
    resp = api_client.get("/api/v1/dicts/categories/")
    assert resp.status_code == status.HTTP_200_OK
    assert "categories" in resp.json()


@pytest.mark.django_db
def test_list_entries_by_category(api_client: APIClient, student_user: Student) -> None:
    api_client.force_authenticate(student_user)
    resp = api_client.get("/api/v1/dicts/policy_tag/")
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert isinstance(data, list)
