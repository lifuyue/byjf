from django.contrib import admin
from .models import File


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ("id", "file", "owner", "uploaded_at", "size", "status", "visibility")
    readonly_fields = ("id", "uploaded_at", "size", "checksum")
    search_fields = ("owner__username", "file", "checksum")
    list_filter = ("status", "visibility", "uploaded_at")
    ordering = ("-uploaded_at",)
