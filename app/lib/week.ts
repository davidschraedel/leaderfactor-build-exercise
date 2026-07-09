/**
 * The open check-in week for the demo.
 *
 * Maya and Chris have week-CURRENT_WEEK rows pre-seeded (response = null).
 * Alex has no commitment and no week-CURRENT_WEEK row — the Phase 2
 * commitment action inserts both, demonstrating the full commitment → check-in
 * flow. Historical rows (weeks 1 through CURRENT_WEEK - 1) exist for all
 * three learners and power the dot-chart history on the confirmation page.
 *
 * To advance the demo cycle, increment this constant and re-seed.
 *
 * Phase 3 token-validation rule: the check-in loader must verify that the
 * token's week_number equals CURRENT_WEEK before rendering the form. Alex's
 * week-4 row (response = null, missed week) has a valid token but must NOT
 * be actionable — it's a hollow dot, not an open check-in. Reject with 404
 * (or redirect to confirmation) for any token whose week_number !== CURRENT_WEEK.
 */
export const CURRENT_WEEK = 5;
