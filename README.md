# PG-Plus (保研加分小助手)
   ````markdown
   # PG-Plus (保研加分小助手)

   PG-Plus 是一个面向未来“评分助手”的全栈脚手架。本仓库仅提供基础“接线”——不包含任何业务逻辑——以便团队能够安心在其之上逐步叠加功能。

   ```
   浏览器 ────── Hash 路由（Vite 单页应用）
      |                  |\
      |                  | \__ web-student (/gsapp/)
      |                  |____ web-admin (/gsapp/admin/)
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
                    \→ Celery worker 与 beat（未来任务）
   ```

   ## 技术栈亮点
   - 以 ASGI 为先的心智模型完成 Django 5、DRF 与 Simple JWT 的基础接线（`gunicorn -k uvicorn.workers.UvicornWorker` 或 `daphne`）。
   - MySQL（utf8mb4）为主存储；README 备注了用于原型期的可选 SQLite 退路。
   - 由 Redis 驱动的 Celery worker 与 beat 桩，准备好用于任务、缓存与限流。
   - 两个独立的 Vue 3 + Vite 应用（`web-student`、`web-admin`），使用 hash 路由，axios 指向 `/gsapp/api/v1`。
   - Nginx 配置已就绪以挂载到 `/gsapp/`：静态资源、管理端构建产物以及对 `/gsapp/api/` 的代理与重写。

   ## 环境要求
   - Python 3.11+
   - uv 0.9+（用于 Python 依赖管理，需自行安装）
   - Node.js 18+
   - MySQL 8+
   - Redis 6+

   ## 环境配置
   将 `.env.example` 复制为 `.env`（也可为各服务准备独立的 env 文件）。关键变量：
   - `PG_PLUS_SECRET_KEY`、`PG_PLUS_DEBUG`、`PG_PLUS_ALLOWED_HOSTS`
   - 数据库配置块（`PG_PLUS_DB_*`）
   - Redis 与 Celery 端点（`PG_PLUS_REDIS_URL`、`PG_PLUS_CELERY_*`）
   - JWT 生命周期与签名密钥（`PG_PLUS_JWT_*`）
   - 文件存储占位（MinIO / OSS）→ 之后接入适配器
   - 面向未来的 CAS/OIDC SSO 占位
   - 前端 `VITE_API_BASE=/gsapp/api/v1`

   > 可选：若本地原型阶段不使用 MySQL，可按 README 内联 TODO 将 `DATABASES['default']` 切换为 SQLite。

   ## 依赖与运行方式（uv）
   - 仓库根目录使用 uv 创建 `.venv/`，`make setup` 会执行 `uv sync --all-groups` 并在各前端目录安装 Node 依赖。
   - 任意需要 Python 的命令请改用 `uv run ...`（例如 `uv run python backend/manage.py migrate`、`uv run celery ...`）。
   - 若部署环境必须使用 `requirements.txt`，可在需要时运行 `uv export --frozen > backend/requirements.txt` 临时生成（文件不再长期保留）。
   - 根目录附带 `.python-version`（3.11），方便 uv / pyenv / IDE 自动解析并定位 `.venv/bin/python3.11`。

   ## 项目结构
   - `backend/` – Django 工程，包含核心设置、Celery 启动以及空的领域应用（`authapp`、`filesapp`、`rulesapp`、`scoringapp`、`policiesapp`）。
   - `web-student/` – 面向学生的 SPA；Vite 基础路径为 `/gsapp/`。
   - `web-admin/` – 管理端 SPA；Vite 基础路径为 `/gsapp/admin/`，以确保构建产物互不干扰。
   - `spec/openapi.yaml` – OpenAPI 文档占位；当真实端点存在后再生成。
   - `nginx/site.conf` – 生产环境外壳，用于静态资源服务与 API 代理。
   - `scripts/` – 开发编排说明与种子脚本桩（会抛出 `NotImplementedError`）。

   ## 快速开始
   1. **初始化工具链**
      ```bash
      make setup
      ```
   2. **启动数据库与 Redis**
      - 推荐：使用 Docker 运行 MySQL 8（`utf8mb4`）与 Redis 6。
      - 确保凭据与 `.env` 一致。
   3. **启动后端（开发模式）**
      ```bash
      uv run python backend/manage.py migrate --noinput
      uv run python backend/manage.py runserver 0.0.0.0:8000
      ```
   4. **运行 Celery 桩**
      ```bash
      uv run celery -A core worker -l info
      uv run celery -A core beat -l info
      ```
   5. **启动前端**（hash 路由在开发环境下可保持 `/gsapp/` 路径正常）
      ```bash
      cd web-student && npm run dev -- --host
      cd web-admin && npm run dev -- --host --port 5174
      ```
   6. **生产预览**
      ```bash
      npm run build
      npm run preview -- --host
      ```
      在两个前端目录中分别执行上述命令。

   ## 服务栈说明
   - 反向代理假定以 `/gsapp/` 为前缀的 Nginx 入口。学生端构建以 `/gsapp/` 为 base；管理端为 `/gsapp/admin/` 以避免资源冲突。
   - Nginx 将 `/gsapp/api/` 重写到 Django 的 `/api/`；Django 内部按照 `core/urls.py` 暴露 `/api/v1/`。
   - Gunicorn 示例：`gunicorn core.asgi:application -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000`。
   - Daphne 备选：`daphne -b 0.0.0.0 -p 8000 core.asgi:application`。

   ## Nginx 重写规则测试
   使用本地容器或通过 `nginx -c` 指向 `nginx/site.conf`。可将 `web-*/dist` 的输出软链到 `/var/www/pg-plus/...`，或根据你的工作区调整别名。确认以下行为：
   - `/gsapp/` 能提供学生端 SPA，且 hash 导航稳定。
   - `/gsapp/admin/` 能提供管理端 SPA。
   - `/gsapp/api/v1/...` 请求通过重写到达 Django 的 `/api/v1/...`。

   ## 认证与集成占位说明
   - 以 JWT 为先：`authapp` 暴露 `/api/v1/auth/login/` 与 `/refresh/` 占位接口，当前返回 HTTP 501。
   - 通过环境变量与 `settings.py` 中的 TODO 段落暴露 CAS/OIDC 钩子；待 SSO 需求明确后接入适配器。
   - 文件存储默认本地磁盘；`.env` 中预留 MinIO/OSS 凭据，供后端适配器后续使用。

   ## 代码风格与格式化
   - 后端：`make fmt`/`make lint` 已由 uv 安装并调用 `black`、`isort`、`flake8`。
   - 后端新增的 `make typecheck`（mypy）和 `make test`（pytest + coverage）可在提交前快速验证类型与单元测试。
   - 前端：在各自 web 目录内使用 `npm run lint`、`npm run fmt`、`npm run typecheck`。
   - Hash 路由可确保与 `/gsapp/` 挂载兼容；若需改为 history 模式，仅在具备服务端回退时进行。

   ## 后续工作 TODO
   - 在各应用中实现业务逻辑、序列化器与模型（评分规则、政策入库等）。
   - 自动生成 OpenAPI（如 DRF Spectacular），并与 `spec/openapi.yaml` 保持同步。
   - 强化安全：真实密钥、仅 HTTPS 的刷新令牌 Cookie、限流策略等。
   - 在端点就绪后补充集成测试与单元测试。
   - 本地化（i18n）待定——见 TODO 标记。

   ## 下一步（团队分工）
   - **后端团队**：在 `authapp` 等处定义数据结构、模型与 JWT 流程；确定 CAS/OIDC 路线图。
   - **前端（学生端）**：用真实 UX 替换占位布局，端点稳定后接入 `/gsapp/api/v1`。
   - **前端（管理端）**：构建看板、用 JWT 保护路由，确保管理端构建产物保持在 `/gsapp/admin/` 下。
   - **DevOps**：参数化 Nginx 路径，配置 MySQL/Redis/Celery，并设置 CI 以进行 lint/测试/构建。

   ````
