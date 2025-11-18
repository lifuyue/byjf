.PHONY: setup backend-serve frontend-dev frontend-dev-admin frontend-dev-teacher fmt lint celery celery-beat openapi

UV ?= uv
PNPM ?= pnpm

setup:
	$(UV) sync --all-groups
	cd frontends && $(PNPM) install

backend-serve:
	$(UV) run python backend/manage.py migrate --noinput
	$(UV) run python backend/manage.py runserver 0.0.0.0:8000

frontend-dev:
	cd frontends && $(PNPM) dev:student -- --open

frontend-dev-admin:
	cd frontends && $(PNPM) dev:admin -- --open

frontend-dev-teacher:
	cd frontends && $(PNPM) dev:teacher -- --open

celery:
	$(UV) run celery -A core worker -l info

celery-beat:
	$(UV) run celery -A core beat -l info

fmt:
	$(UV) run black backend || true
	$(UV) run isort backend || true
	cd frontends && $(PNPM) fmt || true

lint:
	$(UV) run flake8 backend || true
	cd frontends && $(PNPM) lint || true

typecheck:
	$(UV) run mypy backend

test:
	$(UV) run python -m pytest backend

openapi:
	echo "TODO: generate OpenAPI spec" && exit 0
