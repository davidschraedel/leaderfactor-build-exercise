# LeaderFactor Habit-Builder — Submission

## 1. Solution Rationale

Post-training engagement collapses because passive reminder emails require no action and show no pattern. This prototype replaces them with a **frictionless one-tap weekly loop**: learners pick one behavior to practice, receive a weekly email with three one-tap response links (Yes / Partially / Not this week), and see their honest dot-chart history immediately on the confirmation page — no login, no streaks, no guilt.

The core hypothesis is that *visible pattern + low friction* sustains practice where passive nudges fail. The manager layer (biweekly team status email) and admin rollup add accountability without surveillance.

## 2. Metrics

The demo surfaces three numbers that would be the real KPIs in production:

- **Org-wide check-in rate** (Admin view) — headline engagement signal
- **X of Y weeks reported per learner** (Manager email) — individual consistency, not binary pass/fail
- **Dot-chart history per learner** (Confirmation page) — learner's own honest record, growth-mindset framing

Seed data (3 learners, 2 managers, 14 check-in rows, 5-week cycle) makes all three live and meaningful on first load.

## 3. Deliberate Cuts

| Cut | Reason |
|---|---|
| "AI-labeled" commitment suggestions | Seeded options suffice; labeling adds zero demo value |
| Live email send (originally P1) | In-app preview + one working live-send demo route proves the pipeline; default domain → spam risk outweighs value |
| Manager encouragement one-tap | Adds a new response path with no upstream demo payoff |
| Re-assessment countdown | Static date math; easy v2 add, zero hypothesis value in prototype |
| Auth / login | Token-in-URL is correct for a one-tap check-in; adding auth would add friction without validating anything |

## 4. AI-Verification Notes

All logic paths are verifiable without running the code:

- **Token flow:** `checkin.tsx` loader validates token via `eq(checkins.token, token)` — invalid UUID → 404, already-responded → redirect to confirmation, fresh → render form.
- **Dot chart:** `buildDotChartUrl.ts` is a pure function; output URL is deterministic from input array. Colors: `yes` = #22C55E, `partially` = #F59E0B, `not` = #9CA3AF, `null` (missed) = hollow ring.
- **Seed idempotency:** `seed()` runs `DELETE` on all tables before inserting stable UUIDs — safe to call repeatedly via `POST /api/seed`. Requires `SEED_SECRET` env var (set in Vercel, never in client): `curl -X POST https://your-app.vercel.app/api/seed -d "secret=YOUR_SECRET"`
- **No client secrets:** `RESEND_API_KEY` and `DATABASE_URL` are accessed only in server-side loaders/actions; never referenced in client bundles.
