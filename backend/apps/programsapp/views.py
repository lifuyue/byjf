from __future__ import annotations

from typing import Sequence

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from .models import (
    ProjectSelection,
    StudentReviewTicket,
    TeacherProject,
    VolunteerRecord,
)
from .serializers import (
    ProjectSelectionSerializer,
    ReviewDecisionSerializer,
    StudentReviewTicketSerializer,
    TeacherProjectSerializer,
    VolunteerRecordSerializer,
)
from apps.scoringapp.models import Student


class IsTeacherOrAdmin(permissions.BasePermission):
    """
    检查用户是否为教师或管理员角色
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in [Student.ROLE_TEACHER, Student.ROLE_ADMIN]


class IsStudentOrReadOnly(permissions.BasePermission):
    """
    学生可以读取和创建自己的记录，但只能修改自己的待审核记录
    """
    def has_permission(self, request, view):
        # 只读操作允许所有已认证用户
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        # POST操作允许所有已认证用户
        if request.method == 'POST':
            return request.user.is_authenticated
        return False
    
    def has_object_permission(self, request, view, obj):
        # 只有学生可以修改自己的记录，并且记录必须是待审核状态
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            # 检查是否是本人的记录
            if hasattr(obj, 'student_account'):
                return obj.student_account == request.user.username
            return False
        return True


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
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = TeacherProject.objects.all().order_by("-created_at")
        # 学生只能看到已发布的项目
        if hasattr(self.request.user, 'role') and self.request.user.role == Student.ROLE_STUDENT:
            queryset = queryset.filter(status=TeacherProject.Status.PUBLISHED)
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset
    
    def get_permissions(self):
        # 创建项目需要教师或管理员权限
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]


class ProjectSelectionViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSelectionSerializer
    permission_classes = [IsStudentOrReadOnly]
    queryset = ProjectSelection.objects.select_related("project").all()

    def get_queryset(self):
        queryset = super().get_queryset()
        student_account = self.request.query_params.get("student_account")
        if student_account:
            queryset = queryset.filter(student_account=student_account)
        # 学生只能查看自己的选择记录
        if hasattr(self.request.user, 'role') and self.request.user.role == Student.ROLE_STUDENT:
            queryset = queryset.filter(student_account=self.request.user.username)
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        instance = self.get_object()
        instance.status = ProjectSelection.SelectionStatus.CANCELLED
        instance.save(update_fields=["status", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class VolunteerRecordViewSet(viewsets.ModelViewSet):
    serializer_class = VolunteerRecordSerializer
    permission_classes = [IsStudentOrReadOnly]
    queryset = VolunteerRecord.objects.select_related("project").all()

    def get_queryset(self):
        queryset = super().get_queryset()
        student_account = self.request.query_params.get("student_account")
        if student_account:
            queryset = queryset.filter(student_account=student_account)
        # 学生只能查看自己的志愿记录
        if hasattr(self.request.user, 'role') and self.request.user.role == Student.ROLE_STUDENT:
            queryset = queryset.filter(student_account=self.request.user.username)
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset
        
    def get_permissions(self):
        # 审核操作需要教师或管理员权限
        if self.action == 'review':
            return [IsTeacherOrAdmin()]
        return [IsStudentOrReadOnly()]

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


class StudentReviewTicketViewSet(viewsets.ModelViewSet):
    serializer_class = StudentReviewTicketSerializer
    permission_classes = [IsTeacherOrAdmin]
    queryset = StudentReviewTicket.objects.all()
    
    def get_permissions(self):
        # 学生可以提交审核申请
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        # 审核操作需要教师或管理员权限
        if self.action in ['review', 'update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        # 学生可以查看自己的申请
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsTeacherOrAdmin()]

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
