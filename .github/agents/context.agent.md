---
name: context-agent
description: "Gather frontend project context: locate UI primitives, routing paths, and animation libraries. Output a concise report of component paths and recommended targets for scaffolding auth forms."
---

Use this agent to discover the frontend's existing UI primitives and animation tooling so the UI-forms agent can scaffold consistent components.

Steps:
1. Scan `frontend/src/app` for UI primitives (inputs, buttons, cards) and record their repository paths.
2. Confirm presence and versions of animation libraries (e.g. `framer-motion`, `gsap`) by checking `frontend/package.json`.
3. List auth-related routes (existing `login` and `signup` pages) and suggest where to place new components (recommended: `frontend/src/app/components/Auth`).
4. Return JSON with keys: `uiComponents`, `authPages`, `animationLibs`, `recommendedPaths`.

Constraints:
- Read-only: do not modify files. Only output findings and recommended target paths.
