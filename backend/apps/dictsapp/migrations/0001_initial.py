from typing import Any

from django.db import migrations, models


def seed_dict_entries(apps: Any, schema_editor: Any) -> None:
    DictEntry = apps.get_model("dictsapp", "DictEntry")
    seeds = [
        # 专业类别
        ("major_category", "cs", "计算机类", 1),
        ("major_category", "ee", "电子信息类", 2),
        ("major_category", "math", "数学类", 3),
        # 竞赛类型
        ("competition_type", "acm", "ACM/编程竞赛", 1),
        ("competition_type", "math", "数学建模/数学竞赛", 2),
        ("competition_type", "innovation", "创新创业竞赛", 3),
        # 政策标签
        ("policy_tag", "general", "通用政策", 1),
        ("policy_tag", "college", "学院政策", 2),
        ("policy_tag", "scholarship", "奖学金/资助", 3),
    ]
    for category, code, name, order in seeds:
        DictEntry.objects.get_or_create(
            category=category,
            code=code,
            defaults={"name": name, "order": order, "is_active": True},
        )


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="DictEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("category", models.CharField(db_index=True, max_length=64)),
                ("code", models.CharField(max_length=64)),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True, null=True)),
                ("order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "字典项",
                "verbose_name_plural": "字典项",
                "ordering": ("category", "order", "code"),
                "unique_together": {("category", "code")},
            },
        ),
        migrations.RunPython(seed_dict_entries, migrations.RunPython.noop),
    ]
