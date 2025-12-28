from __future__ import annotations

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("contenttypes", "0002_remove_content_type_name"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ScoreLimit",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("a_max", models.FloatField(default=80, verbose_name="学科成绩上限")),
                ("b_max", models.FloatField(default=15, verbose_name="学术专长上限")),
                ("c_max", models.FloatField(default=5, verbose_name="综合表现上限")),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "分数上限",
                "verbose_name_plural": "分数上限",
            },
        ),
        migrations.CreateModel(
            name="Policy",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255, verbose_name="标题")),
                ("file", models.FileField(upload_to="policies/", verbose_name="政策文件")),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="上传者",
                    ),
                ),
            ],
            options={
                "verbose_name": "保研政策",
                "verbose_name_plural": "保研政策",
            },
        ),
        migrations.CreateModel(
            name="ProofReview",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("object_id", models.PositiveIntegerField()),
                ("file_path", models.CharField(blank=True, max_length=1024, null=True, verbose_name="文件路径")),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "待审核"), ("approved", "通过"), ("rejected", "不通过")],
                        default="pending",
                        max_length=32,
                        verbose_name="审核状态",
                    ),
                ),
                ("reason", models.TextField(blank=True, null=True, verbose_name="不通过原因")),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "content_type",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="contenttypes.contenttype"),
                ),
                (
                    "reviewer",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reviews_done",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="审核者",
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="proof_reviews",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="学生",
                    ),
                ),
            ],
            options={
                "verbose_name": "证明审核",
                "verbose_name_plural": "证明审核",
            },
        ),
    ]
