# Project Context

Post-training habit-builder for LeaderFactor learners. Replaces broken twice-weekly reminder emails with a frictionless weekly check-in loop, a biweekly manager-awareness email layer, and an admin engagement rollup. Interview take-home prototype — due Monday July 13, 2026.

## Reference Docs (read these before working)

- PRD: `aiDocs/prd.md`
- MVP definition + cut list: `aiDocs/mvp.md`
- Coding style: `aiDocs/coding-style.md`
- Changelog: `aiDocs/changelog.md`
- Execution roadmap: `ai/roadmaps/2026-07-08_mvp-habit-builder_roadmap.md`

## Tech Stack

- **Framework:** React Router v8 (NOT v7 — upgraded during build) with SSR, deployed on Vercel
- **Database:** Neon Postgres via Drizzle ORM (`app/db/`)
- **Email:** Resend (`RESEND_API_KEY` in `.env`)
- **Charts:** QuickChart — server-rendered PNG dot charts via URL (`app/lib/buildDotChartUrl.ts`)
- **Hosting:** Vercel (`vercel.json` + `react-router.config.ts` with `ssr: true`, no `vercelPreset()` — incompatible with v8)

## Source Navigation

- Routes, components, DB client: `app/` — read `app/routes.ts` for the route map
- Schema + types: `app/db/schema.ts`
- Seed script + demo data: `app/db/seed.ts` (run: `npm run db:seed`)
- Demo cycle week constant: `app/lib/week.ts` (`CURRENT_WEEK`)
- Changelog (what's been built): `aiDocs/changelog.md`

## Key Domain Concepts

- **Learner loop:** weekly one-tap email (Yes / Partially / Not this week) → logs response → shows dot-chart history → stuck nudge if Partially/Not
- **Manager loop:** biweekly self-contained email with team check-in chart, no login needed
- **Admin view:** org-wide check-in rate aggregated from learner data
- **Missed week:** recorded as hollow dot, never auto-filled as "Not this week," no guilt follow-up
- **No streak tracking** — honest pattern visible, not gamified

## Important Notes

- No auth required — role switcher (Learner / Manager / Admin) via `?role=` query param
- One behavior per learner per cycle (no multi-commitment plans)
- Growth-mindset copy throughout — misses are data, not failures
