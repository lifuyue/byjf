.PHONY: setup backend-serve frontend-dev frontend-dev-admin frontend-dev-teacher fmt lint celery celery-beat openapi

UV ?= uv
NODE ?= npm
NPM_INSTALL_FLAGS ?= install --no-audit --no-fund --loglevel=error

setup:
	$(UV) sync --all-groups
	cd web-student && $(NODE) $(NPM_INSTALL_FLAGS)
	cd web-admin && $(NODE) $(NPM_INSTALL_FLAGS)
	cd web-teacher && $(NODE) $(NPM_INSTALL_FLAGS)

backend-serve:
	$(UV) run python backend/manage.py migrate --noinput
	$(UV) run python backend/manage.py runserver 0.0.0.0:8000

frontend-dev:
	cd web-student && $(NODE) run dev -- --open

frontend-dev-admin:
	cd web-admin && $(NODE) run dev -- --open

frontend-dev-teacher:
	cd web-teacher && $(NODE) run dev -- --open

celery:
	$(UV) run celery -A core worker -l info

celery-beat:
	$(UV) run celery -A core beat -l info

fmt:
	$(UV) run black backend || true
	$(UV) run isort backend || true
	cd web-student && $(NODE) run fmt || true
	cd web-admin && $(NODE) run fmt || true
	cd web-teacher && $(NODE) run fmt || true

lint:
	$(UV) run flake8 backend || true
	cd web-student && $(NODE) run lint || true
	cd web-admin && $(NODE) run lint || true
	cd web-teacher && $(NODE) run lint || true

openapi:
	echo "TODO: generate OpenAPI spec" && exit 0
