# 应用配置
INSTALLED_APPS = [
    # 如果需要，可以在此处添加 scoringapp 相关的本地 apps
    'rest_framework',
    'apps.scoringapp',
]

# 自定义用户模型
AUTH_USER_MODEL = 'scoringapp.Student'

# 媒体文件配置
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# REST Framework配置
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.BasicAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
}
