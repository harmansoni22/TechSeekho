# Frontend CLAUDE.md - Next.js workspace briefing

Read the monorepo-level [../CLAUDE.md](../CLAUDE.md) first. This file is the frontend-specific quick map for agents working inside `frontend/`.

## What this workspace owns

The frontend is a Next.js 16 App Router application. It contains both the public TechSeekho site and the authenticated multi-role operations dashboard. Auth is handled by NextAuth v4, but backend-issued JWTs are the token used for real API access.

The public landing pages live under `src/app/landingpage`. The operational app lives under `src/app/dashboard` and `src/features/dashboard`.

## Commands

Run from the monorepo root unless you are intentionally scoped to `frontend/`.

```bash
npm -w frontend run dev
npm -w frontend run build
npm -w frontend run lint
npm -w frontend run format
npm -w frontend run test
```

The dev script disables Turbopack and increases Node heap:

```bash
set NODE_OPTIONS=--max_old_space_size=3072 && set NEXT_DISABLE_TURBOPACK=1 && next dev
```

## Key files

| Task | File |
|---|---|
| Root layout/providers | `src/app/layout.js`, `src/app/providers.jsx` |
| NextAuth config | `src/auth.js` |
| NextAuth route handler | `src/app/api/auth/[...nextauth]/route.js` |
| Auth forms | `src/app/components/Auth/*` |
| API client | `src/lib/api.js` |
| Role landing route | `src/lib/roleRouter.js` |
| Dashboard layout | `src/app/dashboard/layout.jsx` |
| Dashboard auth gate | `src/app/dashboard/auth/DashboardAuthGate.jsx` |
| Dashboard route permissions | `src/app/dashboard/dashboardRoutePermissions.js` |
| Dashboard nav | `src/features/dashboard/config/navConfig.js` |
| Dashboard theme/context | `src/features/dashboard/context/*`, `src/features/dashboard/theme/*` |
| Student dashboard API helpers | `src/features/dashboard/api/studentDashboard.api.js` |
| Landing page content/config | `src/app/landingpage/config/*` |
| Next config/security headers | `next.config.mjs` |
| Path alias | `jsconfig.json` (`@/* -> ./src/*`) |

## Auth flow

Credentials login goes through NextAuth's Credentials provider in `src/auth.js`.

1. The login UI collects identifier, password, and OTP.
2. `authorize()` calls the backend `/auth/login/verify-otp`.
3. Backend returns `{ user, token }`.
4. NextAuth stores the backend token as `token.accessToken`.
5. `session()` exposes it as `session.accessToken`.
6. `src/lib/api.js` attaches `Authorization: Bearer ${session.accessToken}` to backend calls.

OAuth login also starts in NextAuth, but it does not trust the provider profile alone. The `jwt()` callback calls backend `/oauth/login`; the backend verifies the provider token, upserts/loads the user, assigns/returns roles, and issues the backend JWT.

Do not add localStorage auth. `api()` explicitly uses the NextAuth session.

## Dashboard authorization

The dashboard has two frontend authorization layers:

- `src/lib/roleRouter.js`: maps backend roles to the default dashboard home.
- `src/app/dashboard/dashboardRoutePermissions.js`: maps every dashboard path to allowed roles.

`DashboardAuthGate` enforces the permission map at render time. Backend endpoints must still enforce equivalent permissions; frontend gating is only a user-experience and defense-in-depth layer.

When adding a dashboard page:

1. Create the page at `src/app/dashboard/{role}/<slug>/page.jsx`.
2. Add the route to `src/app/dashboard/dashboardRoutePermissions.js`.
3. Add sidebar navigation in `src/features/dashboard/config/navConfig.js`.
4. Wire data through `src/lib/api.js` or a feature API helper.
5. Add/update tests if the route or role behavior changes.

Prefer role-scoped pages over shared pages. Shared pages are easy to accidentally over-permission.

## Backend integration

Most client code should call:

```js
import { api } from "@/lib/api";

const data = await api("/student/dashboard");
```

`api()` prefixes relative paths with `NEXT_PUBLIC_BACKEND`, attaches the session token, parses JSON, and throws on non-2xx responses.

There are also Next.js API proxy routes under `src/app/api`:

- `api/auth/[...nextauth]`
- `api/auth/internal/auth/sync`
- `api/admin/institutions`
- `api/admin/platform/overview`
- `api/student/achievements`
- `api/student/assignments`
- `api/student/courses`
- `api/student/dashboard`

Use a proxy route only when the browser should not call the upstream directly or a server-side cookie/header bridge is needed. Most dashboard code should use `src/lib/api.js`.

## Layout and UI conventions

- Public pages: `src/app/landingpage/*`, with content in `config/*` and shared visual pieces in `components/*`.
- Dashboard pages: `src/app/dashboard/*`, with reusable dashboard widgets in `src/features/dashboard/components/*`.
- Shared small UI controls live in `src/app/components/ui/*`.
- Dashboard shell uses `SideBar`, `TopBar`, `PageShell`, `RoleHero`, and widget components like `Panel`, `StatTile`, `PageState`, and `BackendPending`.
- Keep role navigation in `navConfig.js`; avoid hard-coded dashboard nav inside pages.
- Keep role styling in `features/dashboard/theme/*` and context providers.

This repo uses JavaScript/JSX, not TypeScript. Do not introduce TypeScript without explicit approval.

## Environment

Frontend env variables in active use:

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_BACKEND` | Backend base URL for `src/lib/api.js` and `src/auth.js` |
| `BACKEND_URL` | Backend base URL for `api/auth/internal/auth/sync` |
| `NEXTAUTH_SECRET` | Required NextAuth secret |
| `NEXTAUTH_URL` | Canonical NextAuth URL in production |
| `GITHUB_CLIENT_ID` / `GITHUB_SECRET` | GitHub OAuth |
| `GOOGLE_CLIENT_ID` / `GOOGLE_SECRET` | Google OAuth |

`NEXT_PUBLIC_BACKEND` and `BACKEND_URL` should point at the same backend in practice. If you consolidate them, update the proxy routes and root docs together.

## Tests

Current test coverage is focused and small:

- `src/lib/roleRouter.test.js`
- `src/app/dashboard/resolveDashboardAuthz.test.js`

Run:

```bash
npm -w frontend run test
```

Add tests when changing role routing, dashboard authorization, or shared client-side data helpers. For visual/page-only edits, lint/build are usually the better verification.

## Known sharp edges

- `src/app/api/auth/internal/auth/sync/route.js` appears to call a stale backend path (`/api/auth/oauth/sync`) while the backend exposes `/oauth/login`; verify before relying on that cookie sync flow.
- Dashboard route permissions and nav config can drift. Keep them updated together.
- Some dashboard pages are static/prototype-like while backend endpoints mature. Verify data contracts before assuming live data.
- The app uses both `framer-motion` and `motion`; avoid adding another animation stack.
- There are MUI, styled-components, Tailwind v4, GSAP, Lenis, and custom CSS pieces. Match local page patterns instead of standardizing globally in unrelated work.

## Change checklist

- New dashboard route: page, route permission, nav config, role-router impact if it is a new role root.
- New backend call: use `api()`, verify backend endpoint path and response shape.
- Auth change: read `src/auth.js`, `DashboardAuthGate`, and backend auth docs before editing.
- Landing content change: prefer `landingpage/config/*` when content already lives there.
- Styling change: check mobile and desktop, especially dashboard shell/sidebar overlap.
- Material behavior change: update this file and [../CLAUDE.md](../CLAUDE.md).

## Frontend AI-agent operating steps

Use this sequence when editing frontend behavior:

1. Identify whether the change belongs to public landing pages, dashboard pages, auth, API proxy routes, or shared UI.
2. Read the page/component plus its nearest layout and providers.
3. For dashboard work, read `DashboardAuthGate`, `dashboardRoutePermissions.js`, `navConfig.js`, and `roleRouter.js`.
4. For backend data, trace the call through `src/lib/api.js` or the relevant `src/app/api/*/route.js`, then confirm the backend route and response shape.
5. Reuse existing dashboard widgets, shell components, theme contexts, and landing-page config/content patterns.
6. Handle loading, empty, error, unauthorized, and no-role states where the page can encounter them.
7. Check responsive layout assumptions, especially sidebar, top bar, tables/lists, and long labels.
8. Run `npm -w frontend run lint`; run `npm -w frontend run test` for role/auth/helper changes.
9. Run `npm -w frontend run build` for routing, NextAuth, or production-rendering changes when feasible.
10. Update root docs if route, auth, env, backend contract, or dashboard role behavior changed.

Essential frontend skills:

- Next.js App Router layouts, pages, route handlers, and client/server component boundaries.
- NextAuth callbacks, sessions, credentials flow, and OAuth token exchange.
- Role-based dashboard routing and permission-map maintenance.
- Authenticated fetch through `src/lib/api.js`.
- Responsive dashboard UI with existing shell/widgets.
- Landing-page content/config organization.
- Focused Vitest coverage for pure helpers and authz decisions.
