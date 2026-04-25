---
name: ui-forms-agent
description: "Scaffold animated Login and Signup forms using the project's existing UI primitives and animation libraries."
---

This agent should be run after `context-agent` and must accept its JSON output as input. It will:

1. Use the `uiComponents` and `animationLibs` discovered by the context agent to choose the correct imports.
2. Create new files under `frontend/src/app/components/Auth`:
   - `FormCard.jsx` (shared animated card wrapper)
   - `LoginForm.jsx` (client-side login form)
   - `SignupForm.jsx` (client-side signup form)
3. Update `frontend/src/app/login/page.jsx` and `frontend/src/app/signup/page.jsx` to render the new forms.
4. Prefer using `@/` path aliases for imports (project uses `@/* -> ./src/*`).

Constraints:
- Keep changes minimal and consistent with existing UI tokens/classes.
- Use `framer-motion` if present; otherwise prefer CSS transitions.
