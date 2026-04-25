TechSeekhoApp

TechSeekhoApp is a JavaScript monorepo with a Next.js frontend and an Express backend.
The frontend delivers the landing page, dashboard shell, auth entry pages, and UI effects.
The backend exposes health, course, and AI assistant APIs.

Monorepo layout

TechSeekhoApp/
  backend/      Express API, Prisma schema, AI assistant integration
  frontend/     Next.js App Router UI, landing page, dashboard shell
  package.json  npm workspaces + Turbo scripts
  turbo.json    task pipeline config

Tech stack

- Monorepo: npm workspaces, Turbo
- Frontend: Next.js 16 App Router, React 19, Tailwind CSS v4, GSAP, Framer Motion, Lenis
- Backend: Express 5, Node.js ESM, Prisma, PostgreSQL, @huggingface/inference
- Tooling: Biome, Nodemon

What the project currently does

- Redirects / to /landingpage or /dashboard based on query params
- Serves a public landing page with animated sections and an AI popup
- Exposes:
  - GET /health
  - GET /courses
  - GET /courses/:slug
  - POST /ai/chat
- Uses Hugging Face hosted inference for landing-page assistant replies
- Grounds AI answers with TechSeekho course data in the backend prompt
- Resets landing-page chat UI state when the popup closes

Workspace commands

Run from the monorepo root:

npm install
npm run dev
npm run build
npm run lint
npm run format

Environment setup

Backend .env example:

PORT=4000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000
CORS_ALLOW_NO_ORIGIN=true
JSON_LIMIT=100kb
TRUST_PROXY=false
EXPOSE_ERROR_DETAILS=true
DATABASE_URL=postgresql://...
HF_TOKEN=hf_...
HF_MODEL=Qwen/Qwen2.5-7B-Instruct
HF_PROVIDER=together

Frontend env example:

NEXT_PUBLIC_API_URL=http://localhost:4000

Recommended local startup order

1. Start PostgreSQL
2. Start backend
3. Start frontend
4. Open http://localhost:3000
5. Test landing page and AI popup

High-level request flow

Course data flow:
1. Frontend calls api("/courses")
2. Backend route forwards to controller
3. Controller uses Prisma service methods
4. Prisma reads PostgreSQL Course records

AI assistant flow:
1. Landing page popup posts to POST /ai/chat
2. Backend validates the message
3. Backend builds a system prompt with course context
4. Backend calls Hugging Face hosted inference
5. Backend returns the reply
6. Frontend shows it in the popup

Important implementation notes

- Backend includes Hugging Face fallback logic when a model/provider pair is unavailable
- AI assistant is grounded through prompt context, not a full fine-tuning pipeline in this repo
- Frontend API helper surfaces raw backend error text during development
- Prisma schema comments say price is paisa/cents, but current app usage appears to treat price as INR

Suggested reading order

1. package.json
2. turbo.json
3. frontend/README.md
4. backend/README.md

Current gaps

- No automated tests yet
- Dashboard/auth are present structurally but not fully documented as production auth flows
- AI assistant is not a full RAG system
- Landing-page chat history is not persisted
