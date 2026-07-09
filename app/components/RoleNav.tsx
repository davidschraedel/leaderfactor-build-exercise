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

  return (
    <nav className="flex justify-center gap-2 pt-6 pb-4">
      {ROLES.map(({ label, href, prefixes }) => {
        const active = prefixes.some((p) => pathname.startsWith(p));
        return (
          <Link
            key={label}
            to={href}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              active
                ? 'bg-[#1A2744] text-white'
                : 'bg-white border border-stone-200 text-[#1A1F2E] hover:bg-stone-50'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
