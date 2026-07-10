import { and, eq, isNull } from 'drizzle-orm';
import { Form, Link } from 'react-router';
import { Resend } from 'resend';
import { RoleNav } from '~/components/RoleNav';
import { db } from '~/db/index';
import { checkins, commitments, learners } from '~/db/schema';
import { buildDotChartUrl } from '~/lib/buildDotChartUrl';
import { buildLearnerEmailHtml } from '~/lib/learnerEmailHtml';
import { CURRENT_WEEK } from '~/lib/week';
import type { Route } from './+types/weekly-email';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Weekly Check-In Email Preview — LeaderFactor' }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const demo = await loadDemoData(baseUrl);

  return {
    ...demo,
    sent: false as boolean,
    sentTo: null as string | null,
    error: null as string | null,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const demo = await loadDemoData(baseUrl);

  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim();

  if (!email || !email.includes('@')) {
    return { ...demo, sent: false, sentTo: null, error: 'Please enter a valid email address.' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith('re_xxx')) {
    return {
      ...demo,
      sent: false,
      sentTo: null,
      error: 'RESEND_API_KEY is not configured. Add a real key to .env to enable live send.',
    };
  }

  const html = buildLearnerEmailHtml(demo);
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: 'LeaderFactor <onboarding@resend.dev>',
    to: email,
    subject: `Week ${CURRENT_WEEK} check-in — how did practice go?`,
    html,
  });

  if (error) {
    return { ...demo, sent: false, sentTo: null, error: error.message };
  }

  return { ...demo, sent: true, sentTo: email, error: null };
}

async function loadDemoData(baseUrl: string) {
  // Find the first learner who has a CURRENT_WEEK pending check-in — works with any seed data.
  const pendingRows = await db
    .select({ learnerId: checkins.learnerId, token: checkins.token })
    .from(checkins)
    .where(and(eq(checkins.weekNumber, CURRENT_WEEK), isNull(checkins.response)))
    .limit(1);

  const [pending] = pendingRows;
  if (!pending) throw new Response('No pending check-ins this week — run db:seed', { status: 500 });

  const { learnerId, token: currentToken } = pending;

  const [learner] = await db
    .select()
    .from(learners)
    .where(eq(learners.id, learnerId))
    .limit(1);

  if (!learner) throw new Response('Learner not found', { status: 500 });

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
    learnerName: learner.name,
    commitment: commitment?.label ?? '(no commitment yet)',
    token: currentToken,
    chartUrl,
    reported,
    total,
    baseUrl,
  };
}

export default function WeeklyEmailPreview({ loaderData, actionData }: Route.ComponentProps) {
  const data = actionData ?? loaderData;
  const { learnerName, commitment, token, chartUrl, reported, total, baseUrl, sent, sentTo, error } = data;
  const checkinUrl = `/checkin?token=${token}`;
  const weeksLabel = `${reported} of ${total} week${total !== 1 ? 's' : ''} reported`;

  return (
    <main className="min-h-screen bg-stone-100">
      <RoleNav />

      {/* Preview frame header */}
      <div className="max-w-2xl mx-auto px-6 pt-12 pb-6">
        <p className="text-sm uppercase tracking-widest text-stone-500 mb-2">■ EMAIL PREVIEW</p>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-3xl font-serif font-bold text-[#1A1F2E]">
            Learner weekly <em>check-in email</em>
          </h1>
        </div>
        <p className="text-stone-500 text-sm mb-6">
          Send yourself this email and tap a button to feel the full flow — email → check-in page → confirmation.
        </p>

        <Form method="post" className="flex gap-3 max-w-md">
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            required
            className="flex-1 border border-stone-300 rounded-full px-4 py-2.5 text-sm text-[#1A1F2E] placeholder-stone-400 focus:outline-none focus:border-[#4A6CF7] focus:ring-1 focus:ring-[#4A6CF7]"
          />
          <button
            type="submit"
            className="bg-[#4A6CF7] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#3558e0] transition-colors shrink-0"
          >
            Send →
          </button>
        </Form>

        {sent && sentTo && (
          <p className="mt-3 text-sm text-green-700 font-medium">
            ✓ Email sent to {sentTo}. Check your inbox and tap a button to try the full flow.
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-4">
          <Link
            to={checkinUrl}
            className="text-sm text-stone-400 hover:text-stone-600 underline transition-colors"
          >
            Or open the check-in page directly →
          </Link>
        </div>
      </div>

      {/* Email render */}
      <div className="max-w-2xl mx-auto px-6 pb-16">
        <p className="text-xs uppercase tracking-widest text-stone-400 mb-3">↓ What arrives in the inbox</p>
        <div className="border border-stone-300 rounded-xl overflow-hidden shadow-sm">
          {/* Fake email client chrome */}
          <div className="bg-white border-b border-stone-200 px-5 py-3">
            <p className="text-xs text-stone-400 font-mono">
              <span className="text-stone-500 font-medium">From:</span> onboarding@resend.dev
            </p>
            <p className="text-xs text-stone-400 font-mono">
              <span className="text-stone-500 font-medium">To:</span> {learnerName.toLowerCase().replace(' ', '.')}@acme.com
            </p>
            <p className="text-xs text-stone-400 font-mono">
              <span className="text-stone-500 font-medium">Subject:</span> Week {CURRENT_WEEK} check-in — how did practice go?
            </p>
          </div>

          {/* Email body rendered as HTML/JSX inline */}
          <div style={{ backgroundColor: '#F5F2EC', padding: '40px 24px', fontFamily: 'sans-serif' }}>
            <div style={{ maxWidth: 512 }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#78716C', margin: '0 0 8px 0' }}>
                ■ WEEKLY CHECK-IN
              </p>
              <h2 style={{ fontSize: 26, color: '#1A1F2E', margin: '0 0 12px 0', fontFamily: 'Georgia, serif', fontWeight: 'bold', lineHeight: 1.25 }}>
                Hey {learnerName}, how did practice go?
              </h2>
              <p style={{ fontSize: 15, color: '#57534E', margin: '0 0 28px 0', lineHeight: 1.6 }}>
                Your commitment: <strong>{commitment}</strong>
              </p>

              {/* Response buttons */}
              <table width="100%" style={{ borderCollapse: 'collapse', marginBottom: 32 }}>
                <tbody>
                  <tr>
                    {[
                      { label: '✓ Yes', color: '#22C55E' },
                      { label: '~ Partially', color: '#F59E0B' },
                      { label: '✗ Not this week', color: '#9CA3AF' },
                    ].map(({ label, color }) => (
                      <td key={label} style={{ paddingRight: label === '✗ Not this week' ? 0 : 8, width: '33%' }}>
                        <a
                          href={`${baseUrl}${checkinUrl}`}
                          style={{
                            display: 'block',
                            textAlign: 'center',
                            backgroundColor: color,
                            color: '#fff',
                            padding: '14px 8px',
                            borderRadius: 8,
                            textDecoration: 'none',
                            fontWeight: 700,
                            fontSize: 15,
                          }}
                        >
                          {label}
                        </a>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              {/* Dot chart */}
              <div style={{ backgroundColor: '#fff', border: '1px solid #E7E5E4', borderRadius: 8, padding: 24, marginBottom: 32 }}>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A8A29E', margin: '0 0 6px 0' }}>
                  ■ YOUR HISTORY
                </p>
                <p style={{ fontSize: 14, color: '#44403C', margin: '0 0 12px 0' }}>{weeksLabel}</p>
                <img
                  src={chartUrl}
                  width={400}
                  height={80}
                  alt={weeksLabel}
                  style={{ maxWidth: '100%', display: 'block' }}
                  loading="lazy"
                />
              </div>

              <p style={{ fontSize: 13, color: '#A8A29E', margin: 0 }}>
                Misses are data, not failures. One tap keeps your record honest.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
