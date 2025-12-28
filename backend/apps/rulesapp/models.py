"""rulesapp 的模型：分数上限、政策文件与证明审核记录。"""
from __future__ import annotations

from typing import TYPE_CHECKING

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone

if TYPE_CHECKING:
	from apps.scoringapp.models import Student


class ScoreLimit(models.Model):
	"""全局分数上限设置（单例表，可由管理员修改）。"""

	a_max = models.FloatField(default=80, verbose_name="学科成绩上限")
	b_max = models.FloatField(default=15, verbose_name="学术专长上限")
	c_max = models.FloatField(default=5, verbose_name="综合表现上限")
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		verbose_name = "分数上限"
		verbose_name_plural = "分数上限"

	def __str__(self) -> str:  # pragma: no cover - trivial
		return f"ScoreLimit(a={self.a_max}, b={self.b_max}, c={self.c_max})"


class Policy(models.Model):
	"""学校保研加分政策文件。"""

	title = models.CharField(max_length=255, verbose_name="标题")
	file = models.FileField(upload_to="policies/", verbose_name="政策文件")
	uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, verbose_name="上传者")
	uploaded_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		verbose_name = "保研政策"
		verbose_name_plural = "保研政策"

	def __str__(self) -> str:  # pragma: no cover - trivial
		return self.title


class ProofReview(models.Model):
	"""记录学生上传证明的审核结果。

	使用 GenericForeignKey 将审核记录关联到任意带有 `material` 字段的模型（如 AcademicExpertise、ComprehensivePerformance）。
	"""

	STATUS_PENDING = "pending"
	STATUS_APPROVED = "approved"
	STATUS_REJECTED = "rejected"
	STATUS_CHOICES = [
		(STATUS_PENDING, "待审核"),
		(STATUS_APPROVED, "通过"),
		(STATUS_REJECTED, "不通过"),
	]

	content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
	object_id = models.PositiveIntegerField()
	content_object = GenericForeignKey("content_type", "object_id")

	student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="proof_reviews", verbose_name="学生")
	file_path = models.CharField(max_length=1024, null=True, blank=True, verbose_name="文件路径")

	status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_PENDING, verbose_name="审核状态")
	reason = models.TextField(null=True, blank=True, verbose_name="不通过原因")
	reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="reviews_done", verbose_name="审核者")
	reviewed_at = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		verbose_name = "证明审核"
		verbose_name_plural = "证明审核"

	def mark_approved(self, reviewer: "Student | None") -> None:
		self.status = self.STATUS_APPROVED
		self.reviewer = reviewer
		self.reviewed_at = timezone.now()
		self.save(update_fields=["status", "reviewer", "reviewed_at"])

	def mark_rejected(self, reviewer: "Student | None", reason: str | None = None) -> None:
		self.status = self.STATUS_REJECTED
		self.reason = reason
		self.reviewer = reviewer
		self.reviewed_at = timezone.now()
		self.save(update_fields=["status", "reason", "reviewer", "reviewed_at"])


class ScoreCategoryRule(models.Model):
	"""自定义加分类别规则（单类加分上限 + 加分比例）。"""

	name = models.CharField(max_length=120, unique=True, verbose_name="分类名称")
	cap = models.FloatField(default=0, verbose_name="单类加分上限")
	ratio = models.PositiveIntegerField(default=0, verbose_name="加分比例(%)")
	order = models.PositiveIntegerField(default=0, verbose_name="排序权重")
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		verbose_name = "加分类别规则"
		verbose_name_plural = "加分类别规则"

	def __str__(self) -> str:  # pragma: no cover - trivial
		return f"{self.name}({self.ratio}%)"
