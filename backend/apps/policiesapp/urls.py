from __future__ import annotations

from django.urls import path

from . import views

app_name = "policiesapp"

urlpatterns = [
    path("tags/", views.PolicyTagListView.as_view(), name="tags"),
    path("", views.PolicyListCreateView.as_view(), name="list"),
    path("<int:pk>/", views.PolicyDetailView.as_view(), name="detail"),
]
