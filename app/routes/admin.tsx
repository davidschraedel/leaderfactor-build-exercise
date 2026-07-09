import { eq } from 'drizzle-orm';
import { RoleNav } from '~/components/RoleNav';
import { db } from '~/db/index';
import { checkins, commitments, learners, managers } from '~/db/schema';
import type { Route } from './+types/admin';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Admin — LeaderFactor' }];
}

type LearnerRow = {
  name: string;
  commitment: string | null;
  reported: number;
  total: number;
};

type ManagerRow = {
  name: string;
  email: string;
  learners: LearnerRow[];
  teamRate: number;
  reported: number;
  total: number;
};

export async function loader(_: Route.LoaderArgs) {
  const allManagers = await db.select().from(managers);

  const managerRows: ManagerRow[] = await Promise.all(
    allManagers.map(async (manager) => {
      const team = await db.select().from(learners).where(eq(learners.managerId, manager.id));

      const learnerRows: LearnerRow[] = await Promise.all(
        team.map(async (learner) => {
          const [commitment] = await db
            .select()
            .from(commitments)
            .where(eq(commitments.learnerId, learner.id))
            .limit(1);

          const allCheckins = await db
            .select({ response: checkins.response })
            .from(checkins)
            .where(eq(checkins.learnerId, learner.id));

          const reported = allCheckins.filter((c) => c.response !== null).length;
          const total = allCheckins.length;

          return {
            name: learner.name,
            commitment: commitment?.label ?? null,
            reported,
            total,
          };
        }),
      );

      const reported = learnerRows.reduce((sum, l) => sum + l.reported, 0);
      const total = learnerRows.reduce((sum, l) => sum + l.total, 0);
      const teamRate = total > 0 ? Math.round((reported / total) * 100) : 0;

      return {
        name: manager.name,
        email: manager.email,
        learners: learnerRows,
        teamRate,
        reported,
        total,
      };
    }),
  );

  const orgReported = managerRows.reduce((sum, m) => sum + m.reported, 0);
  const orgTotal = managerRows.reduce((sum, m) => sum + m.total, 0);
  const orgRate = orgTotal > 0 ? Math.round((orgReported / orgTotal) * 100) : 0;

  return { managerRows, orgRate, orgReported, orgTotal };
}

export default function Admin({ loaderData }: Route.ComponentProps) {
  const { managerRows, orgRate, orgReported, orgTotal } = loaderData;

  return (
    <main className="min-h-screen bg-[#F5F2EC]">
      <RoleNav />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-sm uppercase tracking-widest text-stone-500 mb-4">■ ADMIN</p>

        {/* Org-wide headline */}
        <div className="bg-[#1A2744] rounded-2xl p-8 mb-10 text-white">
          <p className="text-xs uppercase tracking-widest text-blue-300 mb-2">Org-wide check-in rate</p>
          <p className="text-7xl font-serif font-bold leading-none mb-3">{orgRate}%</p>
          <p className="text-blue-200 text-sm">
            {orgReported} of {orgTotal} possible week{orgTotal !== 1 ? 's' : ''} reported across all
            learners
          </p>
        </div>

        {/* Per-manager breakdown */}
        <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-4">By manager</h2>
        <div className="space-y-4">
          {managerRows.map((manager) => (
            <div key={manager.email} className="bg-white border border-stone-200 rounded-xl p-6">
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-lg font-serif font-bold text-[#1A1F2E]">{manager.name}</h3>
                <span className="text-2xl font-serif font-bold text-[#1A1F2E]">
                  {manager.teamRate}%
                </span>
              </div>
              <p className="text-xs text-stone-400 mb-4">
                {manager.reported} of {manager.total} weeks reported &nbsp;·&nbsp;{' '}
                {manager.learners.length} learner{manager.learners.length !== 1 ? 's' : ''}
              </p>

              <div className="divide-y divide-stone-100">
                {manager.learners.map((learner) => (
                  <div key={learner.name} className="flex items-center gap-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1F2E]">{learner.name}</p>
                      {learner.commitment && (
                        <p className="text-xs text-stone-400 truncate">{learner.commitment}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {learner.total > 0 ? (
                        <>
                          <p className="text-sm font-medium text-[#1A1F2E]">
                            {learner.reported}/{learner.total}
                          </p>
                          <p className="text-xs text-stone-400">weeks</p>
                        </>
                      ) : (
                        <p className="text-xs text-stone-400">No check-ins yet</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
