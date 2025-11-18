# Repository Guidelines

## Project Structure & Module Organization
- `backend/` contains the Django project; apps live in `backend/apps/` with per-app tests under `tests/`. Shared settings and Celery config sit in `backend/core/`, and uploads land in `backend/media/`.
- `frontends/` is a pnpm workspace. Each Vue 3 + Vite app lives under `frontends/web-student`, `frontends/web-admin`, or `frontends/web-teacher` (static `index.html`/`scripts/`/`styles/` serve as the current UI while `src/` remains scaffolded).
- Infra assets reside in `spec/openapi.yaml`, `scripts/`, and `nginx/`; update these together when API gateways or deploy flows change.

## Build, Test, and Development Commands
- `.python-version` pins 3.11 so uv/pyenv/IDEs can auto-resolve `.venv/bin/python3.11`.
- `make setup` still runs `uv sync --all-groups`, then boots into `frontends/` to execute `pnpm install` for every SPA.
- Windows contributors can skip GNU Make entirely: run `python -m pip install --upgrade uv`, `uv sync --all-groups`, then `cd frontends && pnpm install && pnpm dev` to spin up all dev servers. Backend commands use `uv run python backend/manage.py ...` directly.
- `make backend-serve` remains a shortcut for `uv run python backend/manage.py migrate && uv run python backend/manage.py runserver 0.0.0.0:8000`.
- In `frontends/`, `pnpm dev` runs all apps concurrently (student/admin/teacher on 5173/5174/5175). Use `pnpm dev:student` / `pnpm dev:teacher` / `pnpm dev:admin` for focused work, and `pnpm build`/`pnpm lint`/`pnpm typecheck` to orchestrate workspace tasks.
- Celery workers continue to use `make celery` / `make celery-beat` (or `uv run celery -A backend.core worker|beat`) once Redis is available.

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
