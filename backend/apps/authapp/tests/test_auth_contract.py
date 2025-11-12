"""Auth contract tests covering login and /me endpoints."""
from __future__ import annotations

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.scoringapp.models import Student


@pytest.mark.django_db
def test_login_returns_jwt_pair(api_client: APIClient, student_user: Student) -> None:
    response = api_client.post(
        "/api/v1/auth/login/",
        {"username": student_user.username, "password": "password123"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert "access" in body
    assert "refresh" in body
    assert body["access"]
    assert body["refresh"]


@pytest.mark.django_db
def test_current_user_profile(api_client: APIClient, student_user: Student) -> None:
    api_client.force_authenticate(user=student_user)
    response = api_client.get("/api/v1/auth/me/")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["username"] == student_user.username
    assert response.json()["role"] == student_user.role


@pytest.mark.django_db
def test_current_user_requires_authentication(api_client: APIClient) -> None:
    response = api_client.get("/api/v1/auth/me/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
