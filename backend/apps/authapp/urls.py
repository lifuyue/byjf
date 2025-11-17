from __future__ import annotations

from django.urls import path

from . import views

app_name = "authapp"

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.JwtLoginView.as_view(), name="login"),
    path("refresh/", views.JwtRefreshView.as_view(), name="refresh"),
    path("me/", views.CurrentUserView.as_view(), name="me"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change-password"),
]
