# Project Context

Post-training habit-builder for LeaderFactor learners. Replaces broken twice-weekly reminder emails with a frictionless weekly check-in loop, a biweekly manager-awareness email layer, and an admin engagement rollup. Interview take-home prototype — due Monday July 13, 2026.

## Critical Files

- PRD: `aiDocs/prd.md`
- MVP definition: `aiDocs/mvp.md`
- Coding style: `aiDocs/coding-style.md`
- Changelog: `aiDocs/changelog.md`

## Tech Stack

- **Frontend/framework:** React Router v7 — role-switcher UI, commitment screen, confirmation pages, admin view; deployed on Vercel
- **Database:** Neon Postgres — learners, managers, commitments, weekly check-in records, seed data
- **Email:** Resend — weekly learner check-ins, biweekly manager reports, live-send demo feature
- **Charts:** QuickChart — server-rendered PNG dot charts embedded in emails and pages
- **Hosting:** Vercel

## Key Domain Concepts

- **Learner loop:** weekly one-tap email (Yes / Partially / Not this week) → logs response → shows dot-chart history → stuck nudge if Partially/Not
- **Manager loop:** biweekly self-contained email with team check-in chart, no login needed
- **Admin view:** org-wide check-in rate aggregated from learner data
- **Missed week:** recorded as hollow dot, never auto-filled as "Not this week," no guilt follow-up
- **No streak tracking** — honest pattern visible, not gamified

## Important Notes

- No auth required — role switcher (Learner / Manager / Admin) with seeded demo data
- In-app email preview routes + live Resend send both required for demo
- One behavior per learner per cycle (no multi-commitment plans)
- Growth-mindset copy throughout — misses are data, not failures
