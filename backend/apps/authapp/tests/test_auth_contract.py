"""Auth contract tests covering login, registration and RBAC."""
from __future__ import annotations

import pytest
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import AccessToken

from apps.authapp.permissions import RolePermission
from apps.scoringapp.models import Student


@pytest.mark.django_db
def test_register_student_returns_tokens(api_client: APIClient) -> None:
    payload = {
        "username": "alice",
        "student_id": "S10001",
        "password": "Password123!",
        "role": Student.ROLE_STUDENT,
    }

    response = api_client.post("/api/v1/auth/register/", payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    body = response.json()
    assert body["user"]["username"] == payload["username"]
    assert body["user"]["role"] == Student.ROLE_STUDENT
    assert body["access"]
    assert body["refresh"]


@pytest.mark.django_db
def test_register_teacher_sets_role_and_staff(api_client: APIClient) -> None:
    payload = {
        "username": "teacher42",
        "student_id": "T42000",
        "password": "Password123!",
        "role": Student.ROLE_TEACHER,
    }

    response = api_client.post("/api/v1/auth/register/", payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    user = Student.objects.get(username=payload["username"])
    assert user.role == Student.ROLE_TEACHER
    assert user.is_staff is True


@pytest.mark.django_db
def test_login_returns_jwt_pair(api_client: APIClient, student_user: Student) -> None:
    response = api_client.post(
        "/api/v1/auth/login/",
        {"username": student_user.username, "password": "password123"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["access"]
    assert body["refresh"]
    assert body["user"]["username"] == student_user.username
    assert body["user"]["role"] == student_user.role


@pytest.mark.django_db
def test_login_tokens_carry_role_claim(api_client: APIClient, student_user: Student) -> None:
    response = api_client.post(
        "/api/v1/auth/login/",
        {"username": student_user.username, "password": "password123"},
        format="json",
    )

    access = AccessToken(response.json()["access"])
    assert access["role"] == student_user.role
    assert access["student_id"] == student_user.student_id


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


class TeacherOnlyView(APIView):
    permission_classes = (IsAuthenticated, RolePermission)
    required_roles = (Student.ROLE_TEACHER,)

    def get(self, request: Request) -> Response:
        return Response({"ok": True})


@pytest.mark.django_db
def test_role_permission_blocks_student(student_user: Student) -> None:
    factory = APIRequestFactory()
    request = factory.get("/dummy/")
    force_authenticate(request, user=student_user)

    response = TeacherOnlyView.as_view()(request)
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_role_permission_allows_teacher(teacher_user: Student) -> None:
    factory = APIRequestFactory()
    request = factory.get("/dummy/")
    force_authenticate(request, user=teacher_user)

    response = TeacherOnlyView.as_view()(request)
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_change_password_success(api_client: APIClient, student_user: Student) -> None:
    api_client.force_authenticate(user=student_user)
    payload = {
        "current_password": "password123",
        "new_password": "NewPass456!",
    }

    response = api_client.post("/api/v1/auth/change-password/", payload, format="json")

    assert response.status_code == status.HTTP_200_OK
    student_user.refresh_from_db()
    assert student_user.check_password("NewPass456!")


@pytest.mark.django_db
def test_change_password_rejects_invalid_current(
    api_client: APIClient, student_user: Student
) -> None:
    api_client.force_authenticate(user=student_user)
    payload = {
        "current_password": "wrongpass",
        "new_password": "NewPass456!",
    }

    response = api_client.post("/api/v1/auth/change-password/", payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
