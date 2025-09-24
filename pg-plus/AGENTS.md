# AI Contributor Guidelines

Welcome, AI teammates. This document sets boundaries for automated contributions across the PG-Plus monorepo.

## Scope & Ownership
- Stay within existing folders unless architecture reviews approve new ones.
- Touch only stubs and scaffolding until product owners green-light business logic.
- When in doubt about feature intent, **ask for clarification** before coding.

## Coding Standards
- Python: follow PEP 8, 4-space indents, type hints when practical, docstrings for public interfaces.
- Vue/TS: composition API with `<script setup>`, keep hash router (`createWebHashHistory`) unless explicitly replaced.
- Keep assets and routes `/gsapp/`-aware; admin SPA must remain under `/gsapp/admin/`.
- Ensure axios clients read `import.meta.env.VITE_API_BASE` and default to `/gsapp/api/v1`.

## Commit Discipline
- Prefer conventional commits (e.g., `feat:`, `fix:`, `chore:`). Group related changes.
- Reference issue IDs when available.
- Do not auto-format unrelated files; keep diffs focused.

## Testing Expectations
- Backend: add or update unit tests alongside new endpoints or serializers; run `make lint` + `pytest` once they exist.
- Frontend: supply component tests when business logic arrives; keep `npm run lint` and `npm run typecheck` green.
- Document manual QA steps for notable UI or infrastructure changes.

## Review & Safety
- Never ship secrets or real credentials. Use env placeholders only.
- Flag architectural risks early (DB migrations, auth surfaces, storage providers).
- Maintain OpenAPI spec accuracy once endpoints mature.
- Respect the "no business logic in scaffold" rule—place TODOs and notes instead.

Following these guardrails keeps AI assistance predictable and easy to review. Happy scaffolding!
