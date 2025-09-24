from __future__ import annotations

from django.urls import path

from . import views

app_name = "scoringapp"

urlpatterns = [
    path("placeholder/", views.ScorePreviewView.as_view(), name="placeholder"),
]
