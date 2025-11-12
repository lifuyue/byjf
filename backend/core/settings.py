"""PG-Plus 脚手架的 Django 配置。"""
from __future__ import annotations

import os
import sys
from datetime import timedelta
from pathlib import Path

from django.core.management.utils import get_random_secret_key

BASE_DIR = Path(__file__).resolve().parent.parent

# Core switches
SECRET_KEY = os.environ.get("PG_PLUS_SECRET_KEY", get_random_secret_key())
DEBUG = os.environ.get("PG_PLUS_DEBUG", "False").lower() in {"1", "true", "yes"}
ALLOWED_HOSTS = [host.strip() for host in os.environ.get("PG_PLUS_ALLOWED_HOSTS", "127.0.0.1,localhost").split(",") if host]

# 应用列表
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "django_celery_results",
    "django_celery_beat",
    "apps.authapp",
    "apps.filesapp",
    "apps.rulesapp",
    "apps.scoringapp",
    "apps.policiesapp",
]

# 使用自定义用户模型（scoringapp.Student）作为项目的认证用户模型
AUTH_USER_MODEL = "scoringapp.Student"

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"
ASGI_APPLICATION = "core.asgi.application"

# 数据库配置
RUNNING_TESTS = os.environ.get("PYTEST_CURRENT_TEST") is not None or any("pytest" in arg for arg in sys.argv)
DEFAULT_DB_ENGINE = "sqlite"
DB_ENGINE = os.environ.get("PG_PLUS_DB_ENGINE", DEFAULT_DB_ENGINE).strip().lower()
if RUNNING_TESTS:
    DB_ENGINE = "sqlite"

if DB_ENGINE == "mysql":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": os.environ.get("PG_PLUS_DB_NAME", "pg_plus"),
            "USER": os.environ.get("PG_PLUS_DB_USER", "pg_plus_user"),
            "PASSWORD": os.environ.get("PG_PLUS_DB_PASSWORD", "pg_plus_password"),
            "HOST": os.environ.get("PG_PLUS_DB_HOST", "127.0.0.1"),
            "PORT": os.environ.get("PG_PLUS_DB_PORT", "3306"),
            "OPTIONS": {
                "charset": "utf8mb4",
            },
        }
    }
else:
    sqlite_path = os.environ.get("PG_PLUS_SQLITE_PATH", str(BASE_DIR / "db.sqlite3"))
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": sqlite_path,
            "TEST": {
                "NAME": os.environ.get("PG_PLUS_DB_SQLITE_NAME", ":memory:"),
            },
        }
    }

# 密码校验
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# 国际化设置
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Shanghai"
USE_I18N = True
USE_TZ = True

# 静态文件和媒体文件由 Nginx 挂载在 /gsapp/ 路径下
STATIC_URL = "/gsapp/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/gsapp/media/"
MEDIA_ROOT = Path(os.environ.get("PG_PLUS_MEDIA_ROOT", BASE_DIR / "media")).resolve()

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# DRF 配置，优先采用 JWT 认证流程
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "user": "120/minute",
    },
}

CORS_ALLOWED_ORIGINS = [origin.strip() for origin in os.environ.get("PG_PLUS_CORS_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",") if origin]
CORS_ALLOW_CREDENTIALS = True

# Celery / Redis 配置
CELERY_BROKER_URL = os.environ.get("PG_PLUS_CELERY_BROKER_URL", "redis://127.0.0.1:6379/1")
CELERY_RESULT_BACKEND = os.environ.get("PG_PLUS_CELERY_RESULT_BACKEND", "redis://127.0.0.1:6379/2")
CELERY_TASK_DEFAULT_QUEUE = "pg_plus_default"

# 文件存储占位符；MinIO/OSS 适配将在后续适配器中实现。
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"

# JWT 配置项由环境变量提供
SIMPLE_JWT = {
    "SIGNING_KEY": os.environ.get("PG_PLUS_JWT_SIGNING_KEY", SECRET_KEY),
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.environ.get("PG_PLUS_JWT_ACCESS_LIFETIME_MINUTES", "30"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.environ.get("PG_PLUS_JWT_REFRESH_LIFETIME_DAYS", "7"))),
}

# CAS / OIDC 相关配置预留，待后续实现。
PG_PLUS_CAS_SERVER_URL = os.environ.get("PG_PLUS_CAS_SERVER_URL", "")
PG_PLUS_OIDC_ISSUER = os.environ.get("PG_PLUS_OIDC_ISSUER", "")
