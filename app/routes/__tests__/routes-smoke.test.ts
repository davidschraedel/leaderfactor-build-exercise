import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

// Wiring + demo-escape-hatch checks. Loader/action behavior lives in
// *.loader.test.ts — keep this file for registration and UI dead-end guards.

const routesDir = resolve(__dirname, '..');
const appDir = resolve(__dirname, '../..');

describe('routes.ts — Phase 3 routes registered', () => {
  const content = readFileSync(resolve(appDir, 'routes.ts'), 'utf-8');

  it('registers checkin', () => {
    expect(content).toContain("'checkin'");
  });

  it('registers confirmation', () => {
    expect(content).toContain("'confirmation'");
  });
});

describe('confirmation — demo escape hatches', () => {
  const content = readFileSync(resolve(routesDir, 'confirmation.tsx'), 'utf-8');

  it('includes RoleNav so testers can switch roles', () => {
    expect(content).toContain('RoleNav');
  });

  it('links back to home', () => {
    expect(content).toContain('to="/"');
    expect(content).toContain('Back to home');
  });
});

describe('onboarding — check-in preview link', () => {
  const content = readFileSync(resolve(routesDir, 'onboarding.tsx'), 'utf-8');

  it('surfaces a check-in link when a token is available', () => {
    expect(content).toContain('/checkin?token=');
    expect(content).toContain('Preview this week');
  });
});

describe('Phase 3 — CURRENT_WEEK export', () => {
  it('exports a positive CURRENT_WEEK', async () => {
    const { CURRENT_WEEK } = await import('~/lib/week');
    expect(typeof CURRENT_WEEK).toBe('number');
    expect(CURRENT_WEEK).toBeGreaterThan(0);
  });
});
