# CLAUDE.md — TechSeekhoApp monorepo briefing

> **Single source of truth for AI agents and new humans working in this repo.**
> Read this top-to-bottom before touching code. When something here contradicts the codebase, the code wins — update this file in the same change.
>
> This file is the **monorepo-level** briefing. Each workspace also has its own deeper briefing:
> - [backend/CLAUDE.md](./backend/CLAUDE.md) — Express API, RBAC, services, Prisma
> - [frontend/CLAUDE.md](./frontend/CLAUDE.md) — Next.js App Router, NextAuth, dashboards
>
> Related context files in this repo (pre-existing — do not delete):
> - [.agent.md](./.agent.md) — TechSeekho Operations Agent persona (used by IDE agents)
> - [.github/agents/context.agent.md](./.github/agents/context.agent.md) — frontend context-discovery sub-agent
> - [.github/agents/ui-forms.agent.md](./.github/agents/ui-forms.agent.md) — auth-form scaffolding sub-agent

---

## 1. What this is, in one paragraph

TechSeekhoApp is the operational platform for **TechSeekho** (a Koshalyam Learning Solutions brand) that runs cohort-based skilling programs across schools, colleges, and training centers in the Indian/Pakistani regional ecosystem. It is **not** a consumer LMS. It is an **institution-scoped, batch-centric, multi-role operations system**: trainers run batches at institutions, students belong to a batch, coordinators monitor projection dashboards, admins manage their campus, and a single super-admin sees everything. The codebase is a **Turborepo monorepo** with a `frontend/` (Next.js 16 App Router + NextAuth + Tailwind v4) and a `backend/` (Express 5 + Prisma 7 + PostgreSQL + Hugging Face + optional Redis/MongoDB). The public face — landing page, course catalog, AI assistant popup — sits inside the same frontend app.

---

## 2. Top-level layout

```
TechSeekhoApp/                 ← you are here
├── .agent.md                  TechSeekho Operations Agent persona (pre-existing)
├── .github/agents/            Sub-agent definitions (context-agent, ui-forms-agent)
├── package.json               npm workspaces ["frontend", "backend"] + Turbo scripts
├── turbo.json                 task pipeline (build/dev/start/lint/format)
├── README.md                  Human-facing overview
├── README.txt                 Plain-text pointer
├── CLAUDE.md                  ← this file
├── AGENTS.md                  Short pointer for Cursor/Codex/etc.
├── ARCHITECTURE.md            Deep dive: request flow, RBAC, data model
│
├── backend/                   Express API (its own README/CLAUDE.md)
│   ├── README.md / CLAUDE.md
│   ├── .env / .env.example
│   ├── package.json           "techseekho-backend"
│   ├── prisma/
│   │   ├── schema.prisma      25+ models (users, institutions, batches, …, AuditLog)
│   │   ├── seed.js            roles + 2 institutions + 16 users + courses + batches
│   │   └── migrations/        6 migrations through 2026-05-19
│   ├── scripts/test-mongo.js  ad-hoc Mongo ping
│   ├── scratch/check_courses.js
│   └── src/                   server.js → app.js → routes → controllers → services
│
└── frontend/                  Next.js App Router (its own README/CLAUDE.md)
    ├── README.md / CLAUDE.md
    ├── .env / .env.local
    ├── package.json           "frontend"
    ├── next.config.mjs        security headers + Turbopack monorepo root
    ├── jsconfig.json          @/* → ./src/*
    ├── biome.json             4-space indent, Next + React linter domains
    └── src/
        ├── auth.js            NextAuth config (Credentials + Google + GitHub)
        ├── lib/
        │   ├── api.js         authenticated fetch wrapper
        │   ├── cn.js          tailwind-merge + clsx
        │   ├── roleRouter.js  role → dashboard route resolution
        │   └── roleRouter.test.js
        ├── app/               App Router pages (landingpage, dashboard, login, …)
        └── features/dashboard/ Reusable dashboard module (context, components, hooks, theme)
```

---

## 3. Platform philosophy (read this once, internalize it)

Pulled and tightened from `.agent.md` and `README.md`. If a code change contradicts any of these, push back on the change before merging.

1. **Institution-scoped, batch-centric.** A student isn't a free-floating account — they belong to a `StudentProfile.currentBatchId`. A trainer is assigned to specific batches via `BatchTrainer`. An admin manages one institution. Every query in the backend is or should be role-scoped, institution-scoped, and batch-aware where applicable.
2. **Operational truth ≠ projection/reporting truth.** Raw attendance, raw marks, raw progress, trainer operational reports are sacred and append-only-by-convention. Coordinator/external dashboards see *projections* of that truth. Never overwrite raw operational data when generating presentation data.
3. **AI and analytics use raw operational data only.** Never the projected/curated version.
4. **Sensitive actions are audit-logged.** Append-only `AuditLog` model captures actor + role + entity + before/after metadata + ip + ua. The `audit()` helper is fire-and-forget; never block an operation on the audit write succeeding.
5. **No business logic in routes.** Routes wire middleware and call a controller. Controllers shape the response. Services own authorization, scoping, and Prisma calls.
6. **Defense in depth on auth.** Frontend `DashboardAuthGate` blocks UI per route, and the backend re-enforces the same constraints on every endpoint. Never rely on frontend gating alone.
7. **No new dependencies without a clear reason.** The stack listed below is the stack.

---

## 4. Stack at a glance

| Layer            | Choice                                                                 |
|------------------|------------------------------------------------------------------------|
| Monorepo         | npm workspaces + Turborepo 2.x                                         |
| Frontend         | Next.js 16 App Router · React 19 · Tailwind CSS v4 · GSAP · Framer Motion · Lenis · `motion` · MUI · NextAuth v4 |
| Backend runtime  | Node.js ESM                                                            |
| HTTP server      | Express 5                                                              |
| Primary DB       | PostgreSQL via Prisma 7 (`@prisma/client` + `@prisma/adapter-pg`)      |
| Cache / rate-lim | Redis via `ioredis` (optional — in-memory fallback)                    |
| Secondary DB     | MongoDB via Mongoose (optional, soft-fails at boot)                    |
| Auth on backend  | JWT (`jsonwebtoken`) + bcrypt + HMAC-SHA256 OTPs                       |
| Auth on frontend | NextAuth v4 (Credentials + Google + GitHub) — backend issues the JWT   |
| Validation       | Zod (centralized schemas in `backend/src/validators/schemas.js`)       |
| AI               | `@huggingface/inference` → Qwen2.5-7B-Instruct on `together`           |
| Lint / format    | Biome (each workspace has its own config)                              |
| Frontend tests   | Vitest (only `lib/roleRouter.test.js` and `dashboard/resolveDashboardAuthz.test.js` exist) |
| Backend tests    | None yet — `npm test` exits 1                                          |

---

## 5. The five roles

Same in both backend (`Role` table) and frontend (`dashboardRoutePermissions.js`). Roles are stored as UPPER_SNAKE_CASE strings; the frontend normalizes case before comparing.

| Role                       | Scope             | Backend profile model | Frontend dashboard root         |
|----------------------------|-------------------|-----------------------|----------------------------------|
| `SUPER_ADMIN`              | Global            | (none)                | `/dashboard/super-admin`        |
| `ADMIN`                    | One institution   | `AdminProfile`        | `/dashboard/admin`              |
| `INSTITUTION_COORDINATOR`  | One institution   | (none)                | `/dashboard/coordinator`        |
| `TRAINER`                  | Institution + N batches | `TrainerProfile` (m2m `BatchTrainer`) | `/dashboard/trainer`            |
| `STUDENT`                  | Institution + 1 batch   | `StudentProfile` (`currentBatchId`)   | `/dashboard/student`            |

A user can have multiple `RoleAssignment` rows (e.g. ADMIN at two institutions). `req.user.roles` is the deduped name list; `req.user.roleAssignments` preserves the institution dimension. The frontend's `resolveRoleDestination()` picks the highest-priority role to choose a landing page.

---

## 6. End-to-end auth flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Credentials login                                │
│                                                                         │
│  Browser  ──POST /api/auth/callback/credentials──▶  NextAuth            │
│                                                       │                 │
│                                authorize() ──POST /auth/login/verify-otp│
│                                                       │                 │
│                                              backend issues JWT         │
│                                                       │                 │
│  NextAuth jwt() callback stores token.accessToken, roles, …             │
│                                                       │                 │
│  NextAuth session() callback hydrates session.accessToken               │
│                                                       │                 │
│  Frontend code does:  session = await getSession()                      │
│                        api("/student/dashboard")  ──Authorization: Bearer JWT──▶ backend │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        Google / GitHub login                            │
│                                                                         │
│  Browser ──redirect──▶ provider ──redirect──▶ NextAuth                  │
│                                                  │                      │
│                          jwt() callback ──POST /oauth/login──▶ backend  │
│                          (provider+token+email)                         │
│                                                  │                      │
│                          backend re-verifies token with Google/GitHub   │
│                          backend upserts User + STUDENT roleAssignment  │
│                          backend issues JWT                             │
│                                                  │                      │
│  NextAuth stores backend's JWT as token.accessToken                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                  Backend authenticates every authed request             │
│                                                                         │
│  Authorization: Bearer <JWT>                                            │
│    → middlewares/auth.js#authenticate                                   │
│       verifies JWT (iss=techseekho-api, aud=techseekho-app)             │
│       loads User + RoleAssignments (must be ACTIVE, ≥1 role)            │
│       attaches req.user = { id, roles, roleAssignments, … }             │
│    → requireRole(...) at route                                          │
│    → requireOperationalAccess at route (must have ≥1 institution role)  │
│    → service-layer assertCanAccessBatch / assertCanManageBatch          │
└─────────────────────────────────────────────────────────────────────────┘
```

OTP login is two-step: `POST /auth/login` (no `otp`) → 202 + OTP sent; `POST /auth/login/verify-otp` with `otp` → JWT issued. In dev (`EXPOSE_OTP_IN_RESPONSE=true`) the OTP comes back in the 202 response so local testing doesn't need a real email/SMS provider.

---

## 7. Where does X live?

| You want to…                                                  | Look here                                                                 |
|---------------------------------------------------------------|---------------------------------------------------------------------------|
| Change the DB schema                                          | `backend/prisma/schema.prisma` → `npm -w backend run db:migrate`          |
| Seed dev data                                                 | `backend/prisma/seed.js` → `npm -w backend run db:seed`                   |
| Add a new backend endpoint                                    | route in `backend/src/routes/X.routes.js` → controller → service          |
| Add validation to a backend endpoint                          | Zod schema in `backend/src/validators/schemas.js` → `validate({body})` in the route |
| Change RBAC (role gating)                                     | route: `requireRole(...)`; data: `backend/src/services/access.service.js` |
| Change AI behavior                                            | `backend/src/services/ai.service.js` — prompt build + HF call + fallback  |
| Add a new dashboard route                                     | (1) page in `frontend/src/app/dashboard/{role}/<route>/page.jsx` (2) `dashboardRoutePermissions.js` (3) `features/dashboard/config/navConfig.js` |
| Change NextAuth providers / callbacks                         | `frontend/src/auth.js`                                                    |
| Call backend from frontend                                    | `frontend/src/lib/api.js` — `await api("/path", { method, body })`        |
| Pick the right dashboard for a user with N roles              | `frontend/src/lib/roleRouter.js` → `resolveRoleDestination(roles)`        |
| Audit a sensitive action                                      | `import { audit } from "../services/audit.service.js"` then `await audit({ actor, action, entityType, … })` |
| Generate a pre-signed upload URL                              | `POST /uploads/presign` → `backend/src/controllers/uploads.controller.js` |
| Validate a client-supplied file URL                           | `backend/src/utils/fileUrl.js` — exact-host allowlist via `TRUSTED_UPLOAD_HOSTS` |

---

## 8. Backend → frontend coupling

Two integration surfaces. Don't conflate them.

**Direct API client** (most reads/writes)
- `frontend/src/lib/api.js` calls `process.env.NEXT_PUBLIC_BACKEND` with `Authorization: Bearer ${session.accessToken}`.
- Use this from client components.

**Next.js API proxy routes** (sparingly — only when the browser shouldn't see the upstream URL or when we need to set HttpOnly cookies)
- `frontend/src/app/api/admin/institutions/route.js`
- `frontend/src/app/api/admin/platform/overview/route.js`
- `frontend/src/app/api/student/{achievements,assignments,courses,dashboard}/route.js`
- `frontend/src/app/api/auth/internal/auth/sync/route.js` — OAuth → backend sync → sets `app_token` HttpOnly cookie
- `frontend/src/app/api/auth/[...nextauth]/route.js` — NextAuth handler

Both ways ultimately hit the same backend Express endpoints.

---

## 9. Environment variables (where each is read)

### Backend (`backend/src/config/env.js`)

Required in production: `JWT_SECRET`, `CORS_ORIGINS`, `OTP_HMAC_SECRET` (or falls back to `JWT_SECRET`).
Required at all times: `DATABASE_URL`.

| Var                       | Default                       | Used by                                  |
|---------------------------|-------------------------------|------------------------------------------|
| `DATABASE_URL`            | —                             | Prisma                                   |
| `PORT`                    | `4000`                        | `app.listen`                             |
| `NODE_ENV`                | `development`                 | toggles dev shortcuts                    |
| `CORS_ORIGINS`            | `http://localhost:3000`       | `config/cors.js` (required in prod)      |
| `CORS_ALLOW_NO_ORIGIN`    | `true` in dev                 | curl / server-to-server                  |
| `JSON_LIMIT`              | `100kb`                       | body parser                              |
| `TRUST_PROXY`             | `false`                       | behind a reverse proxy                   |
| `EXPOSE_ERROR_DETAILS`    | `true` in dev                 | error middleware stack/message leakage   |
| `JWT_SECRET`              | — (required prod)             | signs JWTs                                |
| `JWT_EXPIRES_IN`          | `7d`                          | JWT TTL                                  |
| `OTP_EXPIRES_MINUTES`     | `10`                          | OTP TTL                                  |
| `EXPOSE_OTP_IN_RESPONSE`  | `true` in dev                 | returns OTP in 202 response              |
| `OTP_HMAC_SECRET`         | falls back to `JWT_SECRET`    | HMAC key for OTP hashes                  |
| `RATE_LIMIT_WINDOW_MS`    | `60000`                       | global rate limit window                 |
| `RATE_LIMIT_MAX`          | `120`                         | global RPM per IP/user                   |
| `AUTH_RATE_LIMIT_MAX`     | `10`                          | tighter limit on `/auth/*`               |
| `REDIS_URL`               | — (optional)                  | distributed rate-limit store             |
| `HF_TOKEN`                | —                             | required for `POST /ai/chat`             |
| `HF_MODEL`                | `Qwen/Qwen2.5-7B-Instruct`    |                                          |
| `HF_PROVIDER`             | `together`                    |                                          |
| `MONGODB_URI`             | — (optional)                  | soft-connects at boot                    |
| `TRUSTED_UPLOAD_HOSTS`    | empty (no uploads accepted)   | comma-separated hosts for `fileUrl`      |
| `MAX_UPLOAD_BYTES`        | `20MB`                        | size cap for `/uploads/presign`          |
| `AUDIT_LOG_ENABLED`       | `true`                        | toggles `audit()` writes                 |

### Frontend (`frontend/src/auth.js` and `frontend/src/lib/api.js`)

| Var                           | Used by                                              |
|-------------------------------|------------------------------------------------------|
| `NEXT_PUBLIC_BACKEND`         | `src/lib/api.js` (client), `src/auth.js` (server), all Next.js API proxy routes |
| `NEXTAUTH_SECRET`             | `src/auth.js` — required                             |
| `NEXTAUTH_URL`                | NextAuth (production canonical URL)                  |
| `GITHUB_CLIENT_ID`            | GitHub provider                                      |
| `GITHUB_SECRET`               | GitHub provider                                      |
| `GOOGLE_CLIENT_ID`            | Google provider                                      |
| `GOOGLE_SECRET`               | Google provider                                      |

The frontend uses a single env var for the backend: `NEXT_PUBLIC_BACKEND`. Earlier drift to `BACKEND_URL` and `NEXT_PUBLIC_API_URL` has been removed; if you see those in a PR, reject them.

---

## 10. Running the monorepo

```bash
# from monorepo root
npm install              # installs workspaces

npm run dev              # turbo runs frontend dev (3000) + backend nodemon (4000)
npm run build            # turbo build (frontend Next build; backend is a no-op)
npm run lint             # turbo lint (Biome in both)
npm run format           # turbo format (Biome --write)

# backend-only
npm -w backend run db:migrate
npm -w backend run db:seed
```

Local startup order:
1. PostgreSQL running and `DATABASE_URL` reachable
2. (optional) Redis running and `REDIS_URL` set — improves rate limiting
3. (optional) MongoDB running and `MONGODB_URI` set — currently unused at runtime
4. `npm run dev` (or run each workspace separately)
5. Browser → `http://localhost:3000`

---

## 11. The known-broken list (current as of this snapshot)

If you fix one, cross it off here.

| # | What                                                                | Severity | Notes                                                                                  |
|---|---------------------------------------------------------------------|----------|----------------------------------------------------------------------------------------|
| 1 | `Course.price` units are ambiguous (paisa? INR?)                    | medium   | AI prompt says INR, schema is `Int @default(0)`; pick one and migrate                  |
| 2 | No automated backend tests                                          | medium   | `npm -w backend test` exits 1                                                          |
| 3 | AI chat has no session memory                                       | by design| Each request is independent; landing-page popup resets on close                        |
| 4 | `backend/.env.example` template hygiene                             | low      | `.gitignore` now allows the template via `!.env.example`, but the local copy still contains a real-looking HF_TOKEN — rotate before committing publicly. |

These are **observations**, not committed work. Don't claim any of them are fixed without verifying the actual change.

---

## 12. Conventions

- **ESM only.** `"type": "module"`; always `import x from "./y.js"` with the `.js` extension.
- **No TypeScript** despite `backend/prisma.config.ts`. Don't introduce TS without explicit go-ahead.
- **Biome** in both workspaces. Run `npm run format` before committing. Backend uses tabs; frontend uses 4 spaces (see `frontend/biome.json`).
- **Validation perimeter**: Zod schemas live in `backend/src/validators/schemas.js`; never inline body validation in services.
- **Service layer owns RBAC**: never trust `institutionId` or `createdById` from a request body — derive it from the loaded entity.
- **Error envelope**: `{ success: false, error: { code, message } }`. Throw `new AppError(msg, status, code)`; the error middleware does the rest.
- **Frontend authorization**: every dashboard route is locked to ONE role in `dashboardRoutePermissions.js`. Don't share pages across roles; create per-role pages and let `DashboardAuthGate` enforce.
- **No new top-level docs** (NOTES.md, ANALYSIS.md, etc.) unless asked. Update README/CLAUDE/ARCHITECTURE in place.

---

## 13. Things that look like bugs but aren't

- `prisma/seed.js` uses `findFirst + create` for `RoleAssignment` instead of `upsert`. Intentional — Postgres treats `NULL ≠ NULL` in unique constraints, so the compound upsert on `(userId, roleId, NULL)` is unreliable.
- OAuth-created users land with `passwordHash = "!oauth-disabled"`. Intentional — it's not a valid bcrypt hash, so credentials login can never succeed for OAuth-only accounts.
- `validateFileUrl` rejects userinfo-bearing URLs (`https://attacker.com@trusted/`). SSRF/phishing guard, not a leftover.
- Frontend `DashboardAuthGate` redirects to `/dashboard` (not `/403`) when roles are empty. That's the "session is racing with backend fetch" recovery path.
- Frontend session callback refreshes the backend profile at most once every 2 minutes — earlier code did it on every session read and hammered the backend.

---

## 14. Quick external-system map

| External service     | Used for                                          | Code path                                              |
|----------------------|---------------------------------------------------|--------------------------------------------------------|
| PostgreSQL           | All operational data + audit log                  | `backend/src/config/db.js`, all `services/*`           |
| Redis (optional)     | Distributed rate limiting                         | `backend/src/config/redis.js`, `middlewares/rateLimit.js` |
| MongoDB (optional)   | Legacy / future use; currently no runtime reads   | `backend/src/config/mongo.js`                          |
| Hugging Face         | Chat completion for landing-page AI popup         | `backend/src/services/ai.service.js`                   |
| Google OAuth         | Frontend social login                             | `frontend/src/auth.js`, backend `controllers/oauth.controller.js` |
| GitHub OAuth         | Frontend social login                             | same as above                                          |
| Cloudflare R2 (planned) | Submission file uploads                        | `backend/src/controllers/uploads.controller.js` (presign scaffolded; R2 SDK not wired) |

---

## 15. Essential AI-agent skills

Any AI model working here should actively use these skills. "Perfect" is impossible, but this protocol should make work predictable, safe, and easy to review.

### 15.1 Repository investigation

- Start at the runtime entrypoint, not the file that merely sounds relevant.
- Use `rg` / `rg --files` to find active imports, route registrations, and callers.
- Distinguish **confirmed** behavior from likely behavior. Confirmed means it is imported, registered, called, or exercised by a route/test.
- Read the exact route, controller, service, model/schema, and frontend caller before changing cross-boundary behavior.
- Treat dead-looking files carefully. Some are legacy and unused; do not delete or build on them without proving runtime connection.

### 15.2 Full-stack contract tracing

For any feature that touches both apps, trace the whole contract:

```
frontend page/component
  -> frontend helper or Next.js API route
  -> backend route
  -> middleware stack
  -> controller
  -> service
  -> Prisma model/query
  -> response shape
  -> frontend render state
```

Check path names, HTTP methods, request body shape, response envelope, role permissions, loading state, empty state, and error state.

### 15.3 Security and RBAC discipline

- Backend authorization is mandatory even when frontend gates exist.
- Never trust client-supplied ownership fields when the server can derive them.
- Preserve institution scope, batch scope, trainer assignment, and student current-batch checks.
- Put route-level roles in middleware and record-level authorization in services.
- Audit sensitive mutations with sanitized metadata.
- Do not log secrets, raw request bodies, OTPs, provider tokens, or full user records.

### 15.4 Data and migration discipline

- `backend/prisma/schema.prisma` is the schema authority.
- Use migrations for persistent schema changes.
- Update `prisma/seed.js` when local/dev data needs the new shape.
- Consider compound uniques, nullable `institutionId`, and Postgres `NULL` uniqueness behavior.
- Do not change enum values lightly; they affect persisted data and frontend role/status checks.

### 15.5 Frontend implementation discipline

- Match existing App Router patterns and local component style.
- For dashboard pages, update page file, permission map, and nav config together.
- Use `src/lib/api.js` for authenticated backend calls unless a Next.js proxy route is truly needed.
- Preserve role-scoped dashboard routes instead of sharing pages across roles by default.
- Handle loading, empty, error, and unauthorized states.
- Check mobile and desktop for dashboard shell/sidebar and text overflow issues.

### 15.6 Backend implementation discipline

- Route files wire middleware only.
- Controllers should be thin and boring.
- Services own business logic, Prisma calls, and record-level authorization.
- Zod schemas belong in validators; do not scatter ad-hoc body checks through services.
- Throw `AppError` with a useful code for expected failures.
- Keep ESM `.js` import extensions.

### 15.7 Verification discipline

Pick the smallest verification that proves the change:

| Change type | Minimum useful verification |
|---|---|
| Frontend route/component | `npm -w frontend run lint`; build or browser check for layout-sensitive work |
| Role routing/auth gate | `npm -w frontend run test` plus lint |
| Backend route/service | `npm -w backend run lint`; manual API check if no test exists |
| Prisma schema | migration command, Prisma generate if needed, seed when seed data changes |
| Full-stack contract | backend lint, frontend lint/test, and a browser/API smoke check |
| Docs only | read the changed docs and verify links/paths |

If a verification cannot run, say why and name the residual risk.

### 15.8 Communication discipline

- State what you inspected before editing.
- Explain high-risk assumptions.
- Keep summaries factual: files changed, behavior changed, verification run.
- Do not claim a bug is fixed until the code path and verification support it.
- Leave unrelated user changes untouched.

---

## 16. Step-by-step operating protocol for AI models

Follow this order for any non-trivial change:

1. **Orient**
   - Read this file.
   - Read `backend/CLAUDE.md` or `frontend/CLAUDE.md` based on the affected workspace.
   - Read [ARCHITECTURE.md](./ARCHITECTURE.md) for auth, RBAC, schema, or cross-app changes.

2. **Locate**
   - Use `rg --files` and `rg` to find entrypoints, imports, route registration, and callers.
   - Identify whether the file is active, legacy, generated, or test-only.

3. **Trace**
   - Follow request/render flow end to end.
   - Identify roles, institution scope, batch scope, request schema, and response shape.

4. **Plan narrowly**
   - Choose the smallest set of files that completes the behavior.
   - Reuse local patterns, helpers, widgets, validators, and services.
   - Avoid new dependencies unless the existing stack cannot reasonably solve it.

5. **Edit**
   - Keep unrelated formatting churn out.
   - Add comments only where they explain non-obvious decisions.
   - Update docs in the same change when behavior, env vars, routes, schema, or workflows change.

6. **Verify**
   - Run the narrow command that proves the edited surface.
   - For UI work, inspect the result in a browser when feasible.
   - For DB work, verify Prisma schema/migration/seed behavior.

7. **Report**
   - List changed files.
   - Summarize behavior in plain language.
   - Include commands run and whether they passed.
   - Call out anything not verified.

Emergency shortcut: if production is broken, first make the smallest reversible fix, then return to the full protocol for cleanup, tests, and docs.

---

## 17. Heuristics for AI agents

- **Adding a new endpoint?** Route → controller (5 lines) → service (all logic) → Zod schema for body. Then add the role to the route-level matrix in [ARCHITECTURE.md](./ARCHITECTURE.md).
- **Adding a new dashboard page?** (1) Create `frontend/src/app/dashboard/{role}/<slug>/page.jsx`; (2) Add `"/dashboard/{role}/<slug>": ["ROLE"]` to `dashboardRoutePermissions.js`; (3) Add nav entry in `features/dashboard/config/navConfig.js`.
- **Adding a new model?** Edit `prisma/schema.prisma` → `npm -w backend run db:migrate -- --name <slug>` → update `seed.js` if it needs seed data → reflect new fields in `services/` and any frontend consumers.
- **Touching auth?** Read `backend/src/middlewares/auth.js`, `services/access.service.js`, and `frontend/src/auth.js` in that order. The two layers are intentional.
- **Touching AI?** All of it lives in `backend/src/services/ai.service.js`. Don't add new AI integrations elsewhere.
- **Don't introduce new dependencies** without a clear reason. The stack listed in §4 is the stack.
- **Don't create new top-level markdown** (NOTES.md, REVIEW.md, etc.) unless asked. Update CLAUDE/README/ARCHITECTURE in place.
- **Trust the existing CLAUDE.md / .agent.md.** When in doubt about intent, this file and `.agent.md` are authoritative.

---

## 18. When this file drifts

If something material changes in `src/` or `prisma/`, update the relevant section here in the same change. Sections most likely to go stale: §2 (layout), §5 (roles), §9 (env vars), §11 (known broken list).
