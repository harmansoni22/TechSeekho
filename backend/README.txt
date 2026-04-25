TechSeekho Backend

This backend is an Express 5 application that serves health checks, course data, and the landing-page AI assistant.
It uses Prisma with PostgreSQL for course storage and Hugging Face hosted inference for AI chat.

Backend responsibilities

- Start an HTTP API
- Apply CORS, security headers, parsing, and centralized error handling
- Expose health and course endpoints
- Expose POST /ai/chat for the website AI assistant
- Ground AI responses with TechSeekho course data

Stack

- Node.js with ESM modules
- Express 5
- PostgreSQL
- Prisma
- @huggingface/inference
- Nodemon
- Biome

Key files

- src/server.js: process entry point and graceful shutdown
- src/app.js: Express app wiring
- src/config/env.js: environment loading and parsing
- src/config/cors.js: CORS policy
- src/routes/index.js: route registration
- src/services/courses.service.js: Prisma reads
- src/services/ai.service.js: AI prompt building and Hugging Face calls
- prisma/schema.prisma: database schema

API surface

- GET /health
- GET /courses
- GET /courses/:slug
- POST /ai/chat

AI assistant flow

1. Request arrives at POST /ai/chat
2. Validator checks the message
3. Controller calls processChatMessage
4. Service builds a system prompt
5. Prompt includes a summary of TechSeekho course data
6. Service sends chat completion request to Hugging Face
7. If the configured model/provider is unsupported, fallback logic can retry
8. Reply is returned to the frontend

Current AI behavior notes

- Website-aware through prompt grounding
- No persisted conversation history
- Landing-page popup resets when closed
- Hosted-safe default is:
  - model: Qwen/Qwen2.5-7B-Instruct
  - provider: together

Important environment variables

- PORT
- DATABASE_URL
- CORS_ORIGINS
- HF_TOKEN
- HF_MODEL
- HF_PROVIDER

Example

PORT=4000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000
DATABASE_URL=postgresql://...
HF_TOKEN=hf_...
HF_MODEL=Qwen/Qwen2.5-7B-Instruct
HF_PROVIDER=together

Commands

npm run dev
npm run start
npm run lint
npm run format

Database notes

Main model:
- Course

Important caveat:
- Prisma schema comment says price is paisa/cents
- Current app usage and AI prompt present prices as INR directly
- Future developers should normalize this

Middleware order

1. disable x-powered-by
2. trust proxy if enabled
3. security headers
4. CORS
5. body parsers
6. routes
7. not found
8. error handler

Current gaps

- No automated backend tests
- No session persistence for AI chat
- No full RAG layer
- Limited domain models beyond courses
