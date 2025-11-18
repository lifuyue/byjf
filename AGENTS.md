# Repository Guidelines

## Project Structure & Module Organization
- `backend/` contains the Django project; apps live in `backend/apps/` with per-app tests under `tests/`. Shared settings and Celery config sit in `backend/core/`, and uploads land in `backend/media/`.
- `web-admin/`, `web-student/`, and `web-teacher/` are Vite + Vue 3 frontends. Ship features inside each `src/` tree and keep `web-student`'s static HTML limited to marketing entry points.
- Infra assets reside in `spec/openapi.yaml`, `scripts/`, and `nginx/`; update these together when API gateways or deploy flows change.

## Build, Test, and Development Commands
- `.python-version` pins 3.11 so uv/pyenv/IDEs can auto-resolve `.venv/bin/python3.11`.
- `make setup` runs `uv sync --all-groups` (creating `.venv/`) and runs a quiet `npm install` for all frontends.
- On Windows without GNU Make, run `python -m pip install --upgrade uv`, `uv sync --all-groups`, and `npm install --no-audit --no-fund --loglevel=error` inside each `web-*` directory before invoking the subsequent `uv run ...` commands manually.
- `make backend-serve` applies migrations and starts Django on `0.0.0.0:8000` via `uv run python backend/manage.py ...`; load env values from `.env` seeded via `.env.example`.
- `make frontend-dev`, `make frontend-dev-admin`, and `make frontend-dev-teacher` start the student, admin, or teacher Vite servers (equivalent to `npm run dev -- --open` in each package); Celery workers use `make celery` and the scheduler uses `make celery-beat` once Redis is available.

## Coding Style & Naming Conventions
- Run Black (88 cols), isort, and Flake8 on Python modules. Use `snake_case` modules, `PascalCase` classes, `UPPER_SNAKE` constants, and annotate public interfaces.
- Vue + TypeScript relies on ESLint + Prettier (2-space, single quotes). Name components in PascalCase, composables `useThing`, Pinia stores `useThingStore`, and keep Axios pointed at `import.meta.env.VITE_API_BASE` (default `/gsapp/api/v1`).

## Testing Guidelines
- Place backend tests beside their app in `tests/`, name files `test_*.py`, run `uv run python -m pytest backend`, and mark ORM access with `pytest.mark.django_db`.
- Frontend changes should add Vitest specs near the component (`src/__tests__/`) and keep `npm run lint` plus `npm run typecheck` clean.
- Note manual QA steps in PRs until automated coverage reaches the surface.

## Commit & Pull Request Guidelines
- Write imperative, scope-tagged commits (e.g., `backend: add scoring weights api`) and keep diffs focused; rerun formatters before staging.
- PRs must describe intent, reference tickets, list verification commands (`make backend-serve`, `uv run python -m pytest backend`, `npm run lint`, `npm run typecheck`), and attach screenshots or payload samples for UI/API changes.
- Flag migrations, new env vars, or Celery schedule updates so deploys can be planned.

## Security & Configuration Tips
- Copy `.env.example` to `.env`, keep secrets out of Git, and only expose browser env values with the `VITE_` prefix.
- Apply DRF permission and tenancy checks to every new endpoint and emit audit events for state changes.
- Keep `spec/openapi.yaml` aligned with backend updates so clients and nginx rules stay current.
