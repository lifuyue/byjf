from __future__ import annotations

from typing import Any, Iterable

from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import Q, QuerySet
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer

from apps.authapp.permissions import RolePermission
from .models import File
from .serializers import FileReviewSerializer, FileSerializer, FileUploadSerializer
from .tasks import parse_uploaded_file


def _is_teacher_or_admin(user: Any) -> bool:
    return getattr(user, "role", None) == "teacher" or user.is_staff or user.is_superuser


class FileUploadView(generics.CreateAPIView):
    """Upload a file, mark it as queued, and enqueue parsing."""

    serializer_class = FileUploadSerializer
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def perform_create(self, serializer: BaseSerializer[Any]) -> None:
        with transaction.atomic():
            file_obj = serializer.save()
            file_obj.status = File.STATUS_QUEUED
            file_obj.save(update_fields=["status"])
        # Try to enqueue Celery task; fallback to synchronous processing if broker unavailable.
        try:
            parse_uploaded_file.delay(str(file_obj.pk))
        except Exception:
            parse_uploaded_file(str(file_obj.pk))


class FileListView(generics.ListAPIView):
    """List files with role-based visibility and optional filters."""

    serializer_class = FileSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self) -> QuerySet[File]:
        qs = File.objects.all().order_by("-uploaded_at")
        user = self.request.user
        params = self.request.query_params

        ct_param = params.get("content_type")
        obj_id = params.get("object_id")
        owner = params.get("owner")
        status_param = params.get("status")

        if ct_param:
            try:
                if "." in ct_param:
                    app_label, model = ct_param.split(".", 1)
                    ct = ContentType.objects.get(app_label=app_label, model=model)
                else:
                    ct = ContentType.objects.get(model=ct_param)
                qs = qs.filter(content_type=ct)
            except ContentType.DoesNotExist:
                return File.objects.none()

        if obj_id:
            qs = qs.filter(object_id=obj_id)

        if owner:
            qs = qs.filter(owner__pk=owner)

        if status_param:
            qs = qs.filter(status=status_param)

        # visibility enforcement
        if _is_teacher_or_admin(user):
            return qs
        return qs.filter(Q(owner=user) | Q(visibility=File.VIS_PUBLIC))


class FileDetailView(generics.RetrieveAPIView):
    """Return metadata for a file."""

    queryset = File.objects.all()
    serializer_class = FileSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self) -> QuerySet[File]:
        qs = super().get_queryset()
        user = self.request.user
        if _is_teacher_or_admin(user):
            return qs
        return qs.filter(Q(owner=user) | Q(visibility=File.VIS_PUBLIC))


class FileDownloadView(generics.RetrieveAPIView):
    """Return a download URL (file.url) for the file. Caller must have access."""

    queryset = File.objects.all()
    serializer_class = FileSerializer
    permission_classes = (IsAuthenticated,)

    def retrieve(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        obj = self.get_object()
        user = request.user
        allowed = False
        if obj.visibility == File.VIS_PUBLIC:
            allowed = True
        if obj.owner and obj.owner_id == getattr(user, "id", None):
            allowed = True
        if _is_teacher_or_admin(user):
            allowed = True

        if not allowed:
            return Response({"detail": "权限不足"}, status=status.HTTP_403_FORBIDDEN)

        data = FileSerializer(obj, context={"request": request}).data
        try:
            file_url = request.build_absolute_uri(obj.file.url)
            data["file_url"] = file_url
        except Exception:
            data["file_url"] = obj.file.url if obj.file else None
        return Response(data, status=status.HTTP_200_OK)


class FileReviewView(generics.UpdateAPIView):
    """Approve or reject a processed file (teacher/admin only)."""

    queryset = File.objects.all()
    serializer_class = FileReviewSerializer
    permission_classes = (IsAuthenticated, RolePermission)
    required_roles: Iterable[str] = ("teacher", "admin")

    def get_queryset(self) -> QuerySet[File]:
        return File.objects.exclude(status__in=[File.STATUS_QUEUED, File.STATUS_PROCESSING])

    def update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        file_obj: File = self.get_object()
        serializer = self.get_serializer(file_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        file_obj.status = data["status"]
        file_obj.reviewer = request.user  # type: ignore[assignment]
        file_obj.review_note = data.get("review_note", "")
        file_obj.reviewed_at = timezone.now()
        file_obj.save(update_fields=["status", "reviewer", "review_note", "reviewed_at"])
        return Response(FileSerializer(file_obj).data)
