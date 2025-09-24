from __future__ import annotations

from django.urls import path

from . import views

app_name = "policiesapp"

urlpatterns = [
    path("placeholder/", views.PolicyPlaceholderView.as_view(), name="placeholder"),
]
