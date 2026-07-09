import type { Route } from './+types/_index';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'LeaderFactor Habit Builder' },
    { name: 'description', content: 'Post-training habit-builder for LeaderFactor learners' },
  ];
}

export default function Index() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-stone-500 mb-4">■ LEADERFACTOR</p>
        <h1 className="text-5xl font-serif font-bold mb-4">
          Where learning becomes <em>behavior.</em>
        </h1>
        <p className="text-stone-600 max-w-md mx-auto">
          Phase 1 complete. Database schema, seed, and SSR config in place.
        </p>
      </div>
    </main>
  );
}
