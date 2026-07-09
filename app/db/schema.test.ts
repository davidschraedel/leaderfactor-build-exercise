import { describe, expect, it } from 'vitest';

// Phase 1 smoke: confirm all four tables and the response enum are exported.
// These imports will fail at build time if the schema is malformed or missing.
import {
  checkinResponseEnum,
  checkins,
  commitments,
  learners,
  managers,
  type Checkin,
  type CheckinResponse,
  type Commitment,
  type Learner,
  type Manager,
} from './schema';

describe('Phase 1 — DB schema exports', () => {
  it('exports managers table', () => {
    expect(managers).toBeDefined();
  });

  it('exports learners table', () => {
    expect(learners).toBeDefined();
  });

  it('exports commitments table', () => {
    expect(commitments).toBeDefined();
  });

  it('exports checkins table with token column', () => {
    expect(checkins).toBeDefined();
    // Drizzle table objects expose column names via the schema symbol
    expect(Object.keys(checkins)).toContain('token');
  });

  it('exports checkin_response enum with correct values', () => {
    expect(checkinResponseEnum.enumValues).toEqual(['yes', 'partially', 'not']);
  });

  // Type-level smoke: if these compile, the inferred types are correct.
  it('inferred types are well-formed (compile-time check)', () => {
    const _manager: Manager | undefined = undefined;
    const _learner: Learner | undefined = undefined;
    const _commitment: Commitment | undefined = undefined;
    const _checkin: Checkin | undefined = undefined;
    const _response: CheckinResponse | undefined = undefined;
    expect(true).toBe(true);
  });
});
