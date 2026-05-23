# TechSeekhoApp

TechSeekhoApp is the operational platform powering TechSeekho and Koshalyam Learning Solutions Pvt. Ltd. institutional skilling programs across schools, workshops, and training centers.

The platform is designed to manage:

- institutional training operations
- batch workflows
- trainer coordination
- student onboarding
- attendance tracking
- assignments and submissions
- operational reporting
- dashboard visibility
- audit and projection-based reporting

TechSeekho programs focus on future-ready domains including:

- Artificial Intelligence
- Robotics
- Drone Technology
- IoT
- Coding and Computational Thinking

---

# Platform Philosophy

TechSeekhoApp is NOT a generic consumer LMS.

The system is designed as:

- an institutional operations platform
- a training workflow management system
- a batch-centric education delivery system

The platform prioritizes:

- operational clarity
- scalability across institutions
- trainer accountability
- reporting workflows
- role-based access control
- maintainable architecture

---

# Real-World Operational Context

The platform supports hybrid delivery realities common in regional educational ecosystems.

Examples:

- workshops officially associated with schools may be delivered from central training centers
- schools may lack hardware or internet infrastructure
- external stakeholders may require curated presentation dashboards
- operational data and reporting projections must remain separated

Because of this, the platform distinguishes between:

- raw operational data
- projection/presentation reporting
- audit-tracked administrative overrides

---

# Primary Roles

## Super Admin

Global system visibility and approval authority.

Responsibilities:

- institution oversight
- reporting projections
- approval workflows
- audit visibility
- analytics

---

## Admin

Institution-level operational management.

Responsibilities:

- batch creation
- trainer assignment
- student onboarding
- attendance oversight
- report generation

---

## Institution Coordinator

External/institution-facing visibility role.

Responsibilities:

- viewing official reports
- tracking workshop progress
- monitoring institutional metrics

This role only accesses presentation/projection data.

---

## Trainer

Operational execution role.

Responsibilities:

- attendance marking
- daily operational reports
- assignment workflows
- student progress updates
- workshop delivery tracking

---

## Student

Learner-facing role.

Responsibilities:

- assignments
- submissions
- modules
- attendance visibility
- announcements

---

# System Hierarchy

The platform is institution-scoped and batch-centric.

Core hierarchy:

```txt
Institution
→ Batch
→ Trainers
→ Students
→ Attendance
→ Assignments
→ Reports
→ Projections
```

Students are subordinate to institutions and batches rather than independent consumer accounts.

---

# Monorepo Structure

## frontend/

Next.js frontend application containing:

- landing pages
- dashboard UI
- role-based dashboards
- operational workflows
- AI assistant UI
- institutional reporting views

---

## backend/

Express.js backend containing:

- RBAC middleware
- operational APIs
- attendance workflows
- reporting/projection systems
- audit logging
- AI endpoints
- Prisma services

---

## prisma/

Database schema and relational models for:

- institutions
- batches
- users
- attendance
- assignments
- reporting
- audit logs
- projections

---

# Tech Stack

## Frontend

- Next.js 16 App Router
- React 19
- Tailwind CSS v4
- GSAP
- Framer Motion
- Lenis

---

## Backend

- Node.js ESM
- Express 5
- Prisma ORM
- PostgreSQL

---

## Tooling

- Turbo
- npm workspaces
- Biome
- Nodemon

---

# Architectural Principles

## PostgreSQL is the operational source of truth

Core operational entities must remain relational and auditable.

---

## Projection Reporting Layer

Presentation/reporting data must never overwrite raw operational records.

The platform separates:

- operational truth
- presentation projections
- audit logs

---

## Auditability

Sensitive actions must be append-only and traceable.

Examples:

- attendance projection changes
- report approvals
- administrative overrides

---

## RBAC and Scoped Authorization

Every backend query should be:

- role-scoped
- institution-scoped
- batch-aware

Avoid:

- flat role strings
- client-controlled authorization
- unrestricted data access

---

# Current Product Areas

## Public Experience

- landing pages
- course discovery
- enrollment funnels
- AI assistant

---

## Operational Platform

- dashboard shell
- RBAC workflows
- attendance systems
- trainer reporting
- student management
- projection dashboards

---

# AI Assistant

The AI assistant currently uses:

- prompt grounding
- course catalog context
- backend-generated system prompts

It is NOT yet:

- persistent-memory based
- RAG-powered
- fine-tuned

---

# Contributor Guidance

When contributing:

- preserve operational/audit integrity
- avoid leaking projection data into analytics
- avoid business logic inside routes
- prefer modular services
- keep authorization centralized
- prioritize maintainability over feature quantity

Avoid treating the platform as:

- a social app
- generic LMS
- consumer-first edtech product

---

# Recommended Read Order

1. package.json
2. turbo.json
3. prisma/schema.prisma
4. backend/README.md
5. frontend/README.md

---

# Note: The repository has been moved to the organisation's github profile. Feel free to open Organisation "TechSeekho"
