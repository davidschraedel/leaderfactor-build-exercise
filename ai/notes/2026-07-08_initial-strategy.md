## Updated Final Project Description

**What we're building:** A learner-facing habit-builder for post-training action plans, with a lightweight, biweekly manager-awareness layer, replacing the current twice-weekly emails that aren't working.

**Onboarding — At training completion:**

- When the learner finishes training and commits to their action plan, they see a short framing message setting expectations: "You'll get a quick weekly check-in — one tap, a few seconds. It keeps your manager aware of your progress, and if things stall, that's useful information, not a problem."
- This primes the learner with the "why" up front (manager awareness, easy effort, no guilt for a stall) so the first check-in email isn't a surprise.

**Core mechanism — Learner loop (weekly):**

- Each learner has one specific, concrete committed behavior (from curated guides or AI suggestion) tied to their assessment.
- Every week, on a fixed day, the learner gets a short email prompt: "Did you practice [behavior] this week?" with three tap options — Yes / Partially / Not this week.
- The email itself is the reporting action — a single tap logs the response instantly, no login or page load.
- Response triggers brief growth-mindset framing (progress isn't perfect, misses are data) rather than guilt-based copy, consistent with LeaderFactor's "rewarded vulnerability" philosophy.
- If Partially or Not this week is selected, an optional, skippable nudge appears: "Feeling stuck? A quick note to [manager] can help."
- Learners see simple visible progress over time (e.g., "4 of 5 weeks reported," a streak count) — no dashboard complexity, just enough pattern to make effort observable to themselves.

**Core mechanism — Manager loop (biweekly, ~6 emails across a 90-day cycle):**

- Roughly every two weeks, the manager gets a self-contained status email — no login, no dashboard to remember or find later.
- The email includes a small static chart showing each direct report's check-in activity (e.g., a simple bar per person: "3 of 4 weeks reported"), rendered server-side as an image so it displays reliably across email clients. [quickchart](https://quickchart.io/documentation/use-chart-js-in-email/)
- A plain-text status summary sits above the chart (e.g., "Team status: 4 on track, 1 falling behind") as a fallback in case images are blocked by default. [mailtrap](https://mailtrap.io/blog/embedding-images-in-html-email-have-the-rules-changed/)
- Because it's a static, archivable email, the manager can revisit it later without needing to log into anything — it holds its value even after the fact.
- One optional, one-tap way to reinforce (e.g., a short encouragement message) is included, but never required.

**Why this solves the stated problem:**

- The learner's weekly loop is the actual habit-builder — replacing a passive, ignorable reminder with a near-frictionless, single-tap ritual that produces a visible trend directly targets the "fewer than 5% keep engaging" problem.
- Manager awareness, reinforced with real data (the chart) rather than just a claim, operationalizes the "being watched" effect — people change behavior when they know someone else is aware, even without active enforcement. [blog.cohorty](https://blog.cohorty.app/the-psychology-of-accountability-why-being-watched-actually-works/)
- Weekly response data (Yes/Partially/Not this week) and streaks become the leading indicator the brief calls for, while formal re-assessment remains the real proof of behavior change.
- The manager's biweekly chart email gives admins something concrete and sellable — visible, team-level engagement data tied to manager awareness — a stronger story for L&D buyers than raw completion counts alone.

**What this deliberately excludes for the prototype:** manager accounts, magic-link persistent dashboards, calendar integration, and multi-step mutual-confirmation loops between manager and learner. These remain legitimate later-stage ideas, but the core hypothesis — frictionless weekly self-report plus lightweight, data-backed manager awareness — doesn't require them to be tested.

## Additional Points — Testability & Demo Access

**No login required to explore the app:**

- A simple role-switcher ("View as: Learner" / "View as: Manager") lets a reviewer see both personas instantly, with no signup, password, or account setup.
- The app is pre-populated with seeded demo data (1-2 learners, 1 manager) so it's immediately populated and realistic on first load.

**Two ways to see the emails in action:**

- **In-app preview page:** Static routes render the actual learner check-in email and manager report email (including the chart) exactly as they'd appear in an inbox — a guaranteed, no-dependency way to see the design regardless of email delivery.
- **"Try it with your email" input:** A small form lets a reviewer type their own email address and trigger a real send via Resend's API, proving the email pipeline actually works end-to-end rather than just looking right in a mockup. [resend](https://resend.com)

**Why both:** The preview page is a reliable fallback that always works; the live-send option demonstrates a genuinely working system, which matters for an interview context where "does this actually function" is part of what's being evaluated.

**Technical notes:**

- Uses Resend's free tier (3,000 emails/month, 100/day) — comfortably covers testing by multiple reviewers. [nuntly](https://nuntly.com/resend-pricing)
- Sends from Resend's default testing domain if a custom domain isn't verified in time — functional, though deliverability (spam-folder risk) is less predictable than with a verified domain; noted as a known tradeoff rather than a hidden gap.
- Basic email format validation only — no confirmation/verification flow needed for this scope.

## Additional Points — Resolving Scope Gaps

**1. Admin visibility (new):**

- A simple admin-facing page showing org-wide check-in rates aggregated across all seeded learners — e.g., "68% weekly check-in rate across 12 learners this cycle," plus a basic breakdown by team or manager if data allows.
- Built from the same weekly check-in data already collected in the learner loop — no new data model required, just an aggregate view on top of existing data.
- This closes the biggest sellability gap in the brief: admins get a concrete, exportable-feeling proof point beyond individual manager charts.

**2. Manager email now includes the actual commitment (updated):**

- The biweekly manager email states the specific committed behavior, not just activity status — e.g., "[Learner] committed to: ask one coaching question per 1:1."
- It includes reporting frequency to date ("reported 3 of 4 weeks") and the next expected check-in date ("next report due Friday").
- Copy explicitly positions the manager as a resource, not an enforcer — e.g., "If they're stuck, a quick word from you can help" — reinforcing the growth-mindset tone used in the learner loop.

**3. Re-assessment awareness (deliberate, minimal addition):**

- Both learner and manager surfaces include a simple, static countdown message tied to elapsed time in the 90-day cycle — e.g., "Your re-assessment is in 3 weeks."
- This is a deliberate, acknowledged cut: it signals the assess-learn-apply-prove loop without building actual re-assessment logic, scheduling, or scoring — noted explicitly as a v2 feature rather than a silent gap.

**4. Action plan creation screen (new):**

- A minimal commitment screen is added as the entry point to the whole flow — shown right after training completion.
- Presents 2-3 pre-written commitment options (representing curated behavioral guides) plus one AI-labeled suggested commitment (tied to mock assessment results).
- The learner clicks one to commit, which immediately triggers the onboarding framing message and starts the weekly check-in loop — making the full flow coherent from commitment through reporting.

**5. Learner progress visibility (resolved):**

- A brief progress view (e.g., "4 of 5 weeks reported," simple streak count) is shown to the learner immediately after they complete a weekly check-in — either inline in the email itself or on the confirmation screen reached via the one-tap link.
- This gives the check-in action a small, immediate reward beyond just logging data, reinforcing the habit loop rather than leaving progress only inferable from future emails.

## Proposed Tech Stack

| Layer              | Tool                                           | Purpose                                                                                                                                                       |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend/framework | React Router v7 (or Next.js if faster for you) | Role-switcher UI, commitment screen, progress/confirmation pages, admin view — deploys cleanly to Vercel with zero config vercel+1                            |
| Database           | Neon Postgres                                  | Stores learners, managers, commitments, weekly check-in records, seeded demo data — free tier, integrates directly with Vercel vercel+1                       |
| Email sending      | Resend                                         | Sends real check-in and manager report emails, including the "enter your email to test" live-send feature; supports test addresses for dev iteration resend+1 |
| Chart generation   | QuickChart                                     | Renders the manager's team check-in chart and the org-wide admin chart as static PNGs embeddable via <img> in emails and pages quickchart                     |
| Hosting/deploy     | Vercel                                         | One-command deploy, native React Router support, generates the deploy link you'll send vercel+1                                                               |
