# Changelog

Concise change history for this project.

---

## Phase 0 — Prerequisites & Environment (2026-07-08)

**Complete.** App scaffolds, builds, and typechecks with zero errors.

**Files added:** `package.json`, `tsconfig.json`, `vite.config.ts`, `react-router.config.ts`, `vercel.json`, `app/root.tsx`, `app/routes.ts`, `app/routes/_index.tsx`, `app/app.css`, `.env.example`, `.gitignore`

**Deviations from roadmap:**
- React Router released v8 during work; upgraded to v8 (+ Vite v8, `@react-router/node`). API is identical for the MVP's use of loaders/actions.
- `vercel link` deferred — requires interactive browser auth. Run `npx vercel link` manually before Phase 6.
- `DATABASE_URL` in `.env` is a placeholder. Fill in before running Phase 1 migrations.

**Post-review fixes:** Removed stray `.js` files emitted by `tsc` (added `"noEmit": true`); fixed `vercel.json` `"framework"` from `"vite"` to `null` (prevents Vercel treating the SSR app as a static bundle).
