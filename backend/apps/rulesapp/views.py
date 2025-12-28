from __future__ import annotations

from typing import TYPE_CHECKING, Any, cast

from django.contrib.auth.models import AnonymousUser
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer
from rest_framework.views import APIView

from apps.authapp.permissions import RolePermission

from .models import Policy, ProofReview, ScoreCategoryRule, ScoreLimit
from .serializers import PolicySerializer, ProofReviewSerializer, ScoreCategoryRuleSerializer, ScoreLimitSerializer

if TYPE_CHECKING:
    from apps.scoringapp.models import Student


class ScoreLimitView(APIView):
    """GET 返回当前分数上限；PUT 由管理员修改。"""

    permission_classes = (IsAdminUser,)

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        obj = ScoreLimit.objects.first()
        serializer = ScoreLimitSerializer(obj)
        return Response(serializer.data)

    def put(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        obj = ScoreLimit.objects.first()
        if not obj:
            obj = ScoreLimit()
        serializer = ScoreLimitSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ScoreCategoryRuleView(APIView):
    """配置加分类别上限与比例。"""

    permission_classes = (IsAuthenticated, RolePermission)
    required_roles = ("admin",)

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        rules = ScoreCategoryRule.objects.order_by("order", "id")
        serializer = ScoreCategoryRuleSerializer(rules, many=True)
        return Response(serializer.data)

    def put(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        payload = request.data
        if not isinstance(payload, list):
            return Response({"detail": "请求体必须为数组"}, status=status.HTTP_400_BAD_REQUEST)

        cleaned: list[dict[str, Any]] = []
        seen_names: set[str] = set()
        total_ratio = 0
        for index, item in enumerate(payload):
            if not isinstance(item, dict):
                return Response({"detail": "每条规则必须是对象"}, status=status.HTTP_400_BAD_REQUEST)
            name = str(item.get("name", "")).strip()
            if not name:
                return Response({"detail": "分类名称不能为空"}, status=status.HTTP_400_BAD_REQUEST)
            if name in seen_names:
                return Response({"detail": f"分类名称重复: {name}"}, status=status.HTTP_400_BAD_REQUEST)
            seen_names.add(name)

            try:
                cap = float(item.get("cap", 0))
            except (TypeError, ValueError):
                return Response({"detail": f"{name} 上限必须是数字"}, status=status.HTTP_400_BAD_REQUEST)
            if cap < 0:
                return Response({"detail": f"{name} 上限不能为负"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                ratio = int(item.get("ratio", 0))
            except (TypeError, ValueError):
                return Response({"detail": f"{name} 比例必须是整数"}, status=status.HTTP_400_BAD_REQUEST)
            if ratio < 0 or ratio > 100:
                return Response({"detail": f"{name} 比例需在 0-100 之间"}, status=status.HTTP_400_BAD_REQUEST)

            total_ratio += ratio
            cleaned.append({"name": name, "cap": cap, "ratio": ratio, "order": index + 1})

        if cleaned and total_ratio != 100:
            return Response({"detail": "所有加分比例之和必须为 100%"}, status=status.HTTP_400_BAD_REQUEST)

        ScoreCategoryRule.objects.all().delete()
        if cleaned:
            ScoreCategoryRule.objects.bulk_create([ScoreCategoryRule(**item) for item in cleaned])
        rules = ScoreCategoryRule.objects.order_by("order", "id")
        serializer = ScoreCategoryRuleSerializer(rules, many=True)
        return Response(serializer.data)


class PolicyUploadView(generics.ListCreateAPIView):
    """管理员可上传政策文件并列出已有文件。"""

    permission_classes = (IsAdminUser,)
    queryset = Policy.objects.all().order_by('-uploaded_at')
    serializer_class = PolicySerializer

    def perform_create(self, serializer: BaseSerializer[Any]) -> None:
        serializer.save(uploaded_by=self.request.user)


class ProofReviewView(APIView):
    """审核学生上传证明：教师或管理员可以批准或驳回。

    POST payload:
      - content_type: model name (例如 academicexpertise 或 comprehensiveperformance)
      - object_id: 目标对象 id
      - action: 'approve' 或 'reject'
      - reason: 当 action=='reject' 时可选但推荐
    """

    permission_classes = (IsAuthenticated,)

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        user = request.user
        if isinstance(user, AnonymousUser):
            return Response({"detail": "用户未认证"}, status=status.HTTP_401_UNAUTHORIZED)
        typed_user = cast("Student", user)
        # 仅允许 教师（role=='teacher'）/staff 或 superuser 操作（教师/管理员）
        if not (getattr(typed_user, 'role', None) == 'teacher' or typed_user.is_staff or typed_user.is_superuser):
            return Response({"detail": "权限不足"}, status=status.HTTP_403_FORBIDDEN)

        content_type_label = request.data.get("content_type")
        object_id_raw = request.data.get("object_id")
        action = request.data.get("action")
        reason = request.data.get("reason")

        if not content_type_label or object_id_raw is None or not action:
            return Response({"detail": "content_type、object_id 和 action 为必填字段"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            object_id = int(object_id_raw)
        except (TypeError, ValueError):
            return Response({"detail": "object_id 需要是整数"}, status=status.HTTP_400_BAD_REQUEST)

        # 支持传入 model 名或 app_label.model
        try:
            if "." in content_type_label:
                app_label, model = content_type_label.split(".")
                ct = ContentType.objects.get(app_label=app_label, model=model)
            else:
                ct = ContentType.objects.get(model=content_type_label)
        except ContentType.DoesNotExist:
            return Response({"detail": "未识别的 content_type"}, status=status.HTTP_400_BAD_REQUEST)

        # 获取目标实例
        model_cls = ct.model_class()
        if not model_cls:
            return Response({"detail": "目标模型不存在"}, status=status.HTTP_400_BAD_REQUEST)

        obj = get_object_or_404(model_cls, pk=object_id)

        # 确保目标对象属于某个学生（有 student 属性）
        student = getattr(obj, "student", None)
        if student is None:
            return Response({"detail": "目标对象不属于学生或不包含 student 字段"}, status=status.HTTP_400_BAD_REQUEST)

        # 获取文件路径（若存在）
        file_field = getattr(obj, "material", None)
        file_path: str | None = None
        if file_field:
            file_path = file_field.name

        # 新建 ProofReview 记录
        review = ProofReview.objects.create(
            content_type=ct,
            object_id=obj.pk,
            student=student,
            file_path=file_path,
            status=ProofReview.STATUS_PENDING,
        )

        if action == "approve":
            review.mark_approved(reviewer=typed_user)
            return Response({"detail": "已通过"}, status=status.HTTP_200_OK)
        elif action == "reject":
            # 删除文件并清空字段
            if file_field:
                try:
                    file_field.delete(save=False)
                except Exception:
                    # 如果删除失败也继续，并在记录中保留 reason
                    pass
                # 将字段置空
                try:
                    setattr(obj, "material", None)
                    obj.save(update_fields=["material"])
                except Exception:
                    # 忽略不能保存的情况
                    pass

            review.mark_rejected(reviewer=typed_user, reason=reason)
            return Response({"detail": "已驳回", "reason": reason}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "未知的 action，须为 'approve' 或 'reject'"}, status=status.HTTP_400_BAD_REQUEST)
