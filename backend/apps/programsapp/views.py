from __future__ import annotations

from typing import Sequence

from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.response import Response

from apps.authapp.permissions import RolePermission
from .models import (
    ProjectSelection,
    StudentReviewTicket,
    TeacherProject,
    VolunteerRecord,
)
from .serializers import (
    ProjectSelectionSerializer,
    OverrideDecisionSerializer,
    ReviewDecisionSerializer,
    StudentReviewTicketSerializer,
    TeacherProjectSerializer,
    VolunteerRecordSerializer,
)


class DemoFriendlyPermission(permissions.AllowAny):
    """
    Placeholder permission that keeps the API open for the static demo.

    Replace with real role-based checks once the SPA hooks into JWT auth.
    """


REVIEW_STAGES: Sequence[str] = (
    VolunteerRecord.ReviewStage.STAGE1,
    VolunteerRecord.ReviewStage.STAGE2,
    VolunteerRecord.ReviewStage.STAGE3,
    VolunteerRecord.ReviewStage.COMPLETED,
)


def _next_stage(current: str) -> str:
    try:
        idx = REVIEW_STAGES.index(current)
    except ValueError:
        return VolunteerRecord.ReviewStage.STAGE1
    if idx >= len(REVIEW_STAGES) - 1:
        return VolunteerRecord.ReviewStage.COMPLETED
    return REVIEW_STAGES[idx + 1]


class TeacherProjectViewSet(viewsets.ModelViewSet):
    serializer_class = TeacherProjectSerializer
    permission_classes = [DemoFriendlyPermission]

    def get_queryset(self):
        queryset = TeacherProject.objects.all().order_by("-created_at")
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset


class ProjectSelectionViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSelectionSerializer
    permission_classes = [DemoFriendlyPermission]
    queryset = ProjectSelection.objects.select_related("project").all()

    def get_queryset(self):
        queryset = super().get_queryset()
        student_account = self.request.query_params.get("student_account")
        if student_account:
            queryset = queryset.filter(student_account=student_account)
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def perform_create(self, serializer):
        project = serializer.validated_data["project"]
        student_account = serializer.validated_data.get("student_account")
        if not student_account:
            raise ValidationError("学生账号不能为空。")
        if project.status != TeacherProject.ProjectStatus.ACTIVE:
            raise ValidationError("该项目暂未开放报名，请选择其他项目。")
        if project.selected_count >= project.slots:
            raise ValidationError("该项目名额已满，请选择其他项目。")
        existing = ProjectSelection.objects.filter(
            project=project,
            student_account=student_account,
            status=ProjectSelection.SelectionStatus.ACTIVE,
        ).exists()
        if existing:
            raise ValidationError("您已报名该项目，请勿重复提交。")
        try:
            with transaction.atomic():
                serializer.save(status=ProjectSelection.SelectionStatus.ACTIVE)
        except IntegrityError as exc:
            raise ValidationError("报名冲突，请稍后再试。") from exc

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        instance = self.get_object()
        instance.status = ProjectSelection.SelectionStatus.CANCELLED
        instance.save(update_fields=["status", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class VolunteerRecordViewSet(viewsets.ModelViewSet):
    serializer_class = VolunteerRecordSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    queryset = VolunteerRecord.objects.select_related("project").all()
    required_roles: Sequence[str] = ("teacher", "admin")

    def get_permissions(self):
        self.required_roles = self._required_roles_for_action()
        return [permission() for permission in self.permission_classes]

    def _required_roles_for_action(self) -> Sequence[str]:
        teacher_only = {"create", "update", "partial_update", "destroy", "review"}
        admin_only = {"override"}
        if self.action in admin_only:
            return ("admin",)
        if self.action in teacher_only:
            return ("teacher",)
        return ("teacher", "admin")

    def get_queryset(self):
        queryset = super().get_queryset()
        student_account = self.request.query_params.get("student_account")
        if student_account:
            queryset = queryset.filter(student_account=student_account)
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    def perform_create(self, serializer):
        submitted_via = serializer.validated_data.get("submitted_via") or VolunteerRecord.SubmitChannel.STUDENT
        serializer.save(
            submitted_via=submitted_via,
            status=VolunteerRecord.ReviewStatus.PENDING,
            review_stage=VolunteerRecord.ReviewStage.STAGE1,
            review_trail=[],
        )

    def update(self, request: Request, *args, **kwargs):
        kwargs["partial"] = False
        return self._update(request, *args, **kwargs)

    def partial_update(self, request: Request, *args, **kwargs):
        kwargs["partial"] = True
        return self._update(request, *args, **kwargs)

    def _update(self, request: Request, *args, **kwargs):
        instance = self.get_object()
        if not (
            instance.submitted_via == VolunteerRecord.SubmitChannel.STUDENT
            and instance.status == VolunteerRecord.ReviewStatus.PENDING
        ):
            return Response(
                {"detail": "仅待审的学生提交记录允许修改。"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        response = super().update(request, *args, **kwargs)
        instance.refresh_from_db()
        instance.review_stage = VolunteerRecord.ReviewStage.STAGE1
        instance.status = VolunteerRecord.ReviewStatus.PENDING
        instance.review_trail = []
        instance.save(update_fields=["review_stage", "status", "review_trail", "updated_at"])
        response.data = VolunteerRecordSerializer(instance, context=self.get_serializer_context()).data
        return response

    def destroy(self, request: Request, *args, **kwargs):
        instance = self.get_object()
        if not (
            instance.submitted_via == VolunteerRecord.SubmitChannel.STUDENT
            and instance.status == VolunteerRecord.ReviewStatus.PENDING
        ):
            return Response(
                {"detail": "仅待审的学生提交记录允许删除。"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def review(self, request: Request, pk: str | None = None) -> Response:
        serializer = ReviewDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        instance = self.get_object()
        decision = payload["decision"]
        reviewer = payload.get("reviewer") or "系统"
        note = payload.get("note") or ""
        if decision == "reject":
            instance.status = VolunteerRecord.ReviewStatus.REJECTED
            instance.review_notes = note
        elif decision == "reset":
            instance.review_stage = VolunteerRecord.ReviewStage.STAGE1
            instance.status = VolunteerRecord.ReviewStatus.PENDING
            instance.review_notes = note
            instance.review_trail = []
        else:
            next_stage = _next_stage(instance.review_stage)
            instance.review_stage = next_stage
            if next_stage == VolunteerRecord.ReviewStage.COMPLETED:
                instance.status = VolunteerRecord.ReviewStatus.APPROVED
            instance.review_notes = note
        logs = list(instance.review_trail or [])
        logs.append(
            {
                "stage": instance.review_stage,
                "reviewer": reviewer,
                "note": note,
                "timestamp": timezone.now().isoformat(),
            }
        )
        instance.review_trail = logs
        instance.save(update_fields=["review_stage", "status", "review_notes", "review_trail", "updated_at"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def override(self, request: Request, pk: str | None = None) -> Response:
        serializer = OverrideDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        instance = self.get_object()
        if instance.status == VolunteerRecord.ReviewStatus.PENDING:
            return Response(
                {"detail": "待审核任务需由教师处理，管理员不可直接审核。"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        action = payload["action"]
        note = payload.get("note") or ""
        reviewer = getattr(request.user, "username", "admin")
        logs = list(instance.review_trail or [])
        if action == "reopen":
            instance.review_stage = VolunteerRecord.ReviewStage.STAGE1
            instance.status = VolunteerRecord.ReviewStatus.PENDING
            instance.review_notes = note
            logs = []
        else:
            instance.status = VolunteerRecord.ReviewStatus.CANCELLED
            instance.review_notes = note
        logs.append(
            {
                "stage": instance.review_stage,
                "reviewer": reviewer,
                "note": f"管理员复核：{note}" if note else "管理员复核",
                "timestamp": timezone.now().isoformat(),
            }
        )
        instance.review_trail = logs
        instance.save(update_fields=["review_stage", "status", "review_notes", "review_trail", "updated_at"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class StudentReviewTicketViewSet(viewsets.ModelViewSet):
    serializer_class = StudentReviewTicketSerializer
    permission_classes = [permissions.IsAuthenticated, RolePermission]
    queryset = StudentReviewTicket.objects.all()
    required_roles: Sequence[str] = ("teacher", "admin")

    def get_permissions(self):
        self.required_roles = self._required_roles_for_action()
        return [permission() for permission in self.permission_classes]

    def _required_roles_for_action(self) -> Sequence[str]:
        teacher_only = {"create", "update", "partial_update", "destroy", "review"}
        admin_only = {"override"}
        if self.action in admin_only:
            return ("admin",)
        if self.action in teacher_only:
            return ("teacher",)
        return ("teacher", "admin")

    @action(detail=True, methods=["post"])
    def review(self, request: Request, pk: str | None = None) -> Response:
        serializer = ReviewDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        instance = self.get_object()
        decision = payload["decision"]
        reviewer = payload.get("reviewer") or "系统"
        note = payload.get("note") or ""
        if decision == "reject":
            instance.status = StudentReviewTicket.ReviewStatus.REJECTED
            instance.review_notes = note
        elif decision == "reset":
            instance.review_stage = StudentReviewTicket.ReviewStage.STAGE1
            instance.status = StudentReviewTicket.ReviewStatus.PENDING
            instance.review_notes = note
            instance.review_trail = []
        else:
            next_stage = _next_stage(instance.review_stage)
            instance.review_stage = next_stage
            if next_stage == StudentReviewTicket.ReviewStage.COMPLETED:
                instance.status = StudentReviewTicket.ReviewStatus.APPROVED
            instance.review_notes = note
        logs = list(instance.review_trail or [])
        logs.append(
            {
                "stage": instance.review_stage,
                "reviewer": reviewer,
                "note": note,
                "timestamp": timezone.now().isoformat(),
            }
        )
        instance.review_trail = logs
        instance.save(update_fields=["review_stage", "status", "review_notes", "review_trail", "updated_at"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def override(self, request: Request, pk: str | None = None) -> Response:
        serializer = OverrideDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        instance = self.get_object()
        if instance.status == StudentReviewTicket.ReviewStatus.PENDING:
            return Response(
                {"detail": "待审核任务需由教师处理，管理员不可直接审核。"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        action = payload["action"]
        note = payload.get("note") or ""
        reviewer = getattr(request.user, "username", "admin")
        logs = list(instance.review_trail or [])
        if action == "reopen":
            instance.review_stage = StudentReviewTicket.ReviewStage.STAGE1
            instance.status = StudentReviewTicket.ReviewStatus.PENDING
            instance.review_notes = note
            logs = []
        else:
            instance.status = StudentReviewTicket.ReviewStatus.CANCELLED
            instance.review_notes = note
        logs.append(
            {
                "stage": instance.review_stage,
                "reviewer": reviewer,
                "note": f"管理员复核：{note}" if note else "管理员复核",
                "timestamp": timezone.now().isoformat(),
            }
        )
        instance.review_trail = logs
        instance.save(update_fields=["review_stage", "status", "review_notes", "review_trail", "updated_at"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
