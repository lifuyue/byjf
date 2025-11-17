from typing import Any

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def seed_policy_tags(apps: Any, schema_editor: Any) -> None:
    PolicyTag = apps.get_model("policiesapp", "PolicyTag")
    defaults = [
        ("general", "通用政策", 1),
        ("college", "学院政策", 2),
        ("scholarship", "奖学金/资助", 3),
    ]
    for code, name, order in defaults:
        PolicyTag.objects.get_or_create(code=code, defaults={"name": name, "order": order})


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PolicyTag",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=64, unique=True)),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True, null=True)),
                ("order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={
                "verbose_name": "政策标签",
                "verbose_name_plural": "政策标签",
                "ordering": ("order", "code"),
            },
        ),
        migrations.CreateModel(
            name="Policy",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("summary", models.TextField(blank=True, null=True)),
                ("file", models.FileField(blank=True, null=True, upload_to="policies/")),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("tags", models.ManyToManyField(blank=True, related_name="policies", to="policiesapp.policytag")),
                ("uploaded_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="policies_uploaded", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "保研政策",
                "verbose_name_plural": "保研政策",
                "ordering": ("-created_at",),
            },
        ),
        migrations.RunPython(seed_policy_tags, migrations.RunPython.noop),
    ]
