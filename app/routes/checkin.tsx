import { eq } from 'drizzle-orm';
import { Form, redirect } from 'react-router';
import { db } from '~/db/index';
import { checkins, commitments, learners } from '~/db/schema';
import { CURRENT_WEEK } from '~/lib/week';
import type { Route } from './+types/checkin';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Weekly Check-In — LeaderFactor' }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) throw new Response('Not Found', { status: 404 });

  const [checkin] = await db
    .select()
    .from(checkins)
    .where(eq(checkins.token, token))
    .limit(1);

  if (!checkin || checkin.weekNumber !== CURRENT_WEEK) {
    throw new Response('Not Found', { status: 404 });
  }

  if (checkin.response !== null) {
    return redirect(`/confirmation?token=${token}`);
  }

  const [learner] = await db
    .select()
    .from(learners)
    .where(eq(learners.id, checkin.learnerId))
    .limit(1);

  if (!learner) throw new Response('Not Found', { status: 404 });

  const [commitment] = await db
    .select()
    .from(commitments)
    .where(eq(commitments.learnerId, learner.id))
    .limit(1);

  return {
    token,
    learnerName: learner.name,
    commitment: commitment?.label ?? null,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) throw new Response('Not Found', { status: 404 });

  const form = await request.formData();
  const response = form.get('response');

  if (response !== 'yes' && response !== 'partially' && response !== 'not') {
    throw new Response('Invalid response', { status: 400 });
  }

  const [checkin] = await db
    .select()
    .from(checkins)
    .where(eq(checkins.token, token))
    .limit(1);

  if (!checkin || checkin.weekNumber !== CURRENT_WEEK) {
    throw new Response('Not Found', { status: 404 });
  }

  if (checkin.response === null) {
    await db.update(checkins).set({ response }).where(eq(checkins.token, token));
  }

  return redirect(`/confirmation?token=${token}`);
}

const RESPONSE_OPTIONS = [
  {
    value: 'yes',
    label: 'Yes, I practiced it',
    description: 'I did the behavior this week as planned.',
    color: 'hover:border-[#22C55E] hover:bg-green-50',
    dot: 'bg-[#22C55E]',
  },
  {
    value: 'partially',
    label: 'Partially',
    description: 'I started or tried, but not fully.',
    color: 'hover:border-[#F59E0B] hover:bg-amber-50',
    dot: 'bg-[#F59E0B]',
  },
  {
    value: 'not',
    label: 'Not this week',
    description: "Life happened. It's just data.",
    color: 'hover:border-stone-400 hover:bg-stone-50',
    dot: 'bg-[#9CA3AF]',
  },
] as const;

export default function Checkin({ loaderData }: Route.ComponentProps) {
  const { token, learnerName, commitment } = loaderData;

  return (
    <main className="min-h-screen bg-[#F5F2EC]">
      <div className="max-w-xl mx-auto px-6 py-16">
        <p className="text-sm uppercase tracking-widest text-stone-500 mb-4">■ WEEKLY CHECK-IN</p>
        <h1 className="text-4xl font-serif font-bold text-[#1A1F2E] mb-3">
          Hey {learnerName}, how did <em>practice go?</em>
        </h1>

        {commitment && (
          <div className="bg-white border border-stone-200 rounded-lg px-5 py-4 mb-8 text-sm text-stone-600">
            <span className="text-xs uppercase tracking-widest text-stone-400 block mb-1">
              Your commitment
            </span>
            {commitment}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {RESPONSE_OPTIONS.map((option) => (
            <Form key={option.value} method="post" action={`/checkin?token=${token}`}>
              <input type="hidden" name="response" value={option.value} />
              <button
                type="submit"
                className={`w-full text-left bg-white border border-stone-200 rounded-lg p-6 transition-all group ${option.color}`}
              >
                <div className="flex items-center gap-4">
                  <span className={`shrink-0 w-4 h-4 rounded-full ${option.dot}`} />
                  <div>
                    <p className="font-semibold text-[#1A1F2E] text-lg leading-tight">
                      {option.label}
                    </p>
                    <p className="text-sm text-stone-500 mt-0.5">{option.description}</p>
                  </div>
                </div>
              </button>
            </Form>
          ))}
        </div>

        <p className="text-xs text-stone-400 mt-8 text-center">
          No judgment here — missed weeks show up as open dots, not failures.
        </p>
      </div>
    </main>
  );
}
