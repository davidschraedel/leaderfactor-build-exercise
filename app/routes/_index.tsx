import { Link, redirect } from 'react-router';
import type { Route } from './+types/_index';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'LeaderFactor Habit Builder' },
    { name: 'description', content: 'Post-training habit-builder for LeaderFactor learners' },
  ];
}

export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const role = url.searchParams.get('role');

  if (role === 'learner') return redirect('/commitment');
  if (role === 'manager') return redirect('/preview/manager-email');
  if (role === 'admin') return redirect('/admin');

  return {};
}

const ROLES = [
  {
    id: 'learner',
    label: 'Learner',
    description: 'Pick a practice focus, get weekly check-ins, see your dot-chart history.',
    primary: true,
  },
  {
    id: 'manager',
    label: 'Manager',
    description: "Biweekly snapshot of your team's practice — no login needed.",
    primary: false,
  },
  {
    id: 'admin',
    label: 'Admin',
    description: 'Org-wide check-in rate, broken down by manager.',
    primary: false,
  },
] as const;

export default function Index() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <p className="text-sm uppercase tracking-widest text-stone-500 mb-4">■ LEADERFACTOR</p>
      <h1 className="text-5xl font-serif font-bold text-center mb-4">
        Where learning becomes <em>behavior.</em>
      </h1>
      <p className="text-stone-500 text-center max-w-md mb-14">
        A weekly habit-building loop for post-training learners. Choose a role to explore the demo.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
        {ROLES.map(({ id, label, description, primary }) => (
          <Link
            key={id}
            to={`/?role=${id}`}
            className={`flex-1 rounded-lg p-6 border transition-all hover:shadow-sm ${
              primary
                ? 'bg-[#1A2744] border-[#1A2744] text-white'
                : 'bg-white border-stone-200 text-[#1A1F2E] hover:border-[#4A6CF7]'
            }`}
          >
            <p className={`font-semibold mb-2 ${primary ? 'text-white' : 'text-[#1A1F2E]'}`}>
              {label} →
            </p>
            <p className={`text-sm leading-relaxed ${primary ? 'text-blue-200' : 'text-stone-500'}`}>
              {description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
