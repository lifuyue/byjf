from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("rulesapp", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ScoreCategoryRule",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, unique=True, verbose_name="分类名称")),
                ("cap", models.FloatField(default=0, verbose_name="单类加分上限")),
                ("ratio", models.PositiveIntegerField(default=0, verbose_name="加分比例(%)")),
                ("order", models.PositiveIntegerField(default=0, verbose_name="排序权重")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "加分类别规则",
                "verbose_name_plural": "加分类别规则",
            },
        ),
    ]
