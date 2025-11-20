.PHONY: setup backend-serve backend-stop frontend-dev frontend-dev-admin frontend-dev-teacher frontend-start frontend-stop fmt lint celery celery-beat openapi

UV ?= uv
PNPM ?= pnpm
FRONTENDS_DIR ?= frontends

setup:
	$(UV) sync --all-groups
	cd frontends && $(PNPM) install

backend-serve:
	$(UV) run python backend/manage.py migrate --noinput
	$(UV) run python backend/manage.py runserver 0.0.0.0:8000

backend-stop:
	- pkill -f "manage.py runserver 0.0.0.0:8000" || true

frontend-dev:
	cd $(FRONTENDS_DIR) && $(PNPM) --filter pg-plus-web-student dev -- --open

frontend-dev-admin:
	@echo "Admin UI复用统一开发服务器（pg-plus-web-student）。请运行: make frontend-dev"

frontend-dev-teacher:
	@echo "Teacher UI复用统一开发服务器（pg-plus-web-student）。请运行: make frontend-dev"

frontend-start:
	cd $(FRONTENDS_DIR) && $(PNPM) --filter pg-plus-web-student dev

frontend-stop:
	- pkill -f "pnpm.*pg-plus-web-student dev" || true

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
