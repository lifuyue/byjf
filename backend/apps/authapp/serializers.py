"""Serializers for authentication flows."""
from __future__ import annotations

from typing import Any, Dict, cast


from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import Token

from apps.scoringapp.models import Student
from .tokens import attach_user_claims


class UserProfileSerializer(serializers.ModelSerializer):
    """Lightweight serializer for returning user profile data."""

    class Meta:
        model = Student
        fields = (
            "id",
            "username",
            "student_id",
            "role",
            "is_staff",
            "is_superuser",
            "date_joined",
        )
        read_only_fields = fields


class RegistrationSerializer(serializers.ModelSerializer):
    """Handle student/teacher/admin registrations."""

    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(
        choices=Student.ROLE_CHOICES, default=Student.ROLE_STUDENT
    )

    class Meta:
        model = Student
        fields = ("username", "student_id", "password", "role")

    def create(self, validated_data: Dict[str, Any]) -> Student:
        password = validated_data.pop("password")
        role = validated_data.pop("role", Student.ROLE_STUDENT)
        return Student.objects.create_user(
            password=password,
            role=role,
            **validated_data,
        )

    def to_representation(self, instance: Student) -> Dict[str, Any]:
        return UserProfileSerializer(instance).data


class ChangePasswordSerializer(serializers.Serializer):
    """Validate current password and set a new password."""

    current_password = serializers.CharField(write_only=True, min_length=8)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value: str) -> str:
        user = cast(Student, self.context["request"].user)
        if not user.check_password(value):
            raise serializers.ValidationError("当前密码不正确。")
        return value

    def save(self, **kwargs: Any) -> Student:
        user = cast(Student, self.context["request"].user)
        new_password = self.validated_data["new_password"]
        user.set_password(new_password)
        user.save(update_fields=["password"])
        return user


class JwtTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Return token pair enriched with user profile."""

    @classmethod
    def get_token(cls, user: Any) -> Token:
        token = super().get_token(user)
        return attach_user_claims(token, user)

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        data = cast(Dict[str, Any], super().validate(attrs))
        data["user"] = UserProfileSerializer(self.user).data
        return data
