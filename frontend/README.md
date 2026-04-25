# TechSeekho Frontend

This frontend is a Next.js 16 App Router application that powers the public TechSeekho landing experience, dashboard shell, auth entry pages, and animated UI experiments. It is heavily componentized around the landing page and uses a shared API helper to talk to the Express backend.

## Frontend Responsibilities

- Render the public landing page under `/landingpage`
- Render a dashboard shell and auth pages
- Drive the landing-page AI assistant popup UI
- Fetch course and AI data from the backend
- Provide animation-rich sections and effects for the public marketing experience

## Stack

- Framework: Next.js 16 App Router
- UI: React 19
- Styling: Tailwind CSS v4
- Motion and interaction:
  - GSAP
  - Framer Motion
  - `motion`
  - Lenis
- Utilities:
  - `clsx`
  - `tailwind-merge`
  - `mathjs`

## Top-Level App Structure

Main frontend app directory:

```text
frontend/src/app/
  landingpage/   public marketing site and AI popup
  dashboard/     dashboard shell and dashboard pages
  login/         login entry page
  signup/        signup entry page
  components/    shared UI pieces
  lib/           API helper
  globals.css    global styles
  layout.js      root app layout
  page.js        redirects to landing page or dashboard
```

## Routing Notes

- `/` redirects to:
  - `/dashboard` when query param indicates authenticated user
  - `/landingpage` otherwise
- `/landingpage` is the primary public marketing route
- `/landingpage/Pages/*` contains additional content pages such as courses, contact, legal, and policy pages

## Key Frontend Files

- [src/app/page.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/frontend/src/app/page.js): root redirect behavior
- [src/app/layout.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/frontend/src/app/layout.js): global app layout
- [src/app/landingpage/layout.jsx](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/frontend/src/app/landingpage/layout.jsx): landing-page shell with navbar, Lenis, footer
- [src/app/landingpage/page.jsx](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/frontend/src/app/landingpage/page.jsx): landing-page composition
- [src/app/landingpage/components/AIAssistantPopup.jsx](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/frontend/src/app/landingpage/components/AIAssistantPopup.jsx): AI popup UI
- [src/lib/api.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/frontend/src/lib/api.js): API wrapper

## Landing Page Architecture

The landing page is assembled in `src/app/landingpage/page.jsx`.

Current composition:

1. custom scroll component
2. hero section
3. desktop-only horizontal scroll section for:
   - Why Choose Us
   - What We Offer
4. testimonials
5. call to action
6. AI assistant popup

On smaller screens the horizontally-scrolled sections fall back to a regular vertical stack.

## Landing Page Shell

`src/app/landingpage/layout.jsx` provides:

- navbar
- Lenis-powered smooth scrolling
- footer
- metadata for title and description

## AI Assistant UI Notes

The popup is a frontend-only chat interface over the backend `POST /ai/chat` endpoint.

Important current behavior:

- It sends only the current user message to the backend.
- It does not persist chat history.
- When the popup closes, UI state is reset so the next open starts fresh.
- It shows backend/API errors directly in development through the shared API helper.

## API Client Behavior

The shared API helper lives in [src/lib/api.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/frontend/src/lib/api.js).

How it works:

- Uses `NEXT_PUBLIC_API_URL` to target the external backend
- Adds JSON headers by default
- Throws readable errors for network failures and non-OK responses

Required frontend environment variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Commands

From `frontend/`:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run format
```

The current `dev` script disables Turbopack and increases memory:

```bash
set NODE_OPTIONS=--max_old_space_size=3072 && set NEXT_DISABLE_TURBOPACK=1 && next dev
```

That is worth remembering if a future developer wonders why Turbopack is not active in local development.

## Data Sources Used By The Frontend

- Backend `/courses` APIs for course lists and course detail pages
- Backend `/ai/chat` for the assistant
- Local config files for static landing content:
  - `landingContent.js`
  - `aboutUsContent.js`
  - `ourTeamContent.js`

## Styling And Motion Approach

This project is not a minimal dashboard-style UI. The landing page intentionally leans into:

- full-screen sections
- animation-heavy presentation
- custom cursor/scroll effects
- responsive layout mode switching
- richer visual treatments over plain utility-only layouts

Future contributors should preserve that intent unless there is an explicit redesign.

## Good First Files For New Frontend Devs

Read these in order:

1. [src/app/page.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/frontend/src/app/page.js)
2. [src/app/landingpage/layout.jsx](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/frontend/src/app/landingpage/layout.jsx)
3. [src/app/landingpage/page.jsx](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/frontend/src/app/landingpage/page.jsx)
4. [src/app/landingpage/components/AIAssistantPopup.jsx](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/frontend/src/app/landingpage/components/AIAssistantPopup.jsx)
5. [src/lib/api.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/frontend/src/lib/api.js)

## Current Gaps

- No automated frontend tests yet
- Browser error output is still developer-oriented, not polished for production users
- Dashboard/auth flows are structurally present but not fully documented as complete product flows
- AI assistant session memory is intentionally disabled for the landing page
