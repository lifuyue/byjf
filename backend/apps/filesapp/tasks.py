from __future__ import annotations

import logging
from typing import Any

from celery import shared_task
from django.utils import timezone

from .models import File

logger = logging.getLogger(__name__)


@shared_task(name="filesapp.parse_uploaded_file")
def parse_uploaded_file(file_id: str) -> None:
    """Background task to parse uploaded files and update status."""

    try:
        file_obj = File.objects.get(pk=file_id)
    except File.DoesNotExist:
        logger.warning("File %s not found for parsing", file_id)
        return

    try:
        file_obj.status = File.STATUS_PROCESSING
        file_obj.error_message = None
        file_obj.save(update_fields=["status", "error_message"])

        # Placeholder for real parsing; here we just ensure checksum is computed.
        try:
            file_obj.compute_checksum()
        except Exception as exc:  # pragma: no cover - unexpected IO
            logger.exception("Failed to compute checksum for %s", file_id)
            file_obj.error_message = str(exc)

        file_obj.processed_at = timezone.now()
        if not file_obj.error_message:
            file_obj.status = File.STATUS_DONE
            file_obj.save(update_fields=["checksum", "processed_at", "status"])
        else:
            file_obj.status = File.STATUS_FAILED
            file_obj.save(update_fields=["checksum", "processed_at", "status", "error_message"])
    except Exception as exc:  # pragma: no cover - unexpected runtime failure
        logger.exception("Unhandled error when parsing file %s", file_id)
        file_obj.status = File.STATUS_FAILED
        file_obj.error_message = str(exc)
        file_obj.processed_at = timezone.now()
        file_obj.save(update_fields=["status", "error_message", "processed_at"])
