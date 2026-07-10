import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockDb } from '~/test/mockDb';
import { CURRENT_WEEK } from '~/lib/week';

const ALEX_ID = '22222222-2222-4222-8222-222222222201';

const state = vi.hoisted(() => ({
  mockDb: null as ReturnType<typeof createMockDb> | null,
}));

vi.mock('~/db/index', () => ({
  get db() {
    if (!state.mockDb) throw new Error('mockDb not initialized');
    return state.mockDb;
  },
}));

const { loader } = await import('../onboarding');

const EXISTING_TOKEN = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function resetDb(selectResults: unknown[][] = []) {
  state.mockDb = createMockDb(selectResults);
  return state.mockDb;
}

describe('onboarding loader', () => {
  beforeEach(() => {
    resetDb();
  });

  it('returns null token when Alex is missing', async () => {
    resetDb([[]]);
    await expect(loader({} as never)).resolves.toEqual({ checkinToken: null });
  });

  it('returns null token when Alex has no commitment and no current-week check-in', async () => {
    resetDb([
      [{ id: ALEX_ID, name: 'Alex Chen' }],
      [], // no current-week check-in
      [], // no commitment
    ]);
    await expect(loader({} as never)).resolves.toEqual({ checkinToken: null });
  });

  it('returns the existing current-week token when present', async () => {
    resetDb([
      [{ id: ALEX_ID, name: 'Alex Chen' }],
      [{ token: EXISTING_TOKEN }],
    ]);
    await expect(loader({} as never)).resolves.toEqual({ checkinToken: EXISTING_TOKEN });
  });

  it('recreates a current-week check-in when Alex is committed but the row was deleted', async () => {
    const db = resetDb([
      [{ id: ALEX_ID, name: 'Alex Chen' }],
      [], // missing current-week check-in
      [{ id: 'commitment-1', learnerId: ALEX_ID, label: 'Practice focus' }],
      [{ token: EXISTING_TOKEN }], // re-fetch after insert
    ]);

    const result = await loader({} as never);

    expect(db.insert).toHaveBeenCalled();
    expect(result).toEqual({ checkinToken: EXISTING_TOKEN });

    const valuesFn = db.insert.mock.results[0]?.value.values as ReturnType<typeof vi.fn>;
    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({
        learnerId: ALEX_ID,
        weekNumber: CURRENT_WEEK,
        response: null,
      }),
    );
  });
});
