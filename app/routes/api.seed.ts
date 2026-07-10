import { seed } from '~/db/seed';
import type { Route } from './+types/api.seed';

export async function action(_: Route.ActionArgs) {
  const secret = process.env.SEED_SECRET;
  if (!secret) {
    return Response.json({ error: 'SEED_SECRET env var is not set.' }, { status: 500 });
  }

  const body = await _.request.text();
  const params = new URLSearchParams(body);
  if (params.get('secret') !== secret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await seed();
    return Response.json({ ok: true, message: 'Seed complete.' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

// No default export — resource route only.
