from __future__ import annotations

from rest_framework.routers import DefaultRouter

from .views import (
    ProjectSelectionViewSet,
    StudentReviewTicketViewSet,
    TeacherProjectViewSet,
    VolunteerRecordViewSet,
)

router = DefaultRouter()
router.register("projects", TeacherProjectViewSet, basename="program-projects")
router.register("selections", ProjectSelectionViewSet, basename="program-selections")
router.register("volunteer-records", VolunteerRecordViewSet, basename="program-volunteers")
router.register("student-reviews", StudentReviewTicketViewSet, basename="program-student-reviews")

urlpatterns = router.urls
