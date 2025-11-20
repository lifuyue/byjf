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
- `frontends/web-student` 现在扮演统一入口：负责登录、身份判定和学生仪表盘渲染，并通过 iframe 嵌入 `web-teacher` 与 `web-admin`（二者仍保留独立 Vite 项目以便开发，直接访问会重定向回统一入口）。
- 教师端/学生端的“教师加分项目 + 志愿工时认证”模块已经接入后端 `apps.programsapp`。所有项目、报名、志愿记录、学生审核票据均持久化在 SQLite/MySQL 中，并通过 `/api/v1/programs/*` API 统一管理，仍保留一审→二审→三审的流程、多阶段驳回/重提、OCR 标记等互动；学生端可在线编辑/删除待审记录并自动回到一审，教师端刷新即可看到数据库中的真实状态。
- 管理员审核职能是“查看 + 复核”：admin 只能查看全量记录并发起复核/作废（`/override`），正常审核（/review）仅限教师；后端使用 RolePermission 做显式限制。
- 专业排名、个人主页等学生/教师页面已接入 `/api/v1/scoring/students/` 与 `/api/v1/auth/me/` 实时数据，无法获取时才回退示例数据。

## 环境要求

- Python 3.11+
- uv 0.9+（`python -m pip install --upgrade uv`）
- Node.js 18+ 与 pnpm 9+
- SQLite 3（默认演示用）
- MySQL 8、Redis 6（可选，部署或联调时使用）

## 快速上手（Windows/macOS/Linux 通用流程）

所有命令可直接在 PowerShell、CMD、Terminal 或 Git Bash 中执行，无需额外安装 GNU Make。

### 1. 准备依赖

- Python 3.11+
- Node.js 18+ 与 pnpm 9+
- `python -m pip install --upgrade uv`

### 2. 配置环境

```bash
cp .env.example .env   # Windows 可使用 copy .env.example .env
```

如需自定义数据库或 Redis，可编辑 `.env`，默认使用 `backend/db.sqlite3`。

### 3. 安装后端依赖（仅首次）

```bash
uv sync --all-groups
```

### 4. 迁移并写入示例数据

```bash
uv run python backend/manage.py migrate --noinput            # 初始化 SQLite
uv run python backend/manage.py seed_demo_data --force       # 写入示例项目/志愿/审核 + demo 账号
```

Seed 命令会创建以下账号：`student001`、`teacher001`、`admin001`，密码均为 `Passw0rd!`。

### 5. 启动 Django 开发服务器

```bash
uv run python backend/manage.py runserver 0.0.0.0:8000
```

如果需要确认服务就绪，可在另一终端运行：

```bash
curl http://127.0.0.1:8000/api/health/
# 或 PowerShell
Invoke-WebRequest http://127.0.0.1:8000/api/health/
```

### 6. 安装前端依赖（仅首次）

```bash
cd frontends
pnpm install
```

### 7. 启动前端（统一入口 + 子站映射）

```bash
# 推荐：只启学生端 dev server（会自动托管 /gsapp/teacher 与 /gsapp/admin）
pnpm --filter pg-plus-web-student dev

# 可选：单独跑原始教师/管理员 Vite 项目，用于开发调试
pnpm --filter pg-plus-web-teacher dev   # 监听 5175，产出 iframe 静态页
pnpm --filter pg-plus-web-admin dev     # 监听 5174，产出 iframe 静态页
```

`pnpm --filter pg-plus-web-student dev` 会在 `http://localhost:5173/gsapp/` 暴露统一入口，并通过 dev server 的中间件把 `frontends/web-teacher` 映射到 `/gsapp/teacher/`，把 `frontends/web-admin` 映射到 `/gsapp/admin/`。因此测试教师/管理员界面时无需再开额外端口。

前端日志默认写入 `frontends/logs/*.log`，按需 `CTRL+C` 停止。

### 8. 登录体验

1. 浏览器打开 `http://localhost:5173/gsapp/`（唯一入口）。
2. 点击“登录”并输入示例账号（如下表）。
3. 系统会根据角色自动切换工作台：学生直接渲染原有仪表盘，教师/管理员通过 iframe 加载 `web-teacher` / `web-admin`。

| 角色 | 用户名 | 密码 | 说明 |
| --- | --- | --- | --- |
| 学生 | `student001` | `Passw0rd!` | 查看学生仪表盘、报名项目、提交志愿 |
| 教师 | `teacher001` | `Passw0rd!` | 访问 `http://localhost:5173/gsapp/teacher/index.html` 或从统一入口重定向 |
| 管理员 | `admin001` | `Passw0rd!` | 访问 `http://localhost:5173/gsapp/admin/index.html` 或从统一入口重定向 |

> `pnpm --filter pg-plus-web-student dev` 已托管所有页面；仅在需要单独调试教师/管理员包时才运行 `pnpm dev:teacher` / `pnpm dev:admin`。

> 调整 API 域名：`frontends/web-student/index.html`、`frontends/web-teacher/index.html` 中的 `<meta name="pg-plus-api-base" ...>` 控制后端地址；部署到其他主机时修改该 meta 即可。

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
| 前端 dev（统一入口） | `cd frontends && pnpm --filter pg-plus-web-student dev` | 同时托管 /gsapp、/gsapp/teacher、/gsapp/admin |
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
