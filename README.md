# TechSeekhoApp

TechSeekho is a future-skills education platform for school students aged 10–18. This monorepo powers the TechSeekho digital experience behind TechSeekho.com, including the public marketing site, course catalog, and the landing-page AI assistant.

The platform is built to showcase and support hands-on programs in:

- AI and machine learning
- Robotics engineering
- Drone technology
- Internet of Things (IoT)
- Coding and future-ready skills

TechSeekho is designed for parents, school leaders, and education departments looking to give students real-world, project-based learning that aligns with NEP 2020 and high-demand career pathways.

## Why This Project Matters

TechSeekho is not just a demo app. It is a branded learning product for a regional education initiative with real program positioning:

- 100% hands-on learning with real robots, drones, and AI systems
- NEP 2020 certified programs built for school adoption
- Career-mapped courses aligned to 2030 technology jobs
- 50+ competition wins by students across Madhya Pradesh
- School delivery model with labs, equipment, and trainers brought to campus
- Trusted by 120+ schools and 5,000+ students in the region

## What This Repo Contains

- `frontend/`: Next.js marketing site, landing page, course pages, dashboard shell, auth entry flows, and AI assistant UI
- `backend/`: Express API, Prisma course catalog, AI assistant endpoint, health checks, and production-ready middleware
- `package.json`: npm workspace orchestration and shared scripts
- `turbo.json`: turbo task pipeline for local development and build coordination

## Product Features

- Public landing experience at `/landingpage`
- Dynamic course catalog and course detail pages
- AI assistant popup for questions like "What program fits my child?"
- Backend-grounded AI replies seeded with course catalog data
- Smooth animated UI with GSAP, Framer Motion, and Lenis scrolling
- Dashboard shell and auth pages for future student/admin experiences

## Tech Stack

- Monorepo: npm workspaces, Turbo
- Frontend: Next.js 16 App Router, React 19, Tailwind CSS v4
- Motion: GSAP, Framer Motion, Lenis
- Backend: Express 5, Node.js ESM, Prisma, PostgreSQL
- AI: Hugging Face Inference via `@huggingface/inference`
- Tooling: Biome, Nodemon, Prisma

## Deployment

This repo is the codebase behind the deployed TechSeekho marketing experience at TechSeekho.com. The project is intended as a production-facing web presence rather than a local-only prototype.

## Architecture Overview

### Frontend

- Public landing page at `/landingpage`
- Course pages and enrollment-focused marketing sections
- AI assistant popup calling backend `POST /ai/chat`
- Redirects `/` to `/landingpage` or `/dashboard` based on authentication state

### Backend

- Course APIs:
  - `GET /courses`
  - `GET /courses/:slug`
- Health endpoint:
  - `GET /health`
- AI chat endpoint:
  - `POST /ai/chat`
- Uses Prisma to read course data from PostgreSQL
- Builds system prompts that ground AI replies in the TechSeekho course catalog

## High-Level Request Flow

### Course Data

1. Frontend calls `api("/courses")`
2. Backend route reaches the courses controller
3. Controller uses Prisma service methods
4. Prisma queries the PostgreSQL `Course` records

### AI Assistant

1. Landing page sends user input to `POST /ai/chat`
2. Backend validates the request
3. AI service builds a course-aware prompt
4. Backend sends the prompt to Hugging Face hosted inference
5. Assistant text is returned to the landing page

## Notes for Contributors

- The AI assistant is grounded in prompt context, not a full fine-tuning or RAG system
- Chat history is not persisted when the popup closes
- The frontend currently surfaces backend errors in development for debugging
- The Prisma schema suggests `price` may be stored as paisa/cents, while current UI/copy treats it as INR; that should be normalized in future work

## Recommended Read Order

1. `package.json`
2. `turbo.json`
3. `frontend/README.md`
4. `backend/README.md`

## Documentation Map

- Shared overview: this file and `README.txt`
- Frontend guide: `frontend/README.md`, `frontend/README.txt`
- Backend guide: `backend/README.md`, `backend/README.txt`
