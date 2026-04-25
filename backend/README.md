# TechSeekho Backend

This backend is an Express 5 application that serves health checks, course data, and the landing-page AI assistant. It uses Prisma with PostgreSQL for course storage and Hugging Face hosted inference for AI chat responses.

## Backend Responsibilities

- Start an HTTP API on a configurable port
- Enforce CORS, JSON body parsing, basic security headers, and centralized error handling
- Expose health and course endpoints
- Expose `POST /ai/chat` for the website AI assistant
- Ground AI responses with TechSeekho course data before sending requests to Hugging Face

## Stack

- Runtime: Node.js with ESM modules
- Server: Express 5
- Database: PostgreSQL
- ORM: Prisma with `@prisma/client` and `@prisma/adapter-pg`
- AI Provider: Hugging Face Inference via `@huggingface/inference`
- Dev tools: Nodemon, Biome

## Key Files

- [src/server.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/src/server.js): process entry point, graceful shutdown
- [src/app.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/src/app.js): Express app wiring
- [src/config/env.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/src/config/env.js): environment loading and parsing
- [src/config/cors.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/src/config/cors.js): allowed origin policy
- [src/routes/index.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/src/routes/index.js): top-level route registration
- [src/services/courses.service.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/src/services/courses.service.js): Prisma course reads
- [src/services/ai.service.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/src/services/ai.service.js): AI prompt building and Hugging Face calls
- [prisma/schema.prisma](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/prisma/schema.prisma): database schema

## API Surface

### Health

- `GET /health`

Used for basic uptime checks.

### Courses

- `GET /courses`
- `GET /courses/:slug`

The controller delegates to Prisma service methods for fetching all courses or a single course by slug.

### AI

- `POST /ai/chat`

Expected request shape:

```json
{
  "message": "What course should a beginner start with?"
}
```

Response shape:

```json
{
  "success": true,
  "data": {
    "response": "Assistant reply",
    "timestamp": "2026-03-29T00:00:00.000Z",
    "messageId": "1234567890"
  }
}
```

## AI Assistant Architecture

The backend AI flow currently works like this:

1. Request arrives at `POST /ai/chat`
2. Validator ensures `message` exists, is a string, is not empty, and is below the length limit
3. Controller calls `processChatMessage`
4. AI service builds a system prompt
5. The prompt includes a course catalog summary generated from backend course data
6. The service sends the chat completion request to Hugging Face
7. If the configured model/provider pair is unsupported, the service can retry with a hosted-safe fallback
8. The final assistant text is returned to the frontend

### Current AI Behavior Notes

- The assistant is grounded by prompt context, not full model fine-tuning in this repo
- The assistant does not persist conversation history
- The landing-page popup also resets state when closed
- The backend currently favors a hosted-safe Hugging Face config:
  - model: `Qwen/Qwen2.5-7B-Instruct`
  - provider: `together`

## Environment Variables

Documented in [`.env.example`](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/.env.example).

Important values:

- `PORT`: backend port, usually `4000`
- `DATABASE_URL`: PostgreSQL connection string
- `CORS_ORIGINS`: comma-separated allowed browser origins
- `HF_TOKEN`: Hugging Face token
- `HF_MODEL`: chat model id
- `HF_PROVIDER`: provider name used by Hugging Face client

Example:

```env
PORT=4000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000
DATABASE_URL=postgresql://...
HF_TOKEN=hf_...
HF_MODEL=Qwen/Qwen2.5-7B-Instruct
HF_PROVIDER=together
```

## Commands

From `backend/`:

```bash
npm run dev
npm run start
npm run lint
npm run format
```

## Database Notes

The Prisma schema currently defines one main model:

- `Course`

Fields include:

- `slug`
- `title`
- `shortDescription`
- `description`
- `bannerImage`
- `startsAt`
- `endDate`
- `enrollmentStatus`
- `price`

One thing to watch:

- The Prisma schema comment suggests `price` is in paisa/cents.
- Current application messaging and AI prompt output present prices as INR values directly.
- Future developers should normalize this so UI, AI, and schema expectations match.

## Middleware Pipeline

The server stack in `src/app.js` is:

1. disable `x-powered-by`
2. optional `trust proxy`
3. security headers
4. CORS
5. JSON and URL-encoded body parsers
6. app routes
7. not-found middleware
8. error handler

## Error Handling

Errors are wrapped with `AppError` where possible and returned through the shared error middleware. In development, stack traces may be exposed depending on `EXPOSE_ERROR_DETAILS`.

## Good First Files For New Devs

Read these in order:

1. [src/server.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/src/server.js)
2. [src/app.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/src/app.js)
3. [src/routes/index.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/src/routes/index.js)
4. [src/controllers/courses.controller.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/src/controllers/courses.controller.js)
5. [src/services/courses.service.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/src/services/courses.service.js)
6. [src/services/ai.service.js](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/src/services/ai.service.js)
7. [prisma/schema.prisma](/c:/Users/user/OneDrive/Desktop/My-Projects/TechSeekho/TechSeekhoApp/backend/prisma/schema.prisma)

## Current Gaps

- No automated backend tests yet
- AI chat does not persist sessions or user history
- No dedicated RAG/indexing layer yet
- Limited domain models beyond courses
