"""URL configuration for PG-Plus."""
from __future__ import annotations

from django.contrib import admin
from django.urls import include, path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health(_: object) -> Response:
    """Simple health endpoint for probes."""
    return Response({"status": "ok"})


api_v1_patterns = [
    path("auth/", include("apps.authapp.urls")),
    path("files/", include("apps.filesapp.urls")),
    path("rules/", include("apps.rulesapp.urls")),
    path("scoring/", include("apps.scoringapp.urls")),
    path("policies/", include("apps.policiesapp.urls")),
    path("dicts/", include("apps.dictsapp.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/v1/", include(api_v1_patterns)),
]
