from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentViewSet, SubjectScoreViewSet,
    AcademicExpertiseViewSet, ComprehensivePerformanceViewSet
)

# 创建路由器并注册视图集
router = DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'subject-scores', SubjectScoreViewSet)
router.register(r'academic-expertises', AcademicExpertiseViewSet)
router.register(r'comprehensive-performances', ComprehensivePerformanceViewSet)

# API URL配置
urlpatterns = [
    path('', include(router.urls)),
]
