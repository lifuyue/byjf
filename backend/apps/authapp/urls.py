from __future__ import annotations

from django.urls import path

from . import views

app_name = "authapp"

urlpatterns = [
    path("login/", views.JwtLoginView.as_view(), name="login"),
    path("refresh/", views.JwtRefreshView.as_view(), name="refresh"),
]
