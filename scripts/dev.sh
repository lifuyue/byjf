#!/usr/bin/env bash
# TODO: wire up tmux/proc management here.
# Suggested layout:
#   1. Start Django backend: cd backend && python manage.py runserver 0.0.0.0:8000
#   2. Run Celery worker: cd backend && celery -A core worker -l info
#   3. Run Celery beat: cd backend && celery -A core beat -l info
#   4. Start student SPA: cd web-student && npm run dev -- --host
#   5. Start admin SPA: cd web-admin && npm run dev -- --host
# Consider using `honcho`, `overmind`, or `npm-run-all` if you want automation.
