import { eq } from 'drizzle-orm';
import { Link, redirect } from 'react-router';
import { RoleNav } from '~/components/RoleNav';
import { db } from '~/db/index';
import { checkins, commitments, learners } from '~/db/schema';
import { buildDotChartUrl } from '~/lib/buildDotChartUrl';
import type { Route } from './+types/confirmation';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Check-In Recorded — LeaderFactor' }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const dismissed = url.searchParams.get('dismiss') === '1';

  if (!token) throw new Response('Not Found', { status: 404 });

  const [checkin] = await db
    .select()
    .from(checkins)
    .where(eq(checkins.token, token))
    .limit(1);

  if (!checkin) throw new Response('Not Found', { status: 404 });

  if (checkin.response === null) {
    return redirect(`/checkin?token=${token}`);
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

  const allCheckins = await db
    .select({ weekNumber: checkins.weekNumber, response: checkins.response })
    .from(checkins)
    .where(eq(checkins.learnerId, learner.id));

  const sorted = allCheckins
    .sort((a, b) => a.weekNumber - b.weekNumber)
    .map((c) => ({ week: c.weekNumber, response: c.response }));

  const reported = sorted.filter((c) => c.response !== null).length;
  const total = sorted.length;
  const chartUrl = buildDotChartUrl(sorted);

  return {
    token,
    learnerName: learner.name,
    commitment: commitment?.label ?? null,
    response: checkin.response,
    reported,
    total,
    chartUrl,
    dismissed,
  };
}

const RESPONSE_LABELS = {
  yes: 'Yes',
  partially: 'Partially',
  not: 'Not this week',
} as const;

const STUCK_MESSAGES = {
  partially: {
    heading: 'Partially is progress.',
    body: "You showed up and tried. Notice what made it harder this week.",
  },
  not: {
    heading: 'Missing a week is just information.',
    body: "Behavior change is non-linear. What got in the way? Make a small change.",
  },
} as const;

export default function Confirmation({ loaderData }: Route.ComponentProps) {
  const { token, learnerName, commitment, response, reported, total, chartUrl, dismissed } =
    loaderData;

  const showStuckNudge =
    !dismissed && (response === 'partially' || response === 'not');
  const stuckMessage = response === 'partially' || response === 'not' ? STUCK_MESSAGES[response] : null;

  return (
    <main className="min-h-screen bg-[#F5F2EC]">
      <RoleNav />
      <div className="max-w-xl mx-auto px-6 py-16">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#1A2744] text-white text-2xl mb-8">
          ✓
        </div>

        <p className="text-sm uppercase tracking-widest text-stone-500 mb-4">■ CHECK-IN RECORDED</p>
        <h1 className="text-4xl font-serif font-bold text-[#1A1F2E] mb-3">
          {response ? (
            <>
              Logged as <em>{RESPONSE_LABELS[response]}.</em>
            </>
          ) : (
            <>Your check-in is <em>on record.</em></>
          )}
        </h1>
        <p className="text-stone-600 mb-8 leading-relaxed">
          Thanks, {learnerName}.
        </p>

        {/* Stuck nudge — skippable via ?dismiss=1 */}
        {showStuckNudge && stuckMessage && (
          <div className="bg-white border border-stone-200 rounded-lg p-6 mb-8 relative">
            <p className="font-semibold text-[#1A1F2E] mb-1">{stuckMessage.heading}</p>
            <p className="text-sm text-stone-600 leading-relaxed">{stuckMessage.body}</p>
            <Link
              to={`/confirmation?token=${token}&dismiss=1`}
              className="absolute top-4 right-4 text-stone-300 hover:text-stone-500 text-lg leading-none"
              aria-label="Dismiss"
            >
              ×
            </Link>
          </div>
        )}

        {/* Dot chart section */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 mb-8">
          <p className="text-sm uppercase tracking-widest text-stone-400 mb-3">■ YOUR HISTORY</p>
          <p className="text-stone-700 font-medium mb-4">
            {reported} of {total} week{total !== 1 ? 's' : ''} reported
          </p>
          <img
            src={chartUrl}
            alt={`Dot chart: ${reported} of ${total} weeks reported`}
            width={400}
            height={80}
            className="w-full max-w-sm"
          />
          <div className="flex gap-4 mt-4 text-xs text-stone-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] inline-block" />
              Yes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block" />
              Partially
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9CA3AF] inline-block" />
              Not this week
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-[#9CA3AF] inline-block" />
              Missed
            </span>
          </div>
        </div>

        {commitment && (
          <div className="text-sm text-stone-500 border-t border-stone-200 pt-6 mb-10">
            <span className="text-xs uppercase tracking-widest text-stone-400 block mb-1">
              Your commitment
            </span>
            {commitment}
          </div>
        )}

        <Link
          to="/"
          className="inline-block bg-[#1A2744] text-white px-8 py-3 rounded-full font-medium hover:bg-[#243460] transition-colors"
        >
          Back to home →
        </Link>
      </div>
    </main>
  );
}
