# PG-Plus (保研加分小助手)

PG-Plus 是面向“保研加分助手”场景的全栈脚手架。仓库以 Django 5 + DRF 提供 API 骨架，并在 `frontends/` 下通过 pnpm workspace 承载学生端、教师端和管理端的 Vite/Vue 3 应用。目前重点是提供完善的接线、示例 UI 以及一套不依赖 GNU Make 的开发体验，方便 Windows 与 macOS/Linux 协同。

```
浏览器 ────── Hash 路由（Vite/Vue 应用）
   |                  | \
   |                  |  \__ frontends/web-student  → /gsapp/
   |                  |_____ frontends/web-teacher  → /gsapp/teacher/
   |                  |_____ frontends/web-admin    → /gsapp/admin/
   v
+--------------------------+
|        Nginx             |
|  /gsapp/  静态资源        |
|  /gsapp/api/ → /api/     |
+--------------------------+
              |
              v
+--------------------------+      +-----------------+
| Django 5 + DRF（ASGI）   |◀────▶| Redis（缓存、    |
| 核心 API /api/v1/...     |      | 消息代理）       |
+------------+-------------+      +-----------------+
             |
             v
      +---------------+
      |   MySQL 8     |
      +---------------+
                \
                 \→ Celery worker 与 beat（占位）
```

## 技术栈亮点

- uv 负责 Python 依赖与虚拟环境管理，`uv run ...` 等价于常见的 `python -m ...`、`pip` 命令。
- Django 5 + DRF + Simple JWT：默认使用 SQLite，可通过环境变量切换到 MySQL 8。
- Celery、Redis、Nginx、Gunicorn/Daphne 的配置示例已经就绪（需按需开启）。
- 所有前端位于 `frontends/`，通过 pnpm workspace 统一安装依赖、运行 dev server、执行 lint/typecheck/build。
- `frontends/web-student`、`frontends/web-teacher` 暂以静态仪表板+脚本提供真实 UI；`frontends/web-admin` 复用了用户提供的备份模板。
- 教师端/学生端的“教师加分项目 + 志愿工时认证”模块已经接入后端 `apps.programsapp`。所有项目、报名、志愿记录、学生审核票据均持久化在 SQLite/MySQL 中，并通过 `/api/v1/programs/*` API 统一管理，仍保留一审→二审→三审的流程、多阶段驳回/重提、OCR 标记等互动；学生端可在线编辑/删除待审记录并自动回到一审，教师端刷新即可看到数据库中的真实状态。

## 环境要求

- Python 3.11+
- uv 0.9+（`python -m pip install --upgrade uv`）
- Node.js 18+ 与 pnpm 9+
- SQLite 3（默认演示用）
- MySQL 8、Redis 6（可选，部署或联调时使用）

## 快速上手（跨平台）

1. 复制环境变量：`cp .env.example .env` 并根据需要调整数据库、Redis、JWT 配置。
2. 安装 Python 依赖：
   ```bash
   python -m pip install --upgrade uv
   uv sync --all-groups
   ```
3. 初始化数据库并启动后端：
   ```bash
   uv run python backend/manage.py migrate --noinput
   uv run python backend/manage.py seed_demo_data --force  # 可选：导入教师项目/志愿示例数据
   uv run python backend/manage.py runserver 0.0.0.0:8000
   ```
4. 安装前端依赖并启动 dev server：
   ```bash
   cd frontends
   pnpm install            # 安装 workspace 依赖
   pnpm dev                # 并行启动学生/教师/管理端（默认端口 5173/5174/5175）
   # 单独启动：pnpm dev:student / pnpm dev:teacher / pnpm dev:admin
   ```
5. 访问：
   - http://localhost:5173/gsapp/ （学生端）
   - http://localhost:5174/gsapp/admin/ （管理端）
- http://localhost:5175/gsapp/teacher/ （教师端）
- http://localhost:8000/api/v1/… （后台 API）

> 提示：`frontends/web-student/index.html`、`frontends/web-teacher/index.html` 默认通过 `<meta name="pg-plus-api-base" content="http://localhost:8000/api/v1">` 指向后端 API。若后端部署在其他域名/端口，可直接修改该 meta 或在构建阶段注入 `VITE_API_BASE`。

### Windows 无需 GNU Make

Windows 默认缺少 GNU Make，以上步骤均可在 PowerShell / CMD 中执行。如需 Celery、构建或其他命令，可直接调用 uv/pnpm：

```powershell
# Celery worker 与 beat（确保 Redis 可用）
uv run celery -A backend.core worker --loglevel=info
uv run celery -A backend.core beat --loglevel=info

# 构建所有前端
cd frontends
pnpm build
pnpm --filter pg-plus-web-teacher preview -- --host
```

若喜欢 `make`，可通过 winget/scoop/chocolatey 安装，或直接在 Git Bash / WSL 中运行本仓库。

## 项目结构

- `backend/` – Django 工程：`core/`（设置、ASGI/Celery 启动）、`apps/`（authapp/filesapp/...）、`tests/`。上传文件位于 `backend/media/`。
  - 新增 `apps/programsapp/`：包含教师项目、学生报名、志愿工时、多级审核模型与 `/api/v1/programs/*` 视图集，以及 `seed_demo_data` 管理命令。
- `frontends/` – pnpm workspace：
  - `package.json`：聚合脚本，如 `pnpm dev`, `pnpm lint`, `pnpm typecheck`。
  - `web-student/`、`web-teacher/`、`web-admin/`：各自的 Vite 应用，静态 HTML/JS/CSS 存于 `index.html`、`scripts/`、`styles/`。
  - `pnpm-workspace.yaml`：声明所有包。
- `spec/openapi.yaml`、`scripts/`、`nginx/` – 部署脚本与反向代理模板。

## 常用命令

| 目标 | 无 make 命令 | 说明 |
| --- | --- | --- |
| 安装 Python 依赖 | `uv sync --all-groups` | 创建 `.venv/`，安装所有后端依赖 |
| 运行迁移 | `uv run python backend/manage.py migrate` | SQLite 默认即可运行 |
| 导入示例数据 | `uv run python backend/manage.py seed_demo_data --force` | 将教师项目、报名、志愿记录写入数据库，方便前端联调 |
| 启动后端 | `uv run python backend/manage.py runserver 0.0.0.0:8000` | 读取 `.env` |
| 启动 Celery | `uv run celery -A backend.core worker` | Redis URL 取自 `.env` |
| 安装前端依赖 | `cd frontends && pnpm install` | 仅需执行一次 |
| 全量前端 dev | `cd frontends && pnpm dev` | 并行启动三个子应用 |
| 单独 dev | `pnpm --filter pg-plus-web-student dev` 等 | 可在 `frontends/` 内执行 |
| 构建静态资源 | `cd frontends && pnpm build` | 输出到各自 `dist/` |
| 前端 lint/typecheck | `pnpm lint` / `pnpm typecheck` | workspace 级别 |

`make` 仍然可用（`make setup`, `make backend-serve`, `make frontend-dev` 等），但文档默认以 uv + pnpm 原生命令为准。

## 测试与格式化

- 后端：`uv run python -m pytest backend`、`uv run black backend`、`uv run isort backend`、`uv run flake8 backend`。访问数据库的测试请添加 `pytest.mark.django_db`。
- 前端：各包下的 ESLint/Vitest 通过 workspace 脚本触发，示例：`cd frontends && pnpm lint && pnpm typecheck`。

## Nginx & 部署提示

- 所有前端均以 hash 路由挂载到 `/gsapp/` 前缀（管理端为 `/gsapp/admin/`，教师端 `/gsapp/teacher/`）。
- Nginx 需将 `/gsapp/api/` 代理至 Django `/api/`，Django 内通过 `core/urls.py` 暴露 `/api/v1/`。
- Gunicorn 示例：`gunicorn core.asgi:application -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000`。Daphne 是可选替代。
- 若需离线构建，可将 `frontends/web-*/dist` 输出部署至 `/var/www/pg-plus/...`，并配置 gzip/缓存策略。

## 安全与配置占位

- `.env` 中提供 `PG_PLUS_SECRET_KEY`、`PG_PLUS_DB_*`、`PG_PLUS_REDIS_URL`、`PG_PLUS_JWT_*`、`PG_PLUS_FILE_STORAGE_*` 等示例变量，请勿提交敏感信息。
- Vue 应用仅可读取 `VITE_*` 前缀的变量，推荐统一通过 `VITE_API_BASE=/gsapp/api/v1` 调用后端。
- CAS/OIDC、MinIO/OSS 适配器留有 TODO/占位，待业务功能完善后填充。

## 接下来可以做什么

- 后端：补齐 `authapp`、`scoringapp` 等应用的模型与 API，实现 JWT 流程与打分逻辑。
- 前端：将静态仪表板替换为真实界面，接入 `/gsapp/api/v1`，并补充 Vitest/组件测试。
- DevOps：完善 `spec/openapi.yaml`、Nginx/CI 配置，针对 MySQL/Redis/Celery 做环境参数化。

如需更多细节，可参考 `AGENTS.md` 中的贡献指南以及 `frontends/package.json` 脚本注释。欢迎基于当前脚手架继续叠加功能。
