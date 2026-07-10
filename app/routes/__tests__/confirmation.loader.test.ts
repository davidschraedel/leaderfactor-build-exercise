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

const { loader } = await import('../confirmation');

const TOKEN = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const LEARNER_ID = '22222222-2222-4222-8222-222222222201';

function checkinRow(overrides: Record<string, unknown> = {}) {
  return {
    id: '44444444-4444-4444-8444-444444444498',
    learnerId: LEARNER_ID,
    weekNumber: CURRENT_WEEK,
    token: TOKEN,
    response: 'yes' as const,
    createdAt: new Date(),
    ...overrides,
  };
}

function resetDb(selectResults: unknown[][] = []) {
  state.mockDb = createMockDb(selectResults);
  return state.mockDb;
}

describe('confirmation loader', () => {
  beforeEach(() => {
    resetDb();
  });

  it('404s when token is missing', async () => {
    await expect(
      loader({ request: requestFor('/confirmation') } as never),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('404s when token is unknown', async () => {
    resetDb([[]]);
    await expect(
      loader({ request: requestFor(`/confirmation?token=${TOKEN}`) } as never),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('redirects pending tokens back to check-in (not a false confirmation)', async () => {
    resetDb([[checkinRow({ response: null })]]);
    const result = await loader({
      request: requestFor(`/confirmation?token=${TOKEN}`),
    } as never);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get('Location')).toBe(`/checkin?token=${TOKEN}`);
  });

  it('returns chart data for an answered check-in', async () => {
    resetDb([
      [checkinRow({ response: 'partially' })],
      [{ id: LEARNER_ID, name: 'Alex Chen' }],
      [{ label: 'Share one learning' }],
      [
        { weekNumber: 1, response: 'yes' },
        { weekNumber: 2, response: null },
        { weekNumber: CURRENT_WEEK, response: 'partially' },
      ],
    ]);

    const result = await loader({
      request: requestFor(`/confirmation?token=${TOKEN}`),
    } as never);

    expect(result).toMatchObject({
      token: TOKEN,
      learnerName: 'Alex Chen',
      commitment: 'Share one learning',
      response: 'partially',
      reported: 2,
      total: 3,
      dismissed: false,
    });
    expect((result as { chartUrl: string }).chartUrl).toContain('version=4');
    expect((result as { chartUrl: string }).chartUrl).toContain('quickchart.io');
  });
});
