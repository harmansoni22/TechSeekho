# AGENTS.md

This repository's full AI-agent briefing lives in **[CLAUDE.md](./CLAUDE.md)** — read that first.

It covers:
- What the project is (institution-scoped, batch-centric EdTech operations platform)
- Monorepo layout (`backend/` Express+Prisma, `frontend/` Next.js+NextAuth)
- The five roles and how they map to backend RBAC and frontend dashboards
- End-to-end auth flow (credentials OTP and OAuth)
- The "operational truth vs projection/reporting" separation
- Where each kind of change goes (`§7 Where does X live?`)
- Backend → frontend coupling (direct API client vs Next.js proxy routes)
- Every environment variable and where it's read
- The known-broken list
- Conventions, essential skills, and the step-by-step AI working protocol

For workspace-specific briefings, see:
- [backend/CLAUDE.md](./backend/CLAUDE.md)
- [frontend/CLAUDE.md](./frontend/CLAUDE.md)

For deeper architecture (request flow diagrams, RBAC decision tree, full data model), see [ARCHITECTURE.md](./ARCHITECTURE.md).

For the pre-existing persona/rules used by IDE coding agents, see [.agent.md](./.agent.md) and [.github/agents/](./.github/agents/).

Minimum protocol for any AI model:

1. Read `CLAUDE.md`, then the relevant workspace `CLAUDE.md`, then the files you will edit.
2. Confirm the runtime path from entrypoint to target code; do not rely on filenames alone.
3. Preserve role, institution, batch, auth, validation, and audit boundaries.
4. Make the smallest coherent change that matches existing patterns.
5. Run the narrowest useful verification (`lint`, `test`, `build`, migration/seed command, or manual browser check).
6. Report exactly what changed, what was verified, and what remains risky.

When you change something material in `src/` or `prisma/` that contradicts CLAUDE.md, update CLAUDE.md in the same change.
