import { Link, useLocation } from 'react-router';

type RoleEntry = {
  label: string;
  href: string;
  prefixes: string[];
};

const ROLES: RoleEntry[] = [
  { label: 'Learner', href: '/commitment', prefixes: ['/commitment', '/onboarding', '/checkin', '/confirmation'] },
  { label: 'Manager', href: '/preview/manager-email', prefixes: ['/preview'] },
  { label: 'Admin', href: '/admin', prefixes: ['/admin'] },
];

export function RoleNav() {
  const { pathname } = useLocation();
  const activeRole = ROLES.find(({ prefixes }) => prefixes.some((p) => pathname.startsWith(p)));

  return (
    <nav className="border-b border-stone-200 bg-white px-6 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <span className="bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide">
            Demo
          </span>
          {activeRole && (
            <span>
              Viewing as: <span className="font-medium text-stone-600">{activeRole.label}</span>
            </span>
          )}
        </div>

        <div className="flex gap-1.5">
          {ROLES.map(({ label, href, prefixes }) => {
            const active = prefixes.some((p) => pathname.startsWith(p));
            return (
              <Link
                key={label}
                to={href}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[#1A2744] text-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
