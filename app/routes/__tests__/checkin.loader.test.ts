import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockDb, requestFor } from '~/test/mockDb';
import { CURRENT_WEEK } from '~/lib/week';

const state = vi.hoisted(() => ({
  mockDb: null as ReturnType<typeof createMockDb> | null,
}));

vi.mock('~/db/index', () => ({
  get db() {
    if (!state.mockDb) throw new Error('mockDb not initialized');
    return state.mockDb;
  },
}));

const { loader, action } = await import('../checkin');

const PENDING_TOKEN = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const LEARNER_ID = '22222222-2222-4222-8222-222222222201';

function pendingCheckin(overrides: Record<string, unknown> = {}) {
  return {
    id: '44444444-4444-4444-8444-444444444499',
    learnerId: LEARNER_ID,
    weekNumber: CURRENT_WEEK,
    token: PENDING_TOKEN,
    response: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function resetDb(selectResults: unknown[][] = []) {
  state.mockDb = createMockDb(selectResults);
  return state.mockDb;
}

describe('checkin loader', () => {
  beforeEach(() => {
    resetDb();
  });

  it('404s when token is missing', async () => {
    await expect(loader({ request: requestFor('/checkin') } as never)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('404s when token is unknown', async () => {
    resetDb([[]]);
    await expect(
      loader({ request: requestFor(`/checkin?token=${PENDING_TOKEN}`) } as never),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('404s when token belongs to a past week', async () => {
    resetDb([[pendingCheckin({ weekNumber: CURRENT_WEEK - 1 })]]);
    await expect(
      loader({ request: requestFor(`/checkin?token=${PENDING_TOKEN}`) } as never),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('redirects to confirmation when the token was already used', async () => {
    resetDb([[pendingCheckin({ response: 'yes' })]]);
    const result = await loader({
      request: requestFor(`/checkin?token=${PENDING_TOKEN}`),
    } as never);
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get('Location')).toBe(
      `/confirmation?token=${PENDING_TOKEN}`,
    );
  });

  it('returns learner + commitment for a pending current-week token', async () => {
    resetDb([
      [pendingCheckin()],
      [{ id: LEARNER_ID, name: 'Alex Chen' }],
      [{ label: 'Ask clarifying questions' }],
    ]);

    const result = await loader({
      request: requestFor(`/checkin?token=${PENDING_TOKEN}`),
    } as never);

    expect(result).toEqual({
      token: PENDING_TOKEN,
      learnerName: 'Alex Chen',
      commitment: 'Ask clarifying questions',
    });
  });
});

describe('checkin action', () => {
  beforeEach(() => {
    resetDb();
  });

  it('records a valid response and redirects to confirmation', async () => {
    const db = resetDb([[pendingCheckin()]]);
    const body = new FormData();
    body.set('response', 'yes');

    const result = await action({
      request: new Request(`http://localhost/checkin?token=${PENDING_TOKEN}`, {
        method: 'POST',
        body,
      }),
    } as never);

    expect(db.update).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get('Location')).toBe(
      `/confirmation?token=${PENDING_TOKEN}`,
    );
  });

  it('rejects an invalid response value', async () => {
    resetDb();
    const body = new FormData();
    body.set('response', 'maybe');

    await expect(
      action({
        request: new Request(`http://localhost/checkin?token=${PENDING_TOKEN}`, {
          method: 'POST',
          body,
        }),
      } as never),
    ).rejects.toMatchObject({ status: 400 });
  });
});
