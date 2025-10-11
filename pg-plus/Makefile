.PHONY: setup backend-serve frontend-dev frontend-dev-admin frontend-dev-teacher fmt lint celery beat openapi

PYTHON ?= python3
NODE ?= npm

setup:
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -r backend/requirements.txt
	cd web-student && $(NODE) install
	cd web-admin && $(NODE) install
	cd web-teacher && $(NODE) install

backend-serve:
	cd backend && $(PYTHON) manage.py migrate --noinput && $(PYTHON) manage.py runserver 0.0.0.0:8000

frontend-dev:
	cd web-student && $(NODE) run dev -- --open

frontend-dev-admin:
	cd web-admin && $(NODE) run dev -- --open

frontend-dev-teacher:
	cd web-teacher && $(NODE) run dev -- --open

celery:
	cd backend && celery -A core worker -l info

celery-beat:
	cd backend && celery -A core beat -l info

fmt:
	$(PYTHON) -m black backend || true
	$(PYTHON) -m isort backend || true
	cd web-student && $(NODE) run fmt || true
	cd web-admin && $(NODE) run fmt || true
	cd web-teacher && $(NODE) run fmt || true

lint:
	$(PYTHON) -m flake8 backend || true
	cd web-student && $(NODE) run lint || true
	cd web-admin && $(NODE) run lint || true
	cd web-teacher && $(NODE) run lint || true

openapi:
	echo "TODO: generate OpenAPI spec" && exit 0
