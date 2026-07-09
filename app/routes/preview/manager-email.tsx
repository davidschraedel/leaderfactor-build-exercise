import { eq } from 'drizzle-orm';
import { Form } from 'react-router';
import { Resend } from 'resend';
import { RoleNav } from '~/components/RoleNav';
import { db } from '~/db/index';
import { checkins, commitments, learners, managers } from '~/db/schema';
import { buildDotChartUrl } from '~/lib/buildDotChartUrl';
import { CURRENT_WEEK } from '~/lib/week';
import type { Route } from './+types/manager-email';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Manager Email Preview — LeaderFactor' }];
}

type DirectReport = {
  name: string;
  email: string;
  commitment: string | null;
  reported: number;
  total: number;
  chartUrl: string;
  nextWeek: number;
};

async function loadJordanTeam() {
  // Use the first manager in the DB — no hardcoded name.
  const [jordan] = await db.select().from(managers).limit(1);

  if (!jordan) throw new Response('No managers found — run db:seed first', { status: 500 });

  const team = await db
    .select()
    .from(learners)
    .where(eq(learners.managerId, jordan.id));

  const reports: DirectReport[] = await Promise.all(
    team.map(async (learner) => {
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
      const chartUrl = total > 0 ? buildDotChartUrl(sorted) : '';

      return {
        name: learner.name,
        email: learner.email,
        commitment: commitment?.label ?? null,
        reported,
        total,
        chartUrl,
        nextWeek: CURRENT_WEEK + 1,
      };
    }),
  );

  return { jordan, reports };
}

export async function loader(_: Route.LoaderArgs) {
  const { jordan, reports } = await loadJordanTeam();

  const totalResponses = reports.reduce((sum, r) => sum + r.reported, 0);
  const totalPossible = reports.reduce((sum, r) => sum + r.total, 0);
  const teamRate = totalPossible > 0 ? Math.round((totalResponses / totalPossible) * 100) : 0;

  return {
    managerName: jordan.name,
    managerEmail: jordan.email,
    reports,
    totalResponses,
    totalPossible,
    teamRate,
    sent: false as boolean,
    sentTo: null as string | null,
    error: null as string | null,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { jordan, reports } = await loadJordanTeam();

  const totalResponses = reports.reduce((sum, r) => sum + r.reported, 0);
  const totalPossible = reports.reduce((sum, r) => sum + r.total, 0);
  const teamRate = totalPossible > 0 ? Math.round((totalResponses / totalPossible) * 100) : 0;

  const base = {
    managerName: jordan.name,
    managerEmail: jordan.email,
    reports,
    totalResponses,
    totalPossible,
    teamRate,
  };

  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim();

  if (!email || !email.includes('@')) {
    return { ...base, sent: false, sentTo: null, error: 'Please enter a valid email address.' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith('re_xxx')) {
    return {
      ...base,
      sent: false,
      sentTo: null,
      error: 'RESEND_API_KEY is not configured. Add a real key to .env to enable live send.',
    };
  }

  const resend = new Resend(apiKey);
  const html = buildManagerEmailHtml({ managerName: jordan.name, reports, teamRate });

  const { error } = await resend.emails.send({
    from: 'LeaderFactor <onboarding@resend.dev>',
    to: email,
    subject: `${jordan.name}, your team's practice pulse — ${teamRate}% this cycle`,
    html,
  });

  if (error) {
    return { ...base, sent: false, sentTo: null, error: error.message };
  }

  return { ...base, sent: true, sentTo: email, error: null };
}

function buildManagerEmailHtml({
  managerName,
  reports,
  teamRate,
}: {
  managerName: string;
  reports: DirectReport[];
  teamRate: number;
}): string {
  const reportRows = reports
    .map(
      (r) => `
    <div style="background-color:#fff;border:1px solid #E7E5E4;border-radius:8px;padding:20px;margin-bottom:16px;">
      <p style="font-size:16px;font-weight:700;color:#1A1F2E;margin:0 0 4px 0;">${r.name}</p>
      <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#A8A29E;margin:0 0 3px 0;">Practicing</p>
      <p style="font-size:13px;color:#78716C;margin:0 0 10px 0;">
        ${r.commitment ?? '<em>No commitment selected yet</em>'}
      </p>
      <p style="font-size:13px;color:#44403C;margin:0 0 10px 0;">
        <strong>${r.reported} of ${r.total}</strong> week${r.total !== 1 ? 's' : ''} reported &nbsp;·&nbsp; checks in weekly
      </p>
      ${
        r.chartUrl
          ? `<img src="${r.chartUrl}" width="360" height="72" alt="${r.reported} of ${r.total} weeks reported" style="max-width:100%;display:block;" />`
          : '<p style="font-size:13px;color:#A8A29E;margin:0;">No check-in history yet.</p>'
      }
    </div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Team Check-In Update — LeaderFactor</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F2EC;font-family:sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#78716C;margin:0 0 8px 0;">
      &#9632; BIWEEKLY TEAM UPDATE
    </p>
    <h1 style="font-size:28px;color:#1A1F2E;margin:0 0 12px 0;font-family:Georgia,serif;font-weight:bold;line-height:1.25;">
      Hey ${managerName}, here's your team's practice pulse.
    </h1>
    <p style="font-size:15px;color:#57534E;margin:0 0 20px 0;line-height:1.6;">
      Consistent follow-through between now and re-assessment is where score movement happens. Team check-in rate this cycle: <strong>${teamRate}%</strong>
    </p>

    ${reportRows}

    <p style="font-size:13px;color:#A8A29E;margin:24px 0 0 0;line-height:1.6;">
      Patterns matter more than any single week. If someone seems stuck, a brief conversation usually does more than a follow-up email.
    </p>
  </div>
</body>
</html>`;
}

export default function ManagerEmailPreview({ loaderData, actionData }: Route.ComponentProps) {
  const data = actionData ?? loaderData;
  const { managerName, managerEmail, reports, teamRate, sent, sentTo, error } = data;

  return (
    <main className="min-h-screen bg-stone-100">
      <RoleNav />

      <div className="max-w-2xl mx-auto px-6 pt-12 pb-6">
        <p className="text-sm uppercase tracking-widest text-stone-500 mb-2">■ EMAIL PREVIEW</p>
        <div className="flex items-start justify-between gap-4 mb-1">
          <h1 className="text-3xl font-serif font-bold text-[#1A1F2E]">
            Manager biweekly <em>team update</em>
          </h1>
        </div>
        <p className="text-stone-500 text-sm mb-6">
          {managerName} gets this every two weeks — team pulse at a glance, no login required.
        </p>

        {/* Live-send form */}
        <Form method="post" className="flex gap-3 max-w-md">
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            required
            className="flex-1 border border-stone-300 rounded-full px-4 py-2.5 text-sm text-[#1A1F2E] placeholder-stone-400 focus:outline-none focus:border-[#1A2744] focus:ring-1 focus:ring-[#1A2744]"
          />
          <button
            type="submit"
            className="bg-[#1A2744] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#243460] transition-colors shrink-0"
          >
            Send →
          </button>
        </Form>

        {sent && sentTo && (
          <p className="mt-3 text-sm text-green-700 font-medium">
            ✓ Email sent to {sentTo}
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      {/* Email render */}
      <div className="max-w-2xl mx-auto px-6 pb-16">
        <p className="text-xs uppercase tracking-widest text-stone-400 mb-3">↓ What arrives in the inbox</p>
        <div className="border border-stone-300 rounded-xl overflow-hidden shadow-sm">
          {/* Fake email chrome */}
          <div className="bg-white border-b border-stone-200 px-5 py-3">
            <p className="text-xs text-stone-400 font-mono">
              <span className="text-stone-500 font-medium">From:</span> onboarding@resend.dev
            </p>
            <p className="text-xs text-stone-400 font-mono">
              <span className="text-stone-500 font-medium">To:</span> {managerEmail}
            </p>
            <p className="text-xs text-stone-400 font-mono">
              <span className="text-stone-500 font-medium">Subject:</span> {managerName}, your team's practice pulse — {teamRate}% this cycle
            </p>
          </div>

          {/* Email body */}
          <div style={{ backgroundColor: '#F5F2EC', padding: '40px 24px', fontFamily: 'sans-serif' }}>
            <div style={{ maxWidth: 512 }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#78716C', margin: '0 0 8px 0' }}>
                ■ BIWEEKLY TEAM UPDATE
              </p>
              <h2 style={{ fontSize: 26, color: '#1A1F2E', margin: '0 0 12px 0', fontFamily: 'Georgia, serif', fontWeight: 'bold', lineHeight: 1.25 }}>
                Hey {managerName}, here's your team's practice pulse.
              </h2>
              <p style={{ fontSize: 15, color: '#57534E', margin: '0 0 20px 0', lineHeight: 1.6 }}>
                Consistent follow-through between now and re-assessment is where score movement happens. Team check-in rate this cycle: <strong>{teamRate}%</strong>
              </p>

              {/* Direct reports */}
              {reports.map((report) => (
                <div
                  key={report.email}
                  style={{ backgroundColor: '#fff', border: '1px solid #E7E5E4', borderRadius: 8, padding: 20, marginBottom: 16 }}
                >
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#1A1F2E', margin: '0 0 4px 0' }}>{report.name}</p>
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A8A29E', margin: '0 0 3px 0' }}>Practicing</p>
                  <p style={{ fontSize: 13, color: '#78716C', margin: '0 0 10px 0' }}>
                    {report.commitment ?? <em>No commitment selected yet</em>}
                  </p>
                  <p style={{ fontSize: 13, color: '#44403C', margin: '0 0 10px 0' }}>
                    <strong>{report.reported} of {report.total}</strong> week{report.total !== 1 ? 's' : ''} reported
                    &nbsp;·&nbsp; checks in weekly
                  </p>
                  {report.chartUrl ? (
                    <img
                      src={report.chartUrl}
                      width={360}
                      height={72}
                      alt={`${report.reported} of ${report.total} weeks reported`}
                      style={{ maxWidth: '100%', display: 'block' }}
                      loading="lazy"
                    />
                  ) : (
                    <p style={{ fontSize: 13, color: '#A8A29E', margin: 0 }}>No check-in history yet.</p>
                  )}
                </div>
              ))}

              <p style={{ fontSize: 13, color: '#A8A29E', margin: '24px 0 0 0', lineHeight: 1.6 }}>
                Patterns matter more than any single week. If someone seems stuck, a brief conversation usually does more than a follow-up email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
