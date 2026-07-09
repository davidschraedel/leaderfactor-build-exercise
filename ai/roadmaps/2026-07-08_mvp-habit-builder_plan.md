# Implementation Plan: LeaderFactor MVP Habit-Builder

## Work Breakdown (The WHAT)

### Phase 1 — Project Scaffold & Database

- **Project init:** React Router v7 (Framework mode, SSR on Vercel), Tailwind CSS, TypeScript strict mode
- **DB schema (`app/db/schema.ts`):** Three flat tables — `learners`, `commitments`, `checkins` — plus a `managers` table (with email) so the manager email flow has a real target. Use Drizzle ORM with `neon-http` adapter.
- **Seed file (`app/db/seed.ts`):** 3 learners (each with a manager FK), 2 managers, hardcoded behavioral commitments, and a ~5-week history of synthetic check-in records to make dot-charts look meaningful on first load.
- **Drizzle config (`drizzle.config.ts`):** `dialect: 'postgresql'`, `out: './drizzle'`, points at `app/db/schema.ts`, reads `DATABASE_URL` from `.env`.
- **Deploy config:** `vercel.json` or `react-router.config.ts` with `ssr: true`; `DATABASE_URL` as a Vercel environment variable.

### Phase 2 — Role Switcher & Commitment Screen

- **Role switcher (`app/routes/_index.tsx`):** Query param `?role=learner|manager|admin`; defaults to learner. A top-level nav strip with three pill buttons navigates between roles — no auth, no session.
- **Commitment screen (`app/routes/commitment.tsx`):** Loader reads seeded behavioral options from DB (or hardcoded array). Three option cards with a "Select" action that writes the chosen commitment for the current demo learner, then redirects to onboarding copy. Action uses `<Form method="post">`. Note: the PRD specifies one AI-labeled suggestion tied to mock assessment results (P0), but the MVP cutting-room floor explicitly cuts it ("labeling it AI adds zero functionality and no demo credibility"). The plan follows mvp.md — three hardcoded options, no AI label. This is a deliberate cut.
- **Onboarding copy (`app/routes/onboarding.tsx`):** Post-selection static page; sets expectation for weekly check-in, growth-mindset tone, no guilt copy.

### Phase 3 — Weekly Check-In Flow

- **Token generation:** On commitment creation (or seed), generate a UUID token per learner + week combo, stored in the `checkins` table as `token` with `response = null` until used. Route: `/checkin?token=abc`.
- **Check-in handler (`app/routes/checkin.tsx`):**
  - `loader`: Validate token → 404 on miss → load learner, commitment, elapsed week history.
  - `action`: On POST (`response = yes|partially|not`), update `checkins` row, redirect to `/confirmation?token=abc`.
  - Page renders the email-like prompt inline (no login) with three large tap targets.
- **Confirmation page (`app/routes/confirmation.tsx`):**
  - `loader`: Load learner history → build QuickChart URL server-side → pass to component.
  - Renders dot-chart `<img>` (QuickChart PNG) with plain-text fallback above it (`"X of Y weeks reported"`).
  - Growth-mindset copy after response.
  - Stuck nudge after `partially` or `not`: skippable callout card — "Feeling stuck? A quick note to [manager] can help." Dismiss stores preference in a query param (no DB write needed for prototype).

### Phase 4 — Email Preview Routes & Live Send

- **Learner weekly check-in email (`app/routes/preview/weekly-email.tsx`):**
  - Loader seeds a demo learner + current week token.
  - Renders full email HTML with "Yes / Partially / Not this week" one-tap links pointing at `/checkin?token=…`.
  - Includes embedded QuickChart dot-chart `<img>` (optional per MVP cutting-room floor, but the token links are P0).
- **Manager biweekly status email (`app/routes/preview/manager-email.tsx`):**
  - Loader joins managers → learners → checkins, computes "X of Y weeks" ratio per report.
  - Renders full email HTML with each direct report's commitment, ratio, next check-in date, and the team activity QuickChart PNG.
  - Includes a "Send to manager" button (a `<Form method="post">` on the same route) that triggers a one-shot Resend send to the seeded manager's email address.
- **"Try it with your email" live send (`app/routes/preview/send-demo.tsx`):**
  - P0 per PRD: "in-app previews alone are insufficient to demonstrate a working system."
  - A small form — one email input + submit — with an `action` that calls Resend's `emails.send` API, sending the learner weekly check-in email to the entered address.
  - On success: confirmation message with the sent-to address. On Resend error: surface the error message inline (deliverability to spam is documented as a known tradeoff of Resend's default sending domain).
  - `RESEND_API_KEY` read from `process.env` in the server action only — never exposed to the client.

### Phase 5 — Admin Rollup Page

- **Admin view (`app/routes/admin.tsx`):**
  - Loader: aggregate check-ins across all learners → org-wide rate (`total responses / total possible weeks`), breakdown by manager.
  - Single page: headline metric ("68% org-wide check-in rate"), table or card list per manager with their team's ratio.

### Phase 6 — QuickChart Dot-Chart Utility

- **`app/lib/buildDotChartUrl.ts`:** Pure server-side function.
  - Input: array of `{ week: number; response: 'yes' | 'partially' | 'not' | null }`.
  - Builds a Chart.js scatter config: one `{x, y}` point per week, color-coded (`yes` = green `#22C55E`, `partially` = amber `#F59E0B`, `not` = gray `#9CA3AF`, `null` = hollow/empty outline).
  - URL-encodes via `encodeURIComponent`, returns full `https://quickchart.io/chart?c=…&w=400&h=80&bkg=white` string.
  - Used by both the confirmation page and email preview routes.

### Phase 7 — Vercel Deploy & Final Polish

- Deploy to Vercel (`vercel deploy --prod`).
- Verify seed runs on deploy (can use a `postbuild` script or a `/api/seed` one-shot route that no-ops if data exists).
- Smoke test: role switcher → commitment → check-in → confirmation dot chart visible → manager preview route → admin rollup.
- Write-up: four-section ~200-word document covering solution rationale, metrics, deliberate cuts, and AI-verification notes.

---

## Hour-by-Hour Priority Mapping

The PRD defines a 3-hour build window. Phases map to hours as follows. If time runs short, cut in order: chart polish first, then live send fallback to preview-only, then manager email.

| Hour       | Phases                      | Must-ship                                                                                                                                             | Cut-if-late                                                                                                                                                              |
| ---------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Hour 1** | Phase 1 + Phase 2 + Phase 3 | Seed data, role switcher, commitment screen, onboarding copy, check-in flow, confirmation page + dot chart, stuck nudge, missed-week hollow dot logic | Chart image polish (plain-text fallback is sufficient to unblock Hour 2)                                                                                                 |
| **Hour 2** | Phase 4 + Phase 5 + Phase 6 | Manager email preview route (with live-send button), admin rollup page, QuickChart utility wired to both surfaces, learner live-send form             | Manager live-send button (preview route alone satisfies the demo narrative if time is short); chart embedded in weekly email (confirmation-page chart is the core "aha") |
| **Hour 3** | Phase 7                     | Vercel deploy confirmed working, smoke test end-to-end, four-section write-up                                                                         | P1 features (manager encouragement, re-assessment countdown) — cut entirely if deploy takes longer than expected                                                         |

**True minimum (if everything slips):** Role switcher → learner picks commitment → in-app weekly email preview → one-tap check-in → confirmation page with dot chart + stuck nudge. Manager email as in-app preview only. Admin rollup as a static page with seeded numbers.

---

## Implementation Approach (The HOW)

**Framework mode (SSR = true):** All data loading and mutations happen in RR7 loaders/actions — no `useEffect` fetches, no client-side state for data. Vercel Functions handle the server-side rendering.

**Token-in-URL check-in:** Each `checkins` row has a `token uuid` column. The token is the sole "auth" mechanism. The loader validates token → loads context; the action writes the response. No session, no cookie.

**Role switcher:** A `?role=` query param is read in a root loader and put in the component tree via `useLoaderData`. The top-level `_index.tsx` acts as a redirect hub; each role has its own entry route.

**QuickChart:** All chart URLs built entirely server-side in `buildDotChartUrl.ts` before render. The result is an `<img src="…">` — zero client JS, works in emails. Plain-text summary (`"X of Y weeks reported"`) is always rendered above the image as required fallback.

**Seed-first approach:** Wire all views to seeded data before writing any form submissions. Coherent seed (3 learners, 2 managers, same org) prevents demo narrative breakage.

**Email previews & live send:** Plain HTML/JSX components at `/preview/*` routes — no MJML, no email SDK. The same JSX render logic used for the in-app preview is reused by the Resend `emails.send` call in the live-send action, so there's no duplicate template to maintain.

**Tailwind visual language:** Matches `aiDocs/coding-style.md` — warm off-white backgrounds (`bg-[#F5F2EC]`), near-black navy text (`text-[#1A1F2E]`), blue accent (`bg-[#4A6CF7]`), serif display headings, generous padding.

---

## Technical Considerations

- **Performance:** QuickChart is a third-party PNG render — latency is typically <300ms but any outage blocks the confirmation page. Mitigate with the mandatory plain-text fallback above the image and a `loading="lazy"` attribute on the `<img>`.
- **Security:** No real user data; all demo/seed. Token UUIDs are unguessable but not signed — acceptable for a prototype. Never embed QuickChart API keys in client-visible URLs.
- **Edge Cases:**
  - Token already used (response already recorded): loader detects non-null response → redirect straight to confirmation page without re-rendering the form.
  - Seed run twice: seed script should `DELETE` then re-insert, or use `ON CONFLICT DO NOTHING` per row with stable UUIDs.
  - QuickChart URL too long (>2000 chars): with ≤13 weeks of data the config is well under limit, but `buildDotChartUrl.ts` should assert week count ≤ 13.
  - Email image blocking (Gmail/Outlook): plain-text summary above the `<img>` is mandatory; confirmation page always shows the chart via the `<img>` regardless of email client.
  - `DATABASE_URL` missing at build time: Drizzle config guards with `!` assertion; Vercel env var must be set before first deploy.

---

## Dependencies and Prerequisites

- [ ] Neon Postgres project created; `DATABASE_URL` in `.env` and Vercel environment variables
- [ ] React Router v7 project scaffolded (`npx create-react-router@latest`)
- [ ] Tailwind CSS configured in the project
- [ ] Drizzle ORM + `@neondatabase/serverless` + `drizzle-kit` installed
- [ ] Vercel CLI installed and project linked (`vercel link`)
- [ ] QuickChart — no API key required for prototype (free tier, <60 req/min well within demo load)
- [ ] Resend API key in `.env` and Vercel environment variables as `RESEND_API_KEY` — required for the P0 live-send feature; `resend` package installed
