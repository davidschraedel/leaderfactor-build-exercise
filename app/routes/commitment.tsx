import { and, eq } from 'drizzle-orm';
import { redirect } from 'react-router';
import { Form } from 'react-router';
import { RoleNav } from '~/components/RoleNav';
import { db } from '~/db/index';
import { checkins, commitments, learners } from '~/db/schema';
import { CURRENT_WEEK } from '~/lib/week';
import type { Route } from './+types/commitment';

// Hardcoded behavior options — no AI label, three peer-reviewed choices.
const BEHAVIOR_OPTIONS = [
  {
    id: 'recognition',
    label: 'Recognize one teammate with specific, meaningful appreciation each week',
    description: 'Build a culture of noticing by naming what someone did and why it mattered.',
  },
  {
    id: 'clarify',
    label: 'Ask a clarifying question before offering advice or solutions',
    description: 'Slow down enough to understand the real problem before problem-solving.',
  },
  {
    id: 'share-learning',
    label: 'Share one learning — success or struggle — in a team setting this week',
    description: 'Model the growth mindset that makes teams psychologically safe.',
  },
] as const;

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Choose Your Practice Focus — LeaderFactor' }];
}

export async function loader(_: Route.LoaderArgs) {
  const [alex] = await db
    .select()
    .from(learners)
    .where(eq(learners.name, 'Alex Chen'))
    .limit(1);

  if (!alex) throw new Response('Demo learner not found — run db:seed first', { status: 500 });

  // If Alex already committed this cycle, skip straight to onboarding.
  const [existing] = await db
    .select()
    .from(commitments)
    .where(eq(commitments.learnerId, alex.id))
    .limit(1);

  if (existing) return redirect('/onboarding');

  return { learnerName: alex.name };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();

  // Reset branch: clears Alex's commitment so the picker can be reused in demo.
  if (form.get('_action') === 'reset') {
    const [alex] = await db
      .select()
      .from(learners)
      .where(eq(learners.name, 'Alex Chen'))
      .limit(1);
    if (alex) {
      await db.delete(commitments).where(eq(commitments.learnerId, alex.id));
      await db
        .delete(checkins)
        .where(and(eq(checkins.learnerId, alex.id), eq(checkins.weekNumber, CURRENT_WEEK)));
    }
    return redirect('/commitment');
  }

  const optionId = form.get('optionId');

  const option = BEHAVIOR_OPTIONS.find((o) => o.id === optionId);
  if (!option) throw new Response('Invalid option', { status: 400 });

  const [alex] = await db
    .select()
    .from(learners)
    .where(eq(learners.name, 'Alex Chen'))
    .limit(1);

  if (!alex) throw new Response('Demo learner not found', { status: 500 });

  // Guard: don't double-insert if action fires twice.
  const [existingCommitment] = await db
    .select()
    .from(commitments)
    .where(eq(commitments.learnerId, alex.id))
    .limit(1);

  if (!existingCommitment) {
    await db.insert(commitments).values({
      learnerId: alex.id,
      label: option.label,
    });
  }

  // Only insert a current-week check-in if one doesn't exist yet.
  const [currentWeekCheckin] = await db
    .select()
    .from(checkins)
    .where(and(eq(checkins.learnerId, alex.id), eq(checkins.weekNumber, CURRENT_WEEK)))
    .limit(1);

  if (!currentWeekCheckin) {
    await db.insert(checkins).values({
      learnerId: alex.id,
      weekNumber: CURRENT_WEEK,
      token: crypto.randomUUID(),
      response: null,
    });
  }

  return redirect('/onboarding');
}

export default function Commitment({ loaderData }: Route.ComponentProps) {
  const { learnerName } = loaderData;

  return (
    <main className="min-h-screen">
      <RoleNav />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-sm uppercase tracking-widest text-stone-500 mb-4">■ YOUR PRACTICE</p>
        <h1 className="text-4xl font-serif font-bold mb-3">
          Hey {learnerName}, choose your <em>focus behavior.</em>
        </h1>
        <p className="text-stone-500 mb-10">
          One behavior, practiced consistently, builds lasting change. Pick the one that feels most
          relevant to where you are right now.
        </p>

        <div className="flex flex-col gap-4">
          {BEHAVIOR_OPTIONS.map((option) => (
            <Form key={option.id} method="post">
              <input type="hidden" name="optionId" value={option.id} />
              <button
                type="submit"
                className="w-full text-left bg-white border border-stone-200 rounded-lg p-6 hover:border-[#4A6CF7] hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-[#1A1F2E] mb-1">{option.label}</p>
                    <p className="text-sm text-stone-500">{option.description}</p>
                  </div>
                  <span className="shrink-0 mt-1 text-stone-300 group-hover:text-[#4A6CF7] transition-colors text-lg">
                    →
                  </span>
                </div>
              </button>
            </Form>
          ))}
        </div>
      </div>
    </main>
  );
}
