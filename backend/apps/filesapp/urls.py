from __future__ import annotations

from django.urls import path

from . import views

app_name = "filesapp"

urlpatterns = [
    path("", views.FileListView.as_view(), name="list"),
    path("upload/", views.FileUploadView.as_view(), name="upload"),
    path("<uuid:pk>/", views.FileDetailView.as_view(), name="detail"),
    path("<uuid:pk>/download/", views.FileDownloadView.as_view(), name="download"),
    path("<uuid:pk>/review/", views.FileReviewView.as_view(), name="review"),
]
