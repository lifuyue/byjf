from __future__ import annotations

from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from .models import File
from .serializers import FileSerializer, FileUploadSerializer


class FileUploadView(generics.CreateAPIView):
    """Upload a file. Returns file metadata including id and file url."""

    serializer_class = FileUploadSerializer
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def perform_create(self, serializer):
        serializer.save()


class FileListView(generics.ListAPIView):
    """List files, supports filtering by content_type, object_id and owner.

    Query params:
      - content_type: model name ("app_label.model" or just "model")
      - object_id: integer id
      - owner: user id
    """

    serializer_class = FileSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        qs = File.objects.all().order_by("-uploaded_at")
        user = self.request.user
        params = self.request.query_params

        ct_param = params.get("content_type")
        obj_id = params.get("object_id")
        owner = params.get("owner")

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

        # visibility enforcement: owner and public always allowed;
        # teachers (role=='teacher'), staff and superusers can see school/private as appropriate
        if user.is_anonymous:
            qs = qs.filter(visibility=File.VIS_PUBLIC)
        else:
            if getattr(user, "role", None) == "teacher" or user.is_staff or user.is_superuser:
                # teacher/staff/admin see all matching files
                pass
            else:
                qs = qs.filter(Q(owner=user) | Q(visibility=File.VIS_PUBLIC))

        return qs


class FileDetailView(generics.RetrieveAPIView):
    """Return metadata for a file."""

    queryset = File.objects.all()
    serializer_class = FileSerializer
    permission_classes = (IsAuthenticated,)


class FileDownloadView(generics.RetrieveAPIView):
    """Return a download URL (file.url) for the file. Caller must have access."""

    queryset = File.objects.all()
    serializer_class = FileSerializer
    permission_classes = (IsAuthenticated,)

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        # simple visibility check: owner, teacher/admin or public
        user = request.user
        allowed = False
        if obj.visibility == File.VIS_PUBLIC:
            allowed = True
        if obj.owner and user and obj.owner.pk == user.pk:
            allowed = True
        if getattr(user, "role", None) == "teacher" or user.is_staff or user.is_superuser:
            allowed = True

        if not allowed:
            return Response({"detail": "权限不足"}, status=status.HTTP_403_FORBIDDEN)

        # return file URL and metadata
        data = FileSerializer(obj, context={"request": request}).data
        # attach absolute URL for convenience
        try:
            file_url = request.build_absolute_uri(obj.file.url)
            data["file_url"] = file_url
        except Exception:
            data["file_url"] = obj.file.url if obj.file else None
        return Response(data, status=status.HTTP_200_OK)
