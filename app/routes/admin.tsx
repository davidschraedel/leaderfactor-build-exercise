import { RoleNav } from '~/components/RoleNav';
import type { Route } from './+types/admin';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Admin — LeaderFactor' }];
}

export default function Admin(_: Route.ComponentProps) {
  return (
    <main className="min-h-screen">
      <RoleNav />

      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <p className="text-sm uppercase tracking-widest text-stone-500 mb-4">■ ADMIN</p>
        <h1 className="text-4xl font-serif font-bold mb-4">
          Org-wide rollup <em>coming soon.</em>
        </h1>
        <p className="text-stone-500 leading-relaxed">
          The admin view will show check-in rates across the whole organization, broken down by
          manager. Coming in Phase 5.
        </p>
      </div>
    </main>
  );
}
