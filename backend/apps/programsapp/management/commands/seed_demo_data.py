from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_date

from apps.programsapp.models import (
    ProjectSelection,
    StudentReviewTicket,
    TeacherProject,
    VolunteerRecord,
)
from apps.scoringapp.models import Student

TEACHER_PROJECTS: list[dict[str, Any]] = [
    {
        "id": "proj-research-2024",
        "title": "科研助理计划",
        "description": "参与导师课题，完成阶段任务并通过验收后即可获得对应加分。",
        "points": 12,
        "deadline": "2024-06-30",
        "slots": 15,
        "status": TeacherProject.ProjectStatus.ACTIVE,
    },
    {
        "id": "proj-mentor-2024",
        "title": "创新创业工作坊",
        "description": "导师团队带领完成创新课题，提交结题报告即可申请加分。",
        "points": 10,
        "deadline": "2024-07-15",
        "slots": 20,
        "status": TeacherProject.ProjectStatus.ACTIVE,
    },
]

PROJECT_SELECTIONS: list[dict[str, Any]] = [
    {"project_id": "proj-research-2024", "student_name": "李华", "student_account": "lihua@example.com"},
    {"project_id": "proj-research-2024", "student_name": "王敏", "student_account": "wangmin@example.com"},
    {"project_id": "proj-research-2024", "student_name": "张伟", "student_account": "zhangwei@example.com"},
    {"project_id": "proj-mentor-2024", "student_name": "陈晓", "student_account": "chenxiao@example.com"},
    {"project_id": "proj-mentor-2024", "student_name": "赵强", "student_account": "zhaoqiang@example.com"},
    {"project_id": "proj-mentor-2024", "student_name": "杨柳", "student_account": "yangliu@example.com"},
    {"project_id": "proj-mentor-2024", "student_name": "孙倩", "student_account": "sunqian@example.com"},
    {"project_id": "proj-mentor-2024", "student_name": "周凯", "student_account": "zhoukai@example.com"},
]

VOLUNTEER_RECORDS: list[dict[str, Any]] = [
    {
        "id": "vol-2024-001",
        "student_name": "李华",
        "student_account": "lihua@example.com",
        "activity": "社区图书整理",
        "hours": Decimal("6"),
        "proof": "凭证 #A2024",
        "require_ocr": False,
        "status": VolunteerRecord.ReviewStatus.APPROVED,
        "review_stage": VolunteerRecord.ReviewStage.COMPLETED,
        "review_trail": [
            {"stage": "stage1", "reviewer": "张老师", "note": "资料完整", "timestamp": "2024-04-15T10:00:00.000Z"},
            {"stage": "stage2", "reviewer": "李老师", "note": "符合政策", "timestamp": "2024-04-16T09:00:00.000Z"},
            {"stage": "stage3", "reviewer": "王老师", "note": "通过终审", "timestamp": "2024-04-18T09:00:00.000Z"},
        ],
        "review_notes": "资料齐全，已计入学时",
        "submitted_via": VolunteerRecord.SubmitChannel.TEACHER,
    },
    {
        "id": "vol-2024-002",
        "student_name": "王敏",
        "student_account": "wangmin@example.com",
        "activity": "敬老院陪伴",
        "hours": Decimal("4"),
        "proof": "扫描件待识别",
        "require_ocr": True,
        "status": VolunteerRecord.ReviewStatus.PENDING,
        "review_stage": VolunteerRecord.ReviewStage.STAGE1,
        "review_trail": [
            {"stage": "stage1", "reviewer": "系统", "note": "等待一审", "timestamp": "2024-04-20T12:00:00.000Z"},
        ],
        "review_notes": "",
        "submitted_via": VolunteerRecord.SubmitChannel.STUDENT,
    },
]

STUDENT_REVIEW_TICKETS: list[dict[str, Any]] = [
    {
        "id": "stu-approve-001",
        "student_name": "张明",
        "student_id": "2021012345",
        "college": "计算机科学与技术学院",
        "major": "计算机科学与技术",
        "review_stage": "stage2",
        "status": "pending",
        "review_trail": [
            {"stage": "stage1", "reviewer": "学院初审", "note": "资料齐全", "timestamp": "2024-04-10T09:00:00.000Z"},
        ],
        "review_notes": "待二审",
    },
    {
        "id": "stu-approve-002",
        "student_name": "李四",
        "student_id": "202101002",
        "college": "计算机科学与技术学院",
        "major": "计算机科学与技术",
        "review_stage": "stage1",
        "status": "pending",
        "review_trail": [],
        "review_notes": "等待一审",
    },
    {
        "id": "stu-approved-003",
        "student_name": "王五",
        "student_id": "202001002",
        "college": "软件学院",
        "major": "软件工程",
        "review_stage": "completed",
        "status": "approved",
        "review_trail": [
            {"stage": "stage1", "reviewer": "学院", "note": "通过", "timestamp": "2024-04-01T09:00:00.000Z"},
            {"stage": "stage2", "reviewer": "学校", "note": "通过", "timestamp": "2024-04-03T09:00:00.000Z"},
            {"stage": "stage3", "reviewer": "终审", "note": "通过", "timestamp": "2024-04-05T09:00:00.000Z"},
        ],
        "review_notes": "终审通过",
    },
]

DEMO_ACCOUNTS = [
    {
        "username": "student001",
        "student_id": "20250001",
        "role": Student.ROLE_STUDENT,
        "password": "Passw0rd!",
    },
    {
        "username": "teacher001",
        "student_id": "T2025001",
        "role": Student.ROLE_TEACHER,
        "password": "Passw0rd!",
    },
    {
        "username": "admin001",
        "student_id": "A2025001",
        "role": Student.ROLE_ADMIN,
        "password": "Passw0rd!",
    },
]


class Command(BaseCommand):
    help = "将前端 mock 数据同步至数据库，便于演示。"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="清空现有数据后重新写入。",
        )

    def handle(self, *args, **options):
        if options.get("force"):
            self.stdout.write(self.style.WARNING("清空 programsapp 表..."))
            ProjectSelection.objects.all().delete()
            VolunteerRecord.objects.all().delete()
            TeacherProject.objects.all().delete()
            StudentReviewTicket.objects.all().delete()

        self._seed_accounts()
        self._seed_projects()
        self._seed_selections()
        self._seed_volunteers()
        self._seed_student_reviews()
        self.stdout.write(self.style.SUCCESS("示例数据准备完成。"))

    def _seed_projects(self) -> None:
        for payload in TEACHER_PROJECTS:
            deadline = parse_date(payload.get("deadline")) if payload.get("deadline") else None
            TeacherProject.objects.update_or_create(
                id=payload["id"],
                defaults={
                    "title": payload["title"],
                    "description": payload["description"],
                    "points": payload["points"],
                    "deadline": deadline,
                    "slots": payload["slots"],
                    "status": payload.get("status", TeacherProject.ProjectStatus.ACTIVE),
                },
            )

    def _seed_selections(self) -> None:
        for payload in PROJECT_SELECTIONS:
            project = TeacherProject.objects.filter(id=payload["project_id"]).first()
            if not project:
                continue
            ProjectSelection.objects.update_or_create(
                project=project,
                student_account=payload["student_account"],
                defaults={
                    "student_name": payload["student_name"],
                    "status": ProjectSelection.SelectionStatus.ACTIVE,
                },
            )

    def _seed_volunteers(self) -> None:
        for payload in VOLUNTEER_RECORDS:
            VolunteerRecord.objects.update_or_create(
                id=payload["id"],
                defaults={
                    "student_name": payload["student_name"],
                    "student_account": payload["student_account"],
                    "activity": payload["activity"],
                    "hours": payload["hours"],
                    "proof": payload["proof"],
                    "require_ocr": payload["require_ocr"],
                    "status": payload["status"],
                    "review_stage": payload["review_stage"],
                    "review_trail": payload["review_trail"],
                    "review_notes": payload["review_notes"],
                    "submitted_via": payload["submitted_via"],
                },
            )

    def _seed_student_reviews(self) -> None:
        for payload in STUDENT_REVIEW_TICKETS:
            StudentReviewTicket.objects.update_or_create(
                id=payload["id"],
                defaults={
                    "student_name": payload["student_name"],
                    "student_id": payload["student_id"],
                    "college": payload["college"],
                    "major": payload["major"],
                    "review_stage": payload["review_stage"],
                    "status": payload["status"],
                    "review_trail": payload["review_trail"],
                    "review_notes": payload["review_notes"],
                },
            )

    def _seed_accounts(self) -> None:
        for payload in DEMO_ACCOUNTS:
            student, _ = Student.objects.update_or_create(
                username=payload["username"],
                defaults={
                    "student_id": payload["student_id"],
                    "role": payload["role"],
                },
            )
            student.role = payload["role"]
            if payload["role"] in (Student.ROLE_TEACHER, Student.ROLE_ADMIN):
                student.is_staff = True
            if payload["role"] == Student.ROLE_ADMIN:
                student.is_superuser = True
            student.set_password(payload["password"])
            student.save()
