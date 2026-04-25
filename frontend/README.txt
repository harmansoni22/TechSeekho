TechSeekho Frontend

This frontend is a Next.js 16 App Router application that powers the public landing page, dashboard shell, auth entry pages, and animated UI features.

Frontend responsibilities

- Render the public landing page at /landingpage
- Render dashboard shell and auth pages
- Drive the landing-page AI assistant popup UI
- Fetch course and AI data from the backend
- Deliver animation-heavy marketing sections

Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS v4
- GSAP
- Framer Motion
- motion
- Lenis
- clsx
- tailwind-merge
- mathjs

Top-level app structure

frontend/src/app/
  landingpage/   public marketing site and AI popup
  dashboard/     dashboard shell and pages
  login/         login page
  signup/        signup page
  components/    shared UI
  lib/           API helper
  globals.css    global styles
  layout.js      root app layout
  page.js        redirect logic

Routing notes

- / redirects to /dashboard or /landingpage based on query params
- /landingpage is the main public route
- /landingpage/Pages/* contains additional public content pages

Key files

- src/app/page.js
- src/app/layout.js
- src/app/landingpage/layout.jsx
- src/app/landingpage/page.jsx
- src/app/landingpage/components/AIAssistantPopup.jsx
- src/lib/api.js

Landing page architecture

The landing page currently renders:
1. custom scroll component
2. hero section
3. horizontal desktop sections for Why Choose Us and What We Offer
4. testimonials
5. call to action
6. AI assistant popup

On smaller screens the horizontal section becomes a vertical stack.

AI assistant UI notes

- Sends the current user message to POST /ai/chat
- Does not persist chat history
- Resets state when popup closes
- Uses shared API helper and surfaces backend errors during development

Required frontend environment variable

NEXT_PUBLIC_API_URL=http://localhost:4000

Commands

npm run dev
npm run build
npm run start
npm run lint
npm run format

Important dev note

The current frontend dev script disables Turbopack and raises Node memory.

Data sources used by frontend

- Backend /courses
- Backend /ai/chat
- Local content config files in landingpage/config

Styling and motion approach

The project intentionally uses bold animated marketing UI rather than a plain minimal layout. Preserve that direction unless a redesign is requested.

Current gaps

- No automated frontend tests
- Error display is still developer-oriented
- Dashboard/auth flows are not fully documented as complete product flows
- AI assistant session memory is intentionally disabled
