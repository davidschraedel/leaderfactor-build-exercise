import 'dotenv/config';

import { eq } from 'drizzle-orm';

import { CURRENT_WEEK } from '../lib/week';
import { db } from './index';
import { checkins, commitments, learners, managers, type CheckinResponse } from './schema';

// ─── Stable IDs (keep consistent so re-seeds are idempotent) ─────────────────

export const SEED_IDS = {
  managers: {
    jordan: '11111111-1111-4111-8111-111111111101',
    sam: '11111111-1111-4111-8111-111111111102',
  },
  learners: {
    // Alex is the FRESH demo learner: no commitment, no current-week check-in.
    // The Phase 2 commitment action inserts both, demonstrating the full flow.
    alex: '22222222-2222-4222-8222-222222222201',
    maya: '22222222-2222-4222-8222-222222222202',
    chris: '22222222-2222-4222-8222-222222222203',
  },
  commitments: {
    // No entry for Alex — created by Phase 2 commitment action.
    maya: '33333333-3333-4333-8333-333333333302',
    chris: '33333333-3333-4333-8333-333333333303',
  },
} as const;

type SeedCheckin = {
  id: string;
  learnerId: string;
  weekNumber: number;
  token: string;
  response: CheckinResponse | null;
};

// Alex: weeks 1–(CURRENT_WEEK-1) with responses; no week-CURRENT_WEEK row.
// Maya & Chris: weeks 1–CURRENT_WEEK; week-CURRENT_WEEK has response=null.
const CHECKIN_ROWS: SeedCheckin[] = [
  // Alex — four weeks of history (previous cycle); fresh start this week
  { id: '44444444-4444-4444-8444-444444444401', learnerId: SEED_IDS.learners.alex, weekNumber: 1, token: '55555555-5555-4555-8555-555555555501', response: 'yes' },
  { id: '44444444-4444-4444-8444-444444444402', learnerId: SEED_IDS.learners.alex, weekNumber: 2, token: '55555555-5555-4555-8555-555555555502', response: 'yes' },
  { id: '44444444-4444-4444-8444-444444444403', learnerId: SEED_IDS.learners.alex, weekNumber: 3, token: '55555555-5555-4555-8555-555555555503', response: 'partially' },
  // Week 4: hollow dot (missed week — not auto-filled as "not")
  { id: '44444444-4444-4444-8444-444444444404', learnerId: SEED_IDS.learners.alex, weekNumber: 4, token: '55555555-5555-4555-8555-555555555504', response: null },
  // No week-CURRENT_WEEK row for Alex — Phase 2 creates it.

  // Maya — strong streak; week-CURRENT_WEEK pending
  { id: '44444444-4444-4444-8444-444444444406', learnerId: SEED_IDS.learners.maya, weekNumber: 1, token: '55555555-5555-4555-8555-555555555506', response: 'yes' },
  { id: '44444444-4444-4444-8444-444444444407', learnerId: SEED_IDS.learners.maya, weekNumber: 2, token: '55555555-5555-4555-8555-555555555507', response: 'yes' },
  { id: '44444444-4444-4444-8444-444444444408', learnerId: SEED_IDS.learners.maya, weekNumber: 3, token: '55555555-5555-4555-8555-555555555508', response: 'yes' },
  { id: '44444444-4444-4444-8444-444444444409', learnerId: SEED_IDS.learners.maya, weekNumber: 4, token: '55555555-5555-4555-8555-555555555509', response: 'partially' },
  { id: '44444444-4444-4444-8444-444444444410', learnerId: SEED_IDS.learners.maya, weekNumber: CURRENT_WEEK, token: '55555555-5555-4555-8555-555555555510', response: null },

  // Chris — mixed pattern with an honest "not" week; week-CURRENT_WEEK pending
  { id: '44444444-4444-4444-8444-444444444411', learnerId: SEED_IDS.learners.chris, weekNumber: 1, token: '55555555-5555-4555-8555-555555555511', response: 'partially' },
  { id: '44444444-4444-4444-8444-444444444412', learnerId: SEED_IDS.learners.chris, weekNumber: 2, token: '55555555-5555-4555-8555-555555555512', response: 'yes' },
  { id: '44444444-4444-4444-8444-444444444413', learnerId: SEED_IDS.learners.chris, weekNumber: 3, token: '55555555-5555-4555-8555-555555555513', response: 'not' },
  { id: '44444444-4444-4444-8444-444444444414', learnerId: SEED_IDS.learners.chris, weekNumber: 4, token: '55555555-5555-4555-8555-555555555514', response: 'yes' },
  { id: '44444444-4444-4444-8444-444444444415', learnerId: SEED_IDS.learners.chris, weekNumber: CURRENT_WEEK, token: '55555555-5555-4555-8555-555555555515', response: null },
];

async function clearSeedData() {
  // Delete in FK-safe order (children before parents).
  await db.delete(checkins);
  await db.delete(commitments);
  await db.delete(learners);
  await db.delete(managers);
}

export async function seed() {
  await clearSeedData();

  await db.insert(managers).values([
    { id: SEED_IDS.managers.jordan, name: 'Jordan Reyes', email: 'jordan.reyes@acme.com' },
    { id: SEED_IDS.managers.sam, name: 'Sam Ortiz', email: 'sam.ortiz@acme.com' },
  ]);

  await db.insert(learners).values([
    { id: SEED_IDS.learners.alex, name: 'Alex Chen', email: 'alex.chen@acme.com', managerId: SEED_IDS.managers.jordan },
    { id: SEED_IDS.learners.maya, name: 'Maya Patel', email: 'maya.patel@acme.com', managerId: SEED_IDS.managers.jordan },
    { id: SEED_IDS.learners.chris, name: 'Chris Rivera', email: 'chris.rivera@acme.com', managerId: SEED_IDS.managers.sam },
  ]);

  // Alex has no commitment — the Phase 2 commitment action inserts it.
  await db.insert(commitments).values([
    { id: SEED_IDS.commitments.maya, learnerId: SEED_IDS.learners.maya, label: 'Ask one open-ended question in every 1:1' },
    { id: SEED_IDS.commitments.chris, learnerId: SEED_IDS.learners.chris, label: 'Summarize what I heard before proposing solutions' },
  ]);

  await db.insert(checkins).values(
    CHECKIN_ROWS.map((row) => ({
      id: row.id,
      learnerId: row.learnerId,
      weekNumber: row.weekNumber,
      token: row.token,
      response: row.response,
    })),
  );

  const [allManagers, allLearners, allCheckins] = await Promise.all([
    db.select().from(managers),
    db.select().from(learners),
    db.select().from(checkins),
  ]);

  const currentWeekPending = await db
    .select()
    .from(checkins)
    .where(eq(checkins.weekNumber, CURRENT_WEEK));

  console.log('Seed complete.');
  console.log(`  managers : ${allManagers.length}`);
  console.log(`  learners : ${allLearners.length}`);
  console.log(`  checkins : ${allCheckins.length} (Alex week-${CURRENT_WEEK} created by Phase 2)`);
  console.log(`  week-${CURRENT_WEEK} pending : ${currentWeekPending.filter((r) => r.response === null).length}/2 (Maya + Chris)`);
  console.log(`  Alex demo token for Phase 2→3 flow: use commitment action to generate`);
  console.log(`  Maya demo token  (week ${CURRENT_WEEK}): 55555555-5555-4555-8555-555555555510`);
  console.log(`  Chris demo token (week ${CURRENT_WEEK}): 55555555-5555-4555-8555-555555555515`);
}

// Only auto-execute when this file is the entry point, not when imported.
const isMain = process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js');
if (isMain) {
  seed().catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}
