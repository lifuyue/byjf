from __future__ import annotations

from django.urls import path

from . import views

app_name = "filesapp"

urlpatterns = [
    path("placeholder/", views.FileUploadPlaceholderView.as_view(), name="placeholder"),
]
