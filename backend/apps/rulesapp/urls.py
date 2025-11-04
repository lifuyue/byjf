from __future__ import annotations

from django.urls import path

from . import views

app_name = "rulesapp"

urlpatterns = [
    path("placeholder/", views.RulePlaceholderView.as_view(), name="placeholder"),
]
