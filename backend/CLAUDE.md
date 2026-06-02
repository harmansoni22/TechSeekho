# Backend CLAUDE.md - Express API workspace briefing

Read the monorepo-level [../CLAUDE.md](../CLAUDE.md) first. This file is the backend-specific quick map for agents working inside `backend/`.

## What this workspace owns

The backend is the source of truth for operational data, authorization, auditing, uploads, and AI chat. It is an ESM Node service using Express 5, Prisma 7, PostgreSQL, optional Redis rate limiting, optional MongoDB boot connection, and Hugging Face chat completion.

Do not put business logic in routes. The backend shape is:

```
src/server.js
  -> src/app.js
     -> middlewares/securityHeaders.js
     -> cors(config/cors.js)
     -> express body parsers
     -> middlewares/rateLimit.js
     -> routes/index.js
        -> routes/*.routes.js
           -> controllers/*.controller.js
              -> services/*.service.js
                 -> config/db.js (Prisma)
```

## Commands

Run from the monorepo root unless you are intentionally scoped to `backend/`.

```bash
npm -w backend run dev
npm -w backend run start
npm -w backend run lint
npm -w backend run format
npm -w backend run db:migrate
npm -w backend run db:seed
```

`npm -w backend test` is not useful yet; it intentionally exits with "no test specified".

## Key files

| Task | File |
|---|---|
| Boot server | `src/server.js` |
| Express middleware order | `src/app.js` |
| Route registration | `src/routes/index.js` |
| Env parsing/defaults | `src/config/env.js` |
| Prisma client | `src/config/db.js` |
| Auth middleware | `src/middlewares/auth.js` |
| Service RBAC helpers | `src/services/access.service.js` |
| Zod request schemas | `src/validators/schemas.js` |
| Validation middleware | `src/middlewares/validate.js` |
| Error class/envelope | `src/utils/appError.js`, `src/middlewares/errorHandler.js` |
| Audit helper | `src/services/audit.service.js` |
| Upload URL safety | `src/controllers/uploads.controller.js`, `src/utils/fileUrl.js` |
| AI assistant | `src/routes/ai.routes.js`, `src/services/ai.service.js` |
| Prisma schema/seed | `prisma/schema.prisma`, `prisma/seed.js` |

## Request lifecycle rules

1. Add or change the route in `src/routes/*.routes.js`.
2. Put request validation in a Zod schema, then wire it with `validate({ body, params, query })`.
3. Keep controllers thin: parse `req`, call service, shape response.
4. Put all authorization, scoping, ownership checks, and Prisma calls in services.
5. Throw `new AppError(message, statusCode, code)` for expected failures.
6. Let `errorHandler` produce the response envelope.

Every protected route should compose `authenticate`, role middleware such as `requireRole(...)`, and when needed `requireOperationalAccess` or service-level batch/institution guards.

## Auth and RBAC

Backend JWTs are the real API credential. `authenticate`:

- Extracts `Authorization: Bearer <token>`.
- Verifies JWT through `utils/auth.js`.
- Loads an ACTIVE user and their `roleAssignments`.
- Attaches `req.user` with deduped `roles` plus institution-scoped `roleAssignments`.
- Rejects users with no roles.

Use these layers intentionally:

- `requireRole(...)`: coarse route-level gate.
- `requireOperationalAccess`: non-super-admin users must have at least one institution-linked role.
- `requireInstitutionScope`: checks an explicit `institutionId` when the route exposes one.
- `services/access.service.js`: source for batch ownership checks (`assertCanAccessBatch`, `assertCanManageBatch`) and profile lookups.

Never trust `institutionId`, `createdById`, `studentId`, or `trainerId` from the client when it can be derived from the authenticated user, batch, assignment, assessment, or profile.

## Data model mental model

`User` has zero or more `RoleAssignment` rows. Institution-scoped roles carry `institutionId`; `SUPER_ADMIN` can be global. Students have `StudentProfile.currentBatchId`; trainers have `TrainerProfile` plus `BatchTrainer` assignments; admins have `AdminProfile`.

Operational data centers on:

- `Institution`
- `Course`
- `Batch`
- `Attendance`
- `Assignment` / `Submission`
- `Assessment` / `AssessmentSubmission`
- `LearningPath` / `LearningModule` / `PathEnrollment` / `ModuleProgress`
- `AuditLog`

Raw operational records should remain the durable truth. Dashboard projections, AI summaries, and analytics should read from raw data, not overwrite it.

## Endpoint map

Registered in `src/routes/index.js`:

| Prefix | Purpose |
|---|---|
| `/health` | liveness |
| `/auth` | register, OTP login, profile |
| `/oauth` | Google/GitHub token verification and backend JWT issue |
| `/admin` | SUPER_ADMIN-only platform governance (overview, roles, audit, config) |
| `/admin-ops` | institution-scoped ADMIN operations: dashboard overview/analytics, student & trainer onboarding (manual + bulk), institution rosters, member status |
| `/courses` | course catalog and course detail |
| `/assignments` | assignment create/list/submit/review |
| `/assessments` | assessments and submissions |
| `/modules` | learning module/progress operations |
| `/attendance` | attendance operations |
| `/products` | product/store catalog |
| `/ai` | landing-page AI assistant |
| `/student` | student dashboard resources |
| `/uploads` | presign scaffold and upload metadata |
| `/users` | user profile/update operations |
| `/` | management routes from `management.routes.js` |

Check the concrete route file before assuming an endpoint exists.

## Environment

`src/config/env.js` is the authority. Production requires `JWT_SECRET`, `CORS_ORIGINS`, and effectively a secure OTP secret (`OTP_HMAC_SECRET` or `JWT_SECRET`). `DATABASE_URL` is required. Redis (`REDIS_URL`) and Mongo (`MONGODB_URI`) are optional. `HF_TOKEN` is required for real AI chat.

Keep `.env.example` sanitized. If a token-looking value appears there, treat it as leaked and rotate it.

## Security notes

- Passwords use bcrypt.
- OTPs are HMAC-SHA256 hashed with a server-side secret and have attempt limits.
- API auth is bearer-token based; do not add cookie-only backend auth without a design pass.
- Rate limiting is Redis-backed when available and falls back to in-memory by default.
- `validateFileUrl` rejects untrusted hosts, userinfo URLs, unsafe protocols, and non-HTTPS URLs in production.
- `audit()` must receive sanitized metadata. Do not log raw request bodies, secrets, or full records.

## Known sharp edges

- Backend has no automated test suite yet.
- Mongo wiring (`src/config/mongo.js`) is optional/legacy; do not build new runtime features on Mongoose without confirming intent.
- `Course.price` is an `Int` but the unit is not clearly documented.
- Upload presign is scaffolded; `pipelineReady` can be false until object storage is wired.
- OAuth-created users intentionally have `passwordHash = "!oauth-disabled"`.

## Change checklist

- New endpoint: route, controller, service, Zod schema, role gate, error codes.
- New protected data access: derive scope server-side and use `access.service.js` helpers.
- New model/field: update `prisma/schema.prisma`, create migration, update seed when useful.
- Sensitive mutation: add an `audit()` call with sanitized before/after metadata.
- Frontend-facing contract change: update frontend API callers and the root `ARCHITECTURE.md`.
- Material behavior change: update this file and [../CLAUDE.md](../CLAUDE.md).

## Backend AI-agent operating steps

Use this sequence when editing backend behavior:

1. Read `src/routes/index.js` and the specific `*.routes.js` file.
2. Read the controller and service used by that route.
3. Check middleware order: `authenticate`, `requireRole`, `requireOperationalAccess`, validation, and rate limits.
4. Check Prisma models and relations in `prisma/schema.prisma`.
5. Find all callers with `rg`, including frontend API usage.
6. Make the change in service/controller/validator layers according to ownership rules.
7. Add or update `audit()` for sensitive mutations.
8. Run `npm -w backend run lint` at minimum.
9. If schema changed, run the relevant Prisma migration/generate/seed command.
10. Update root docs if endpoint, schema, env, auth, upload, or AI behavior changed.

Essential backend skills:

- Express middleware composition.
- Prisma relation queries and migrations.
- JWT authentication and role/institution/batch scoping.
- Zod validation and stable error envelopes.
- Secure file URL handling and upload constraints.
- Audit-log hygiene.
- Reading frontend callers before changing response contracts.
