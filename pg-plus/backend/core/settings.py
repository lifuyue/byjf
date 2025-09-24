"""Django settings for PG-Plus scaffold."""
from __future__ import annotations

import os
from datetime import timedelta
from pathlib import Path

from django.core.management.utils import get_random_secret_key

BASE_DIR = Path(__file__).resolve().parent.parent

# Core switches
SECRET_KEY = os.environ.get("PG_PLUS_SECRET_KEY", get_random_secret_key())
DEBUG = os.environ.get("PG_PLUS_DEBUG", "False").lower() in {"1", "true", "yes"}
ALLOWED_HOSTS = [host.strip() for host in os.environ.get("PG_PLUS_ALLOWED_HOSTS", "127.0.0.1,localhost").split(",") if host]

# Applications
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

# Database
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
# TODO: For quick prototypes developers may swap to SQLite; see README for guidance.

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Shanghai"
USE_I18N = True
USE_TZ = True

# Static and media files are served under /gsapp/ by Nginx
STATIC_URL = "/gsapp/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/gsapp/media/"
MEDIA_ROOT = Path(os.environ.get("PG_PLUS_MEDIA_ROOT", BASE_DIR / "media")).resolve()

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# DRF setup focuses on JWT-first workflow
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

# Celery / Redis
CELERY_BROKER_URL = os.environ.get("PG_PLUS_CELERY_BROKER_URL", "redis://127.0.0.1:6379/1")
CELERY_RESULT_BACKEND = os.environ.get("PG_PLUS_CELERY_RESULT_BACKEND", "redis://127.0.0.1:6379/2")
CELERY_TASK_DEFAULT_QUEUE = "pg_plus_default"

# Storage placeholders; MinIO/OSS wiring lands in adapters later.
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"

# JWT placeholders derived from environment
SIMPLE_JWT = {
    "SIGNING_KEY": os.environ.get("PG_PLUS_JWT_SIGNING_KEY", SECRET_KEY),
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.environ.get("PG_PLUS_JWT_ACCESS_LIFETIME_MINUTES", "30"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.environ.get("PG_PLUS_JWT_REFRESH_LIFETIME_DAYS", "7"))),
}

# CAS / OIDC switchboard lives here when implemented.
PG_PLUS_CAS_SERVER_URL = os.environ.get("PG_PLUS_CAS_SERVER_URL", "")
PG_PLUS_OIDC_ISSUER = os.environ.get("PG_PLUS_OIDC_ISSUER", "")

