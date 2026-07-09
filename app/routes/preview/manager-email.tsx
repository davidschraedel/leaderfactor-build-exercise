import { RoleNav } from '~/components/RoleNav';
import type { Route } from './+types/manager-email';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Manager Email Preview — LeaderFactor' }];
}

export default function ManagerEmailPreview(_: Route.ComponentProps) {
  return (
    <main className="min-h-screen">
      <RoleNav />

      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <p className="text-sm uppercase tracking-widest text-stone-500 mb-4">■ MANAGER VIEW</p>
        <h1 className="text-4xl font-serif font-bold mb-4">
          Team check-in email <em>coming soon.</em>
        </h1>
        <p className="text-stone-500 leading-relaxed">
          The manager view will show a biweekly email preview with each direct report's commitment,
          check-in ratio, and team activity chart. Coming in Phase 4.
        </p>
      </div>
    </main>
  );
}
