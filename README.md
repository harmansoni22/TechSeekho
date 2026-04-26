# TechSeekhoApp

TechSeekhoApp is a JavaScript monorepo with a Next.js frontend and an Express backend. The frontend delivers the public landing experience, dashboard shell, auth entry pages, and UI effects. The backend exposes course data, health endpoints, and the AI assistant endpoint used by the landing page.

This README is the shared onboarding guide for future developers before they dive into implementation details. More focused guides live in [frontend/README.md](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/frontend/README.md) and [backend/README.md](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/README.md).

## Monorepo Layout

```text
TechSeekhoApp/
  backend/      Express API, Prisma schema, AI assistant integration
  frontend/     Next.js App Router UI, landing page, dashboard shell
  package.json  npm workspaces + Turbo scripts
  turbo.json    task pipeline config
```

## Tech Stack

- Monorepo: npm workspaces, Turbo
- Frontend: Next.js 16 App Router, React 19, Tailwind CSS v4, GSAP, Framer Motion, Lenis
- Backend: Express 5, Node.js ESM, Prisma, PostgreSQL, `@huggingface/inference`
- Tooling: Biome for linting/formatting, Nodemon for backend dev

## What The Project Currently Does

- Redirects `/` to `/landingpage` or `/dashboard` based on query params.
- Serves a marketing-focused landing page with animated sections and a popup AI assistant.
- Exposes backend APIs for:
  - `GET /health`
  - `GET /courses`
  - `GET /courses/:slug`
- Uses Hugging Face hosted inference for landing-page assistant replies.
- Grounds AI answers with TechSeekho course catalog data in the backend prompt.
- Resets landing-page chat UI state when the popup closes instead of persisting history.

## Workspace Commands

Run these from the monorepo root:

```bash
npm install
npm run dev
npm run build
npm run lint
npm run format
```

What these do:

- `npm run dev`: starts frontend and backend through Turbo
- `npm run build`: builds all workspace apps
- `npm run lint`: runs Biome checks in each workspace
- `npm run format`: runs Biome formatting in each workspace

You can also run apps individually:

```bash
cd frontend
npm run dev
```

```bash
cd backend
npm run dev
```

## High-Level Request Flow

### Course Data

1. Frontend calls `api("/courses")`.
2. Backend route forwards to controller.
3. Controller uses Prisma service methods.
4. Prisma reads from PostgreSQL `Course` records.

### AI Assistant

1. Landing page popup posts the user message to `POST /ai/chat`.
2. Backend validates the message.
3. Backend service builds a system prompt with current course catalog context.
4. Backend sends the request to Hugging Face hosted inference.
5. Backend returns the assistant reply to the frontend popup.
6. Chat UI does not persist history after close.

## Important Implementation Notes

- The backend now includes Hugging Face fallback logic when a configured model/provider pair is not available.
- The landing-page AI assistant is website-aware through prompt grounding, not full model fine-tuning inside this codebase.
- The frontend API utility throws raw backend error text for debugging, which is useful in development but can feel noisy in the browser.
- The Prisma schema comment says course price is in paisa/cents, but current seed-like data and prompt usage appear to treat it as INR. Future developers should normalize this to avoid pricing confusion.

## Suggested Reading Order

If you are new to the repo, read files in this order:

1. [package.json](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/package.json)
2. [turbo.json](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/turbo.json)
3. [frontend/README.md](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/frontend/README.md)
4. [backend/README.md](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/README.md)

## Current Gaps Future Devs Should Know About

- No automated tests are set up yet.
- The dashboard/auth areas exist structurally but are not fully documented as production auth flows.
- The AI assistant is grounded by prompt context and hosted inference, but it is not a full RAG or fine-tuning pipeline.
- There is no persisted conversation history for the landing-page assistant.

## Documentation Map

- Shared project overview: this file and [README.txt](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/README.txt)
- Frontend guide: [frontend/README.md](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/frontend/README.md) and [frontend/README.txt](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/frontend/README.txt)
- Backend guide: [backend/README.md](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/README.md) and [backend/README.txt](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/README.txt)
