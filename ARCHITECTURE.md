# Architecture — TechSeekhoApp

Deep dive on the runtime architecture of the monorepo. For orientation, read [README.md](./README.md). For the AI-agent briefing, read [CLAUDE.md](./CLAUDE.md). For workspace-specific detail, see [backend/CLAUDE.md](./backend/CLAUDE.md) and [frontend/CLAUDE.md](./frontend/CLAUDE.md).

Contents:
1. [Topology](#1-topology)
2. [Backend process lifecycle](#2-backend-process-lifecycle)
3. [Backend middleware pipeline](#3-backend-middleware-pipeline)
4. [Backend request flow (worked example)](#4-backend-request-flow-worked-example)
5. [Frontend rendering & auth gates](#5-frontend-rendering--auth-gates)
6. [Auth flows](#6-auth-flows)
7. [RBAC](#7-rbac)
8. [Data model](#8-data-model)
9. [AI assistant pipeline](#9-ai-assistant-pipeline)
10. [Audit logging](#10-audit-logging)
11. [Uploads pipeline](#11-uploads-pipeline)
12. [Error handling](#12-error-handling)
13. [Security posture](#13-security-posture)
14. [Operational notes](#14-operational-notes)

---

## 1. Topology

```
                    ┌──────────────────────────────────────┐
                    │            Browser (user)            │
                    └──────────────────┬───────────────────┘
                                       │
                              http(s)  │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │   Next.js 16 (frontend, port 3000)   │
                    │   ┌──────────────────────────────┐   │
                    │   │  App Router pages            │   │
                    │   │   /landingpage   /dashboard  │   │
                    │   │   /login         /signup     │   │
                    │   │   /pending-approval  /403    │   │
                    │   ├──────────────────────────────┤   │
                    │   │  /api routes                 │   │
                    │   │   /api/auth/[...nextauth]    │   │
                    │   │   /api/auth/internal/...     │   │
                    │   │   /api/admin/... proxies     │   │
                    │   │   /api/student/... proxies   │   │
                    │   ├──────────────────────────────┤   │
                    │   │  features/dashboard          │   │
                    │   │  lib/api.js (fetch wrapper)  │   │
                    │   │  auth.js  (NextAuth config)  │   │
                    │   └──────────────────────────────┘   │
                    └──────────────────┬───────────────────┘
                                       │
                  Authorization: Bearer JWT (from NextAuth session)
                                       ▼
                    ┌──────────────────────────────────────┐
                    │    Express 5 (backend, port 4000)    │
                    │   security → CORS → body → rateLimit │
                    │       → routes/index.js              │
                    │       → controllers (thin)           │
                    │       → services (all logic + RBAC)  │
                    │       → Prisma                        │
                    └─┬──────────┬───────────┬─────────────┘
                      │          │           │
                      ▼          ▼           ▼
              ┌───────────┐ ┌────────┐ ┌────────────────┐
              │PostgreSQL │ │ Redis  │ │ Hugging Face   │
              │ (Prisma)  │ │(option)│ │ (Qwen via      │
              └───────────┘ └────────┘ │  together)     │
                                       └────────────────┘
              ┌───────────────┐
              │  MongoDB      │  (legacy/optional; no runtime reader today)
              └───────────────┘

              ┌─────────────────────────┐
              │ Google / GitHub OAuth   │  (frontend NextAuth → backend re-verifies)
              └─────────────────────────┘
```

The frontend and backend are independently deployed processes. Turbo orchestrates them in dev (`npm run dev`). In production they typically run on different hostnames/services; the only required coupling is `NEXT_PUBLIC_BACKEND` pointing at the backend's public URL.

---

## 2. Backend process lifecycle

`backend/src/server.js`:

```
node src/server.js
        │
        ├── dotenv loads .env (prefers repo-root .env, falls back to backend-local)
        ├── env.js parses + freezes; throws if prod misses required vars
        ├── if MONGODB_URI set → connectMongo() (soft, logs warning on failure)
        ├── app.listen(env.port)
        │
        └── SIGINT / SIGTERM → server.close()
                                 → prisma.$disconnect()
                                 → closeRedis()
                                 → exit(0)
                              (or exit(1) after 10s timeout)
```

There is no cluster, worker pool, or scheduled job runner. Anything that needs persistence lives in PostgreSQL or, for rate-limit counters, in Redis or an in-memory `Map` (cleaned every 60 s).

---

## 3. Backend middleware pipeline

`backend/src/app.js` is the canonical wiring order. Add new middleware **before** routes unless it's an error handler.

```
┌─────────────────────────────────────────────────────────────────┐
│  app.disable("x-powered-by")                                    │
│  app.set("trust proxy", 1)         if TRUST_PROXY=true          │
│                                                                 │
│  securityHeaders                   CSP, COOP, HSTS (prod), etc. │
│  cors(corsOptions)                 origin allowlist             │
│  express.json({ limit })           default 100kb                │
│  express.urlencoded({ extended:false, limit })                  │
│  rateLimit({ windowMs, max, keyPrefix:"api" })                  │
│                                                                 │
│  app.use("/", routes)              backend/src/routes/index.js  │
│                                                                 │
│  notFound                          unmatched → AppError 404     │
│  errorHandler                      uniform { success, error }   │
└─────────────────────────────────────────────────────────────────┘
```

**Security headers** (`middlewares/securityHeaders.js`):
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-site`
- `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; form-action 'none'; base-uri 'none'`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (production only)

**CORS** (`config/cors.js`): methods `GET/POST/PUT/PATCH/DELETE/OPTIONS`, allowed headers `Content-Type, Authorization`, `credentials: true`, preflight cached 600 s. Rejections throw `AppError(403, CORS_ORIGIN_BLOCKED|CORS_ORIGIN_REQUIRED)`.

**Rate limit** (`middlewares/rateLimit.js`):
- Key prefers `user:${req.user.id}` over `ip:${ip}` — more resistant to NAT aggregation.
- Primary store: Redis `INCR` + `PEXPIRE` (pipelined). Fallback: per-process `Map`.
- `failClosed: false` by default — if Redis is unreachable, the limiter degrades to in-memory rather than blocking traffic. Pass `failClosed: true` on individual limiters that should hard-fail.
- Sets `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` on every response; `Retry-After` on 429.
- Global: 120 req/min/key. `/auth/*`: tightened to 10/min. `/uploads/presign`: 30/min.

---

## 4. Backend request flow (worked example)

`POST /assignments/:id/submit` is the canonical example because it exercises every layer.

```
[client]
  POST /assignments/asm_abc/submit
  Authorization: Bearer eyJ…
  { submissionText: "…", fileUrl: "https://cdn.techseekho.com/…" }

  ▼

[routes/assignments.routes.js]
  router.use(authenticate)
  router.use(requireOperationalAccess)
  router.post("/:id/submit",
              requireRole("STUDENT"),
              validate({ body: submitAssignmentSchema }),
              submitAssignmentController)

  ▼

[controllers/assignments.controller.js]
  submitAssignmentController(req, res):
    submission = await submitAssignment(req.user, req.params.id, req.body)
    res.status(200).json({ data: submission })

  ▼

[services/assignments.service.js#submitAssignment]
  assignment = prisma.assignment.findUnique(id)
  student    = getStudentProfileOrThrow(user.id)
  guard:     student.currentBatchId === assignment.batchId        ← batch ownership
  guard:     submissionText || fileUrl present
  safeUrl    = validateFileUrl(payload.fileUrl)                   ← trusted-host allowlist
  return prisma.submission.upsert({
    where:   { assignmentId_studentId: { assignmentId, studentId } },
    update:  { submissionText, fileUrl: safeUrl, status: "SUBMITTED", submittedAt: now },
    create:  { …, institutionId: assignment.institutionId }       ← server-derived
  })

  ▼  (on throw)

[middlewares/errorHandler.js]
  { success: false, error: { code, message } }
  statusCode preserved from AppError; 5xx message hidden unless EXPOSE_ERROR_DETAILS
```

`req.user` shape after `authenticate`:

```js
{
  id: "cuid…",
  name: "Ali Hassan",
  email: "student1.lahore@techseekho.dev",
  phone: null,
  status: "ACTIVE",
  isEmailVerified: true,
  isPhoneVerified: false,
  roles: ["STUDENT"],                                  // deduped names
  roleAssignments: [
    { role: "STUDENT", institutionId: "ins_lhr" }       // preserves institution scope
  ]
}
```

---

## 5. Frontend rendering & auth gates

`frontend/src/app/layout.js` wraps the entire app in `<Providers>` (which is just `<SessionProvider>` from NextAuth). The dashboard layout adds two theme providers and the `<DashboardAuthGate>`:

```
RootLayout
  └─ Providers (SessionProvider)
       ├─ /landingpage          ← public, no auth
       ├─ /login                ← public; redirects to dashboard on success
       ├─ /signup               ← public
       ├─ /pending-approval     ← authenticated but no role assigned
       ├─ /403                  ← authenticated but wrong role for this route
       └─ /dashboard layout
            ├─ DashboardThemeProvider
            ├─ RoleThemeProvider
            └─ DashboardAuthGate
                 ├─ unauthenticated → /login?next=<currentPath>
                 ├─ authenticated, no roles → /dashboard (re-router)
                 ├─ route not in permissions map → /dashboard
                 ├─ role not allowed → /403
                 └─ allowed → render <SideBar /> + <children />
```

`/dashboard/page.jsx` is the **entry router**: it calls `resolveRoleDestination(roles)` and `router.replace()` to the role's home, or `/pending-approval` if no known role.

---

## 6. Auth flows

### 6.1 OTP register

```
Client                                Server                                DB
  │                                     │                                     │
  │── POST /auth/register ──────────────▶│                                     │
  │   { fullName, email|phone,          │                                     │
  │     password }   (no otp)            │                                     │
  │                                     │ validate inputs; ensure no existing │
  │                                     │ user with that contact              │
  │                                     │── invalidate prior unconsumed       │
  │                                     │   ContactVerification rows ───────▶ │
  │                                     │── insert ContactVerification        │
  │                                     │   { otpHash = HMAC-SHA256(otp),     │
  │                                     │     purpose: SIGNUP }         ────▶ │
  │◀── 202 { expiresAt, otp? } ─────────│                                     │
  │   (otp only in dev)                  │                                     │
  │                                     │                                     │
  │── POST /auth/register (with otp) ───▶│                                     │
  │                                     │ consumeOtp → not consumed,          │
  │                                     │   not expired, attempts < max,      │
  │                                     │   otpHash === HMAC(otp)             │
  │                                     │── createUser ──────────────────────▶│
  │                                     │   User + StudentProfile +           │
  │                                     │   RoleAssignment(STUDENT, null)     │
  │◀── 201 { user, token } ─────────────│                                     │
```

### 6.2 OTP login

Same two-step shape, but the service also verifies the password (bcrypt), and on success bumps `lastLoginAt` and the matching `isEmail/PhoneVerified` flag.

### 6.3 OAuth (NextAuth → backend)

```
Frontend NextAuth                    Backend                              Provider
        │                              │                                     │
        │ user clicks Google/GitHub    │                                     │
        │── redirect to provider ─────▶│                                     │
        │── callback ──────────────────│                                     │
        │                              │                                     │
        │  jwt() callback fires        │                                     │
        │  account.type !== "credentials"                                    │
        │   ↓                                                                │
        │  exchangeOAuthWithBackend({ provider, providerAccountId,          │
        │       email, fullName, avatarUrl, accessToken, idToken })          │
        │── POST /oauth/login ─────────▶│                                     │
        │                              │── verify token with provider ───────▶│
        │                              │   google: tokeninfo / userinfo      │
        │                              │   github: /user + /user/emails      │
        │                              │◀── 200 ─────────────────────────────│
        │                              │ email exists → update fullName,     │
        │                              │   avatarUrl, isEmailVerified=true   │
        │                              │ else → create User with             │
        │                              │   passwordHash="!oauth-disabled",   │
        │                              │   StudentProfile, RoleAssignment    │
        │                              │   (STUDENT, institutionId=null)     │
        │                              │ sign JWT (iss=techseekho-api,       │
        │                              │           aud=techseekho-app)       │
        │◀── 200 { user, token } ──────│                                     │
        │  token.accessToken = backend's JWT                                  │
```

OAuth-created users land with no institution → `requireOperationalAccess` will fail on operational endpoints until an admin assigns them.

### 6.4 JWT verification on every authed backend request

```
authenticate(req):
  token = extractBearerToken(req.headers.authorization)
  decoded = jwt.verify(token, JWT_SECRET, { issuer:"techseekho-api", audience:"techseekho-app" })
  user = prisma.user.findUnique({ where: { id: decoded.id }, include: roleAssignments+role })
  require: user && user.status === "ACTIVE" && user.roles.length > 0
  req.user = { id, name, email, phone, status, isEmail/PhoneVerified, roles, roleAssignments }
```

### 6.5 Session-callback freshness throttle

`frontend/src/auth.js` session callback used to fetch `/auth/profile` on every session read. It now refreshes at most every **2 minutes** (`PROFILE_REFRESH_MS = 2 * 60 * 1000`) and stamps `token.lastProfileFetchAt`. Client code can force-refresh via `useSession().update()` (sets `trigger === "update"` which resets the stamp).

---

## 7. RBAC

### 7.1 Roles & scopes

| Role                       | Scope                  | Profile             | Notes                                          |
|----------------------------|------------------------|---------------------|------------------------------------------------|
| `SUPER_ADMIN`              | Global                 | none                | `RoleAssignment.institutionId = null`          |
| `ADMIN`                    | One institution        | `AdminProfile`      | Campus director                                |
| `INSTITUTION_COORDINATOR`  | One institution        | none                | Projection/report-only visibility              |
| `TRAINER`                  | Institution + N batches| `TrainerProfile`    | m2m via `BatchTrainer`                         |
| `STUDENT`                  | Institution + 1 batch  | `StudentProfile`    | `currentBatchId`                               |

### 7.2 Backend gating layers

| Concern                                   | Where                | Mechanism                                                                       |
|-------------------------------------------|----------------------|---------------------------------------------------------------------------------|
| Is this role allowed?                     | Route                | `requireRole("STUDENT", "TRAINER", …)`                                          |
| Has the user been onboarded?              | Route                | `requireOperationalAccess` — SUPER_ADMIN ∨ ≥1 institution-scoped role           |
| Is `institutionId` in the URL/body theirs?| Route (rare)         | `requireInstitutionScope`                                                       |
| Can they touch this batch (read)?         | Service              | `assertCanAccessBatch(user, batchId)`                                           |
| Can they manage this batch (write)?       | Service              | `assertCanManageBatch(user, batchId)`                                           |
| Is this institution theirs?               | Service              | `assertInstitutionAccess(user, instId)` (in `management.service.js`)            |

### 7.3 Access decision tree (`access.service.js`)

```
assertCanAccessBatch(user, batchId):
  batch = load(batchId)
  if SUPER_ADMIN                                                  → ALLOW
  if ADMIN AND roleAssignment for batch.institutionId             → ALLOW
  if TRAINER AND BatchTrainer(batchId, trainerProfile)            → ALLOW
  if STUDENT AND studentProfile.currentBatchId === batchId        → ALLOW
  otherwise                                                       → 403

assertCanManageBatch(user, batchId):
  same as above, MINUS the student branch.
```

### 7.4 Frontend dashboard gating

`frontend/src/app/dashboard/dashboardRoutePermissions.js` is the authoritative map of `path → [allowedRoles]`. `DashboardAuthGate` (mounted in the dashboard layout) does the longest-prefix match via `resolveAllowedRolesForPath()` and redirects:

- not authenticated → `/login?next=…`
- authenticated, no roles → `/dashboard` (re-router)
- route not in permissions map → `/dashboard` (developer oversight, not access denial)
- role mismatch → `/403`

Per the doc-comment in `dashboardRoutePermissions.js`: **never share a dashboard page across roles.** Create per-role pages and let the gate decide.

### 7.5 Route → role matrix (backend)

Quick reference. Source of truth is the per-feature route file.

| Route group        | Endpoint                                       | Allowed roles                                       |
|--------------------|------------------------------------------------|-----------------------------------------------------|
| Public             | `/health`, `/courses/*`, `/products/*`, `/auth/*`, `/oauth/login` | anyone                          |
| AI                 | `POST /ai/chat`                                | STUDENT, TRAINER, ADMIN, SUPER_ADMIN                |
| Users              | `GET /users`                                   | ADMIN, SUPER_ADMIN (auto institution-scoped)        |
| Admin              | `GET /admin/platform/overview`                 | SUPER_ADMIN                                         |
| Institutions       | `GET /institutions`                            | ADMIN, SUPER_ADMIN                                  |
|                    | `POST /institutions`                           | SUPER_ADMIN (service-enforced)                      |
|                    | `PATCH /institutions/:id`                      | ADMIN, SUPER_ADMIN                                  |
| Batches            | `GET /batches`                                 | STUDENT, TRAINER, ADMIN, SUPER_ADMIN                |
|                    | `POST /batches`                                | ADMIN, SUPER_ADMIN                                  |
|                    | `PATCH /batches/:id`                           | TRAINER, ADMIN, SUPER_ADMIN                         |
|                    | `POST /batches/:id/{trainers,students}`        | ADMIN, SUPER_ADMIN                                  |
| Announcements      | `GET /announcements`                           | STUDENT, TRAINER, ADMIN, SUPER_ADMIN                |
|                    | `POST /announcements`                          | TRAINER, ADMIN, SUPER_ADMIN                         |
| Assignments        | `GET /assignments`, `/:id`                     | STUDENT, TRAINER, COORDINATOR, ADMIN, SUPER_ADMIN   |
|                    | `POST /assignments`                            | TRAINER, COORDINATOR, ADMIN, SUPER_ADMIN            |
|                    | `POST /assignments/:id/submit`                 | STUDENT                                             |
|                    | `GET /assignments/submissions`                 | TRAINER, COORDINATOR, ADMIN, SUPER_ADMIN            |
|                    | `PATCH /assignments/submissions/:id/review`    | TRAINER, COORDINATOR, ADMIN, SUPER_ADMIN            |
| Assessments        | same shape as assignments                      | same                                                |
| Attendance         | `GET /attendance`                              | STUDENT (self-scoped), TRAINER, ADMIN, SUPER_ADMIN  |
|                    | `POST /attendance`, `/attendance/bulk`         | TRAINER, ADMIN, SUPER_ADMIN                         |
| Modules            | `GET /modules`                                 | STUDENT, TRAINER, ADMIN, SUPER_ADMIN                |
|                    | `POST /modules`, `/:pathId/modules`            | TRAINER, ADMIN, SUPER_ADMIN                         |
|                    | `PATCH /modules/items/:moduleId`               | TRAINER, ADMIN, SUPER_ADMIN                         |
|                    | `POST /modules/:pathId/enroll`                 | STUDENT                                             |
|                    | `PATCH /modules/items/:moduleId/progress`      | STUDENT                                             |
| Student dashboard  | `/student/*`                                   | STUDENT (operational access required)               |
| Uploads            | `POST /uploads/presign`                        | STUDENT, TRAINER, COORDINATOR, ADMIN, SUPER_ADMIN   |
| Auth profile       | `GET /auth/profile`                            | any authed user                                     |

---

## 8. Data model

ASCII ERD grouping (cardinalities; `→` is "1 to many" unless noted):

```
User ─→ RoleAssignment ←─ Role
  │       │
  │       └─ optional institutionId → Institution
  │
  ├─ optional StudentProfile ─→ Submission, AssessmentSubmission, Attendance,
  │                              PathEnrollment ─→ ModuleProgress,
  │                              StudentStreak (1:1), DailyGoal, StudentActivity,
  │                              UserAchievement ─→ Achievement
  │
  ├─ optional TrainerProfile ─→ BatchTrainer ─→ Batch, Assignment, Assessment
  ├─ optional AdminProfile
  ├─ Announcement (as author)
  └─ ContactVerification

Institution ─→ Batch ─→ Course
                │
                ├─→ BatchTrainer ←─ TrainerProfile
                ├─→ StudentProfile.currentBatch (1 batch ← many students)
                ├─→ Assignment ─→ Submission
                ├─→ Assessment ─→ AssessmentSubmission
                ├─→ Attendance
                └─→ Announcement

Course ─→ LearningPath ─→ LearningModule
                  ↑               ↑
                  │               │
              PathEnrollment ─→ ModuleProgress
                  ↑
                  └─ StudentProfile

(LearningPath.institutionId is nullable → null means "global path".)

AuditLog (append-only)
  ── actorId, actorRole, action, entityType, entityId,
     institutionId, metadata (JSON), ipAddress, userAgent, createdAt
```

### 8.1 Enums

| Enum                | Values                                                     |
|---------------------|------------------------------------------------------------|
| `UserStatus`        | `ACTIVE`, `INACTIVE`, `SUSPENDED`                          |
| `InstitutionType`   | `SCHOOL`, `COLLEGE`, `GOVERNMENT`, `PRIVATE`               |
| `EnrollmentStatus`  | `OPEN`, `CLOSED`, `UPCOMING`                               |
| `AttendanceStatus`  | `PRESENT`, `ABSENT`, `LATE`                                |
| `AssignmentStatus`  | `PENDING`, `SUBMITTED`, `REVIEWED`                         |
| `ContactType`       | `EMAIL`, `PHONE`                                           |
| `OtpPurpose`        | `SIGNUP`, `LOGIN`                                          |
| `AssessmentType`    | `QUIZ`, `TEST`, `EXAM`, `PROJECT`                          |
| `AssessmentStatus`  | `DRAFT`, `PUBLISHED`, `CLOSED`                             |

### 8.2 Identity & compound uniques

- All primary keys are `cuid()` strings.
- `User.email` and `User.phone` are both unique and both optional.
- Compound uniques that matter when writing services:
  - `RoleAssignment(userId, roleId, institutionId)` — but Postgres treats `NULL ≠ NULL`; seed uses `findFirst + create` instead of upsert. Don't "fix" this back to upsert.
  - `BatchTrainer(batchId, trainerId)`
  - `Submission(assignmentId, studentId)`
  - `AssessmentSubmission(assessmentId, studentId)`
  - `Attendance(batchId, studentId, date)`
  - `PathEnrollment(studentId, pathId)`
  - `ModuleProgress(enrollmentId, moduleId)`
  - `StudentProfile.userId`, `TrainerProfile.userId`, `AdminProfile.userId` (1:1 with User)

### 8.3 Caveats baked into the schema

- `Course.price` is `Int @default(0)` with no unit comment; the AI prompt says INR; legacy notes mentioned paisa. Pick one before doing anything price-sensitive.
- `LearningPath.difficulty` is a free-form `String?` (`BEGINNER` / `INTERMEDIATE` / `ADVANCED`) — not an enum.
- `StudentActivity.type` is a free-form `String` with conventional values (`LESSON_COMPLETED`, `ASSIGNMENT_SUBMITTED`, `COURSE_ENROLLED`, …).

---

## 9. AI assistant pipeline

`POST /ai/chat` → `validateChatMessage` (length 1–2000) → `sendChatMessage` → `processChatMessage`:

```
processChatMessage(message):
  guard: non-empty string

  system prompt = [
    "You are TechSeekho's AI learning assistant.",
    "Answer briefly, clearly, and helpfully.",
    "Recommend only TechSeekho courses from the provided catalog when asked about learning paths.",
    "If a user asks for a fact not present in the provided context, say you do not know instead of inventing it.",
    "Keep answers under 120 words unless the user explicitly asks for more detail.",
    "All prices are in INR.",
    "",
    "Available TechSeekho courses:",
    <11 courses from backend/src/data/courses.data.js, one per line>
  ]

  candidates = [
    { model: env.hfModel, provider: env.hfProvider },
    { model: "Qwen/Qwen2.5-7B-Instruct", provider: "together" }
  ]  (deduped)

  for each candidate:
    try hfClient.chatCompletion({ model, provider, messages, temperature:0.4, max_tokens:220 })
    if error matches /not_supported|not supported by any provider|not been able to find inference provider/:
      continue
    else:
      throw

  return { response, timestamp, messageId }
```

What this design does **not** have:
- No conversation history. Every call is independent.
- No retrieval / RAG layer. The full course catalog is in the prompt every time.
- No streaming. Whole response is returned in one shot.
- No content moderation pre/post filter beyond Hugging Face's own.

If you add session memory, the natural shape is a `ChatSession` model + a `messages` parameter on the service. Keep all of it in `services/ai.service.js`.

---

## 10. Audit logging

`backend/src/services/audit.service.js` writes append-only `AuditLog` rows. Usage:

```js
await audit({
  actor: req.user,
  action: "submission.review",
  entityType: "Submission",
  entityId: submissionId,
  institutionId: submission.institutionId,
  metadata: { previousStatus, previousScore, nextScore, maxScore },
  req,                                  // for ip + ua
});
```

Rules baked in:
1. Fire-and-forget. The operation **never blocks** on the audit write. A `try/catch` swallows DB errors and `console.error`s them.
2. Toggleable via `AUDIT_LOG_ENABLED` (default `true`).
3. Actor's "primary role" is picked in priority order: SUPER_ADMIN > ADMIN > COORDINATOR > TRAINER > STUDENT.
4. `metadata` is for *sanitized* deltas — never raw request bodies, never secrets, never full record contents. Store ids + before/after.
5. Reads `x-forwarded-for` first (when proxied), falls back to `req.ip` / `socket.remoteAddress`. UA is truncated to 500 chars.

Currently `assignments.service.js#reviewSubmission` is the canonical caller. Extend to: attendance edits, role reassignments, institution updates, batch transfers.

---

## 11. Uploads pipeline

`POST /uploads/presign` (`controllers/uploads.controller.js`) is the **only sanctioned** way for a client to obtain a URL that's later acceptable as `fileUrl` on a submission. It:

1. Rate-limits to 30/min/user (`presignLimiter`).
2. Validates `kind ∈ {SUBMISSION, AVATAR}`, mime against an allowlist per kind (e.g. `SUBMISSION` allows `application/pdf`, `application/zip`, `text/markdown`, `image/png|jpeg|webp`).
3. Validates `filename` matches `^[A-Za-z0-9._-]+$` and is ≤255 chars.
4. Validates `sizeBytes ≤ env.maxUploadBytes` (default 20 MB).
5. Builds a deterministic object key: `${kind.toLowerCase()}/${institutionId|global}/${userId}/${Date.now()}-${nonce}-${filename}`.
6. Returns `{ key, uploadUrl, method:"PUT", expiresInSeconds:300, maxBytes, fileUrl, pipelineReady }`.

`pipelineReady` is `false` while no R2 SDK is wired in — `uploadUrl` is a placeholder. Once R2 is integrated:
- Replace the placeholder with a real R2 PUT presign.
- The client contract does NOT change.
- `utils/fileUrl.js` already enforces the matching `TRUSTED_UPLOAD_HOSTS` allowlist on the submission side.

---

## 12. Error handling

`AppError(message, statusCode, code)` is the only error class to throw. `errorHandler`:

```
errorHandler(err, req, res, next):
  if res.headersSent: next(err); return
  statusCode = err.statusCode || 500
  isServerError = statusCode >= 500
  code = err.code || (isServerError ? "INTERNAL_SERVER_ERROR" : "REQUEST_FAILED")
  message = (isServerError && !EXPOSE_ERROR_DETAILS) ? "Internal Server Error" : err.message
  payload = { success: false, error: { code, message } }
  if EXPOSE_ERROR_DETAILS && err.stack: payload.error.stack = err.stack
  res.status(statusCode).json(payload)
```

Conventions:
- 4xx → leak `message` to the client (it's actionable).
- 5xx → leak `message` only in dev; prod rewrites to `"Internal Server Error"`.
- Every `AppError` should carry a `code`. Use `UPPER_SNAKE_CASE`.

Existing codes (grep before inventing new ones):
`CORS_ORIGIN_REQUIRED`, `CORS_ORIGIN_BLOCKED`, `ROUTE_NOT_FOUND`, `RATE_LIMITED`, `RATE_LIMITER_UNAVAILABLE`, `VALIDATION_FAILED`, `MESSAGE_REQUIRED`, `MESSAGE_INVALID_TYPE`, `MESSAGE_TOO_SHORT`, `MESSAGE_TOO_LONG`, `COURSE_NOT_FOUND`, `PRODUCT_NOT_FOUND`, `INVALID_COURSE_SLUG`, `INVALID_COURSE_ID`, `CHAT_PROCESSING_ERROR`, `OAUTH_PROVIDER_REQUIRED`, `OAUTH_ACCOUNT_ID_REQUIRED`, `OAUTH_EMAIL_REQUIRED`, `OAUTH_VERIFICATION_FAILED`, `OAUTH_NAME_REQUIRED`, `OAUTH_ROLE_MISSING`, `ONBOARDING_REQUIRED`, `INVALID_FILE_URL`, `UPLOADS_DISABLED`, `UNTRUSTED_FILE_HOST`, `UNSUPPORTED_KIND`, `UNSUPPORTED_CONTENT_TYPE`, `INVALID_FILENAME`, `UPLOAD_TOO_LARGE`.

---

## 13. Security posture

What's in place:
- **Password hashing**: bcrypt, 12 rounds.
- **OTP hashing**: HMAC-SHA256 with a server-side secret (`OTP_HMAC_SECRET || JWT_SECRET`). Raw SHA-256 was rejected because the 6-digit space is trivially reversible.
- **OTP brute-force protection**: 5 attempts per `ContactVerification` row, then auto-consumed.
- **JWT**: HS256 with `iss=techseekho-api`, `aud=techseekho-app`, default expiry 7 days. Verified on every authed request.
- **OAuth**: backend re-verifies provider tokens (Google `tokeninfo`/`userinfo`, GitHub `/user` + `/user/emails`). The frontend's NextAuth never bypasses this — the JWT used in subsequent calls is the **backend's** JWT, not NextAuth's.
- **Rate limits**: global 120/min/key (user-id preferred over IP), `/auth/*` 10/min, `/uploads/presign` 30/min. Redis-backed when `REDIS_URL` is set; in-memory fallback otherwise.
- **CORS**: explicit allowlist; rejects unknown origins.
- **Security headers**: see §3. Frontend `next.config.mjs` ALSO sets HSTS/X-Frame/etc. on every response.
- **CSRF**: not needed for the API (Bearer-only). NextAuth handles its own CSRF.
- **SSRF on file URLs**: `utils/fileUrl.js` — exact-host allowlist, rejects `data:`/`javascript:`/`file:`/`ftp:`, rejects userinfo URLs, requires HTTPS in prod.
- **Uploads**: per-kind mime allowlist, filename regex, size cap, deterministic key with random nonce.
- **Audit log**: who-did-what-to-what + ip + ua, fire-and-forget.
- **Server-derived ownership**: `institutionId` / `createdById` on assignments/announcements come from the loaded `Batch`, never the request body.
- **OAuth-created users**: `passwordHash = "!oauth-disabled"` — not a valid bcrypt hash, so credentials login can never succeed for OAuth-only accounts.

What's not in place:
- No CSP reporting endpoint.
- No 2FA / WebAuthn (OTP-by-contact is the closest).
- No automated security tests.

---

## 14. Operational notes

- **Logs**: `console.log` / `warn` / `error`. No structured logger today.
- **Health**: `GET /health` returns `{ status, uptimeSeconds, timestamp }`. Good for liveness. No readiness probe.
- **Graceful shutdown**: `SIGINT/SIGTERM` → `server.close()` → `prisma.$disconnect()` → `closeRedis()` → exit. 10 s hard timeout.
- **MongoDB**: best-effort connect at boot; failures are logged, server continues. Removing it cleanly = delete `config/mongo.js`, the optional call in `server.js`, and `mongoose`/`mongodb` from `package.json`.
- **Redis**: optional. With `REDIS_URL` set, the rate limiter is cross-instance. Without it, single-instance fallback. Errors are logged once per reconnect cycle (not per request).
- **Prisma client lifetime**: cached on `globalThis` in non-prod to survive nodemon reloads; fresh client in prod cold starts.
- **Migrations**: `prisma migrate dev` (local) or `prisma migrate deploy` (CI/CD). Six migrations through 2026-05-19 including `submission_grading` and `audit_log`.
- **Seed idempotency**: `prisma/seed.js` upserts on natural keys (role name, institution name, course slug, user email). Re-running is safe and resets student `currentBatchId`.
- **Turbopack**: rooted at the monorepo root by `frontend/next.config.mjs` to silence lockfile auto-detection warnings. `npm -w frontend run dev` currently sets `NEXT_DISABLE_TURBOPACK=1` and `NODE_OPTIONS=--max_old_space_size=3072` — if a future dev wonders why Turbopack is off, that's why.
