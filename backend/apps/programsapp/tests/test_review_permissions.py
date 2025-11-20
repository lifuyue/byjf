from __future__ import annotations

from decimal import Decimal

import pytest

from apps.programsapp.models import VolunteerRecord


@pytest.mark.django_db
def test_teacher_can_review_volunteer(api_client, teacher_user):
    record = VolunteerRecord.objects.create(
        student_name="李华",
        student_account="lihua@example.com",
        activity="社区服务",
        hours=Decimal("2.0"),
        proof="",
        require_ocr=False,
        status=VolunteerRecord.ReviewStatus.PENDING,
        review_stage=VolunteerRecord.ReviewStage.STAGE1,
    )
    api_client.force_authenticate(user=teacher_user)

    response = api_client.post(
        f"/api/v1/programs/volunteer-records/{record.id}/review/",
        {"decision": "advance", "reviewer": teacher_user.username, "note": "looks good"},
        format="json",
    )

    assert response.status_code == 200
    record.refresh_from_db()
    assert record.review_stage == VolunteerRecord.ReviewStage.STAGE2
    assert record.status == VolunteerRecord.ReviewStatus.PENDING
    assert len(record.review_trail) == 1
    assert record.review_trail[0]["reviewer"] == teacher_user.username


@pytest.mark.django_db
def test_admin_cannot_review_volunteer(api_client, admin_user):
    record = VolunteerRecord.objects.create(
        student_name="王敏",
        student_account="wangmin@example.com",
        activity="实验室志愿",
        hours=Decimal("3.0"),
        proof="",
        require_ocr=False,
        status=VolunteerRecord.ReviewStatus.PENDING,
        review_stage=VolunteerRecord.ReviewStage.STAGE1,
    )
    api_client.force_authenticate(user=admin_user)

    response = api_client.post(
        f"/api/v1/programs/volunteer-records/{record.id}/review/",
        {"decision": "advance", "reviewer": admin_user.username, "note": "should be allowed?"},
        format="json",
    )

    assert response.status_code == 403
    record.refresh_from_db()
    assert record.review_stage == VolunteerRecord.ReviewStage.STAGE1
    assert record.status == VolunteerRecord.ReviewStatus.PENDING


@pytest.mark.django_db
def test_admin_can_override_reviewed_record(api_client, admin_user):
    record = VolunteerRecord.objects.create(
        student_name="赵六",
        student_account="zhaoliu@example.com",
        activity="科研助理",
        hours=Decimal("4.0"),
        proof="",
        require_ocr=False,
        status=VolunteerRecord.ReviewStatus.APPROVED,
        review_stage=VolunteerRecord.ReviewStage.COMPLETED,
        review_notes="老师审核通过",
        review_trail=[
            {"stage": "completed", "reviewer": "teacherA", "note": "ok", "timestamp": "2024-05-01T10:00:00Z"}
        ],
    )
    api_client.force_authenticate(user=admin_user)

    response = api_client.post(
        f"/api/v1/programs/volunteer-records/{record.id}/override/",
        {"action": "reopen", "note": "发现材料缺失，需复核"},
        format="json",
    )

    assert response.status_code == 200
    record.refresh_from_db()
    assert record.status == VolunteerRecord.ReviewStatus.PENDING
    assert record.review_stage == VolunteerRecord.ReviewStage.STAGE1
    assert record.review_trail
    assert record.review_trail[-1]["note"].startswith("管理员复核")
