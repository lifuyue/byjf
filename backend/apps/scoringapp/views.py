from __future__ import annotations

from rest_framework import permissions, viewsets
from rest_framework.parsers import FormParser, MultiPartParser

from .models import AcademicExpertise, ComprehensivePerformance, Student, SubjectScore
from .serializers import (
    AcademicExpertiseSerializer,
    ComprehensivePerformanceSerializer,
    StudentSerializer,
    SubjectScoreSerializer,
)

class StudentViewSet(viewsets.ModelViewSet):
    """
    学生信息视图集，提供CRUD操作
    支持文件上传
    """
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self) -> list[permissions.BasePermission]:
        """允许未认证用户进行注册（create），其他操作仍需认证"""
        # self.action 在 viewset 中指示正在执行的动作（'create','list','retrieve','update'等）
        if getattr(self, 'action', None) == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

class SubjectScoreViewSet(viewsets.ModelViewSet):
    """学科成绩视图集"""
    queryset = SubjectScore.objects.all()
    serializer_class = SubjectScoreSerializer
    permission_classes = [permissions.IsAuthenticated]

class AcademicExpertiseViewSet(viewsets.ModelViewSet):
    """学术专长视图集"""
    queryset = AcademicExpertise.objects.all()
    serializer_class = AcademicExpertiseSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

class ComprehensivePerformanceViewSet(viewsets.ModelViewSet):
    """综合表现视图集"""
    queryset = ComprehensivePerformance.objects.all()
    serializer_class = ComprehensivePerformanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
