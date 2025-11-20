# Repository Guidelines

## Project Structure & Module Organization
- `backend/` contains the Django project; apps live in `backend/apps/` with per-app tests under `tests/`. Shared settings and Celery config sit in `backend/core/`, and uploads land in `backend/media/`.
- `apps/programsapp/` hosts the teacher projects + student selection + volunteer certification models, DRF viewsets (`/api/v1/programs/...`), and the `seed_demo_data` management command that hydrates SQLite/MySQL with the mock data used by the dashboards.
- `frontends/` is a pnpm workspace. Each Vue 3 + Vite app lives under `frontends/web-student`, `frontends/web-admin`, or `frontends/web-teacher` (static `index.html`/`scripts/`/`styles/` serve as the current UI while `src/` remains scaffolded). `web-student` 负责统一登录入口并根据角色显示学生/教师/管理员工作台，`web-teacher`、`web-admin` 以 iframe 方式嵌入（直接访问路由会重定向回 `/gsapp/`）。
- Infra assets reside in `spec/openapi.yaml`, `scripts/`, and `nginx/`; update these together when API gateways or deploy flows change.
- “专业排名”“个人主页”等学生/教师端页面已接入 `/api/v1/scoring/students/` 与 `/api/v1/auth/me/`，不要再回退长驻 mock；若需示例数据，保持后端 seed 即可。

## Build, Test, and Development Commands
- `.python-version` pins 3.11 so uv/pyenv/IDEs can auto-resolve `.venv/bin/python3.11`.
- `make setup` still runs `uv sync --all-groups`, then boots into `frontends/` to execute `pnpm install` for every SPA.
- Windows contributors can skip GNU Make entirely: run `python -m pip install --upgrade uv`, `uv sync --all-groups`, then `cd frontends && pnpm install && pnpm --filter pg-plus-web-student dev` 启动统一前端。Backend commands use `uv run python backend/manage.py ...` directly。
- `make backend-serve` remains a shortcut for `uv run python backend/manage.py migrate && uv run python backend/manage.py runserver 0.0.0.0:8000`.
- Use `uv run python backend/manage.py seed_demo_data --force` whenever you need the teacher projects, selections, volunteer records **and demo accounts (`student001`/`teacher001`/`admin001` with `Passw0rd!`)** pre-populated for local demos.
- In `frontends/`, `pnpm --filter pg-plus-web-student dev` 启动唯一 dev server（端口 5173，托管 `/gsapp/`、`/gsapp/teacher/`、`/gsapp/admin/` 三个入口）。`pnpm --filter pg-plus-web-teacher dev` / `pnpm --filter pg-plus-web-admin dev` 仅在需要独立调试各包时使用。`pnpm build` / `pnpm lint` / `pnpm typecheck` 仍 orchestrate workspace tasks。Student/teacher dashboards call `/api/v1/programs/...` directly; update the `<meta name="pg-plus-api-base" ...>` tag inside each `index.html` if the backend base URL changes.
- Celery workers continue to use `make celery` / `make celery-beat` (or `uv run celery -A backend.core worker|beat`) once Redis is available.
 - Makefile 中 `frontend-dev`/`frontend-start` 也是单一学生端 dev server 的入口；无需额外端口即可访问 /gsapp/teacher 与 /gsapp/admin。

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
- 后端审核权限：`/programs/*/review` 仅教师（或 staff/superuser）可调用，管理员只能通过 `/override` 复核/作废；学生只能读取自己的志愿记录。前端呈现需与角色约束一致（admin 只读+复核，teacher 审核）。
