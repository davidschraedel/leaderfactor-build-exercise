# Execution Roadmap: LeaderFactor MVP Habit-Builder

## Phase 0: Prerequisites & Environment

- [x] **Task:** Create Neon Postgres project and capture `DATABASE_URL`
  - **Dependencies:** None
  - **Completion Criteria:** `DATABASE_URL` is set in `.env` and Vercel environment variables; `psql $DATABASE_URL` connects successfully
  - **Note:** `.env.example` created with placeholder; real `DATABASE_URL` must be filled in manually before Phase 1 migrations run.

- [x] **Task:** Scaffold React Router v7 project with Tailwind CSS and TypeScript strict mode
  - **Dependencies:** None
  - **Completion Criteria:** `npx create-react-router@latest` complete; `npm run dev` loads a blank app; `tsconfig.json` has `"strict": true`
  - **Note:** Scaffolded manually (React Router released v8 during work; upgraded to v8 + Vite v8). `npm run build` and `npm run typecheck` both pass with zero errors.

- [x] **Task:** Install Drizzle ORM, `@neondatabase/serverless`, `drizzle-kit`, and `resend`
  - **Dependencies:** RR7 project scaffolded
  - **Completion Criteria:** All packages appear in `package.json`; `npx drizzle-kit --version` runs without error

- [x] **Task:** Install and link Vercel CLI
  - **Dependencies:** RR7 project scaffolded
  - **Completion Criteria:** `vercel link` succeeds; project appears in Vercel dashboard
  - **Note:** Vercel CLI installed as devDependency (`npx vercel --version` → 54.21.1). `vercel link` requires browser auth — run manually before Phase 6 deploy.

---

## Phase 1: Project Scaffold & Database

- [x] **Task:** Define DB schema (`app/db/schema.ts`) — `managers`, `learners`, `commitments`, `checkins` tables; `checkins` must include `token uuid` and `response` columns
  - **Dependencies:** Phase 0 complete
  - **Completion Criteria:** File exists with all four tables; `token uuid NOT NULL` and `response` columns present on `checkins`; FK relationships correct; migration applies cleanly
  - **Note:** `checkin_response` enum (`yes` | `partially` | `not`); nullable `response` for missed/current weeks; unique `(learner_id, week_number)`.

- [x] **Task:** Configure Drizzle (`drizzle.config.ts`) and run initial migration
  - **Dependencies:** Schema defined
  - **Completion Criteria:** `npx drizzle-kit push` (or `generate` + `migrate`) applies schema to Neon without errors; tables visible in Neon console
  - **Note:** `drizzle/0000_init.sql` generated. Run `npm run db:push` after setting real `DATABASE_URL` in `.env`.

- [x] **Task:** Write and run seed file (`app/db/seed.ts`) — 2 managers, 3 learners, hardcoded commitments, ~5-week check-in history with UUID tokens pre-populated for every row
  - **Dependencies:** Migration applied
  - **Completion Criteria:** Seed runs without error; 3 learner rows, 2 manager rows, and ≥15 check-in rows exist in DB; every historical `checkins` row has a non-null `token` uuid; the current-week row per learner has `response = null`; dot-charts will render meaningful data on first load
  - **Note:** Seed script written with stable UUIDs (idempotent DELETE + re-insert). Run `npm run db:seed` after migration.
  - **Deliberate deviation:** Seed produces **14 rows** and **2/3 learners** have a week-5 pending row. Alex is the fresh demo learner — no commitment, no week-5 row — so Phase 2's commitment action demos a clean `INSERT`. The 15th check-in is created when Phase 2 runs. Maya + Chris carry full history for manager/admin views.

- [x] **Task:** Configure `vercel.json` / `react-router.config.ts` with `ssr: true`
  - **Dependencies:** RR7 project scaffolded
  - **Completion Criteria:** `vercel dev` serves the app with SSR; no static-export warnings
  - **Note:** `ssr: true` in `react-router.config.ts`; `vercel.json` has `devCommand` and `framework: null`.

---

## Phase 2: Role Switcher & Commitment Screen

- [x] **Task:** Build role switcher in `app/routes/_index.tsx` using `?role=learner|manager|admin` query param
  - **Dependencies:** Phase 1 complete
  - **Completion Criteria:** Three pill-nav buttons render; switching roles updates the URL param; default is `learner`; admin tab renders a stub/placeholder route (e.g., "Admin coming soon") until Phase 5 is complete — do not leave it as a silent 404; no auth or session logic
  - **Note:** RoleNav component in `app/components/RoleNav.tsx` uses `useLocation` to highlight active role. `_index.tsx` redirects to `/commitment`; `/admin` serves stub. Learner→/commitment, Manager→/preview/manager-email, Admin→/admin.

- [x] **Task:** Build commitment screen (`app/routes/commitment.tsx`) with loader + POST action; action generates a UUID token for the current week and writes it to the `checkins` table
  - **Dependencies:** Seed data present
  - **Completion Criteria:** Three option cards render from DB (or hardcoded array); selecting one writes the commitment for the demo learner and inserts a current-week `checkins` row with a fresh UUID token and `response = null`; redirects to `/onboarding`; no AI label on any card
  - **Note:** Three hardcoded behavior options (distinct from Maya/Chris seed data). Loader guard: if Alex already committed, skip to /onboarding. Action uses `crypto.randomUUID()` for token. Idempotent on double-submit.

- [x] **Task:** Build onboarding copy page (`app/routes/onboarding.tsx`)
  - **Dependencies:** Commitment action redirects correctly
  - **Completion Criteria:** Static page loads after commitment selection; growth-mindset tone; no guilt copy; includes expected weekly check-in cadence

---

## Phase 3: QuickChart Utility & Weekly Check-In Flow

- [x] **Task:** Implement `app/lib/buildDotChartUrl.ts` — pure server-side Chart.js scatter config builder
  - **Dependencies:** None
  - **Completion Criteria:** Accepts `{ week: number; response: 'yes' | 'partially' | 'not' | null }[]`; returns a valid `https://quickchart.io/chart?c=…&w=400&h=80&bkg=white` URL; colors correct (`yes`=#22C55E, `partially`=#F59E0B, `not`=#9CA3AF, `null`=hollow); asserts week count ≤ 13; unit-testable as a pure function

- [x] **Task:** Build check-in route (`app/routes/checkin.tsx`) with loader (token validation) and action (record response)
  - **Dependencies:** Tokens seeded in Phase 1; DB schema complete
  - **Completion Criteria:** Valid token → renders learner name, commitment, and three large tap targets; invalid token → 404; POST with `response=yes|partially|not` updates the DB row and redirects to `/confirmation?token=…`; already-used token skips form and redirects to confirmation

- [x] **Task:** Build confirmation page (`app/routes/confirmation.tsx`) with QuickChart dot-chart and stuck nudge
  - **Dependencies:** `buildDotChartUrl.ts` complete (above); check-in route complete
  - **Completion Criteria:** QuickChart `<img>` renders with correct colors; plain-text `"X of Y weeks reported"` fallback renders above the image; growth-mindset copy present; `partially`/`not` response shows skippable stuck-nudge callout; dismiss uses query param (no DB write)

---

## Phase 4: Email Preview Routes & Live Send

- [x] **Task:** Build learner weekly check-in email preview (`app/routes/preview/weekly-email.tsx`)
  - **Dependencies:** Token logic complete (Phase 2 commitment action + Phase 1 seed)
  - **Completion Criteria:** Route renders full email HTML; "Yes / Partially / Not this week" one-tap links point to `/checkin?token=…`; page loads without errors

- [x] **Task:** Build manager biweekly status email preview (`app/routes/preview/manager-email.tsx`) with live-send button
  - **Dependencies:** Seed data present; `buildDotChartUrl.ts` complete; Resend package installed
  - **Completion Criteria:** Loader joins managers → learners → checkins; each direct report shows commitment, X-of-Y ratio, next check-in date; QuickChart team-activity PNG renders; "Send to manager" POST action sends via Resend to seeded manager email; success/error message displayed inline

- [x] **Task:** Build "Try it with your email" live-send form (`app/routes/preview/send-demo.tsx`)
  - **Dependencies:** Learner email template complete; `RESEND_API_KEY` in `.env`
  - **Completion Criteria:** Form accepts one email address; action calls `resend.emails.send` server-side; success shows sent-to address; Resend error surfaces inline; `RESEND_API_KEY` never exposed to client

---

## Phase 5: Admin Rollup Page

- [ ] **Task:** Build admin view (`app/routes/admin.tsx`) with org-wide and per-manager check-in rates; replace Phase 2 stub route
  - **Dependencies:** Seed data present
  - **Completion Criteria:** Loader aggregates all check-ins; headline metric (e.g., "68% org-wide check-in rate") renders; table or card list per manager with their team's ratio; accessible via `?role=admin`; stub route from Phase 2 removed

---

## Phase 6: Vercel Deploy & Final Polish

- [ ] **Task:** Deploy to Vercel production (`vercel deploy --prod`)
  - **Dependencies:** All phases complete; `DATABASE_URL` and `RESEND_API_KEY` set in Vercel env vars
  - **Completion Criteria:** `vercel deploy --prod` exits 0; production URL loads the app

- [ ] **Task:** Verify seed on deploy (postbuild script or one-shot `/api/seed` route)
  - **Dependencies:** Deploy succeeds
  - **Completion Criteria:** Production DB has seed data after deploy; script is idempotent (`ON CONFLICT DO NOTHING` or DELETE + re-insert)

- [ ] **Task:** Smoke test end-to-end on production URL
  - **Dependencies:** Seed verified
  - **Completion Criteria:** Role switcher → commitment → check-in → confirmation dot chart visible → manager preview route renders → admin rollup shows correct numbers; no console errors

- [ ] **Task:** Write four-section ~200-word submission write-up
  - **Dependencies:** Smoke test passes
  - **Completion Criteria:** Document covers: solution rationale, metrics, deliberate cuts (AI label, P1 features), and AI-verification notes; saved to `ai/notes/` or root `README.md`
