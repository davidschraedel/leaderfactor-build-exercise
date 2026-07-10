import { vi } from 'vitest';

/**
 * Queue-based Drizzle stand-in for loader/action tests.
 * Each `select()` consumes the next queued result when the chain settles
 * (via `.limit()` or awaiting after `.where()`).
 */
export function createMockDb(selectResults: unknown[][] = []) {
  let selectIndex = 0;

  const takeSelectResult = () => {
    const result = selectResults[selectIndex] ?? [];
    selectIndex += 1;
    return Promise.resolve(result);
  };

  const selectChain = () => {
    const chain: {
      from: ReturnType<typeof vi.fn>;
      where: ReturnType<typeof vi.fn>;
      limit: ReturnType<typeof vi.fn>;
      then: (onFulfilled?: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) => Promise<unknown>;
    } = {
      from: vi.fn(),
      where: vi.fn(),
      limit: vi.fn(takeSelectResult),
      then: (onFulfilled, onRejected) => takeSelectResult().then(onFulfilled, onRejected),
    };
    chain.from.mockReturnValue(chain);
    chain.where.mockReturnValue(chain);
    return chain;
  };

  const insert = vi.fn(() => ({
    values: vi.fn(() => ({
      onConflictDoNothing: vi.fn(() => Promise.resolve()),
    })),
  }));

  const update = vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  }));

  return {
    select: vi.fn(selectChain),
    insert,
    update,
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
    _selectIndex: () => selectIndex,
  };
}

export type MockDb = ReturnType<typeof createMockDb>;

export function requestFor(path: string): Request {
  return new Request(`http://localhost${path}`);
}
