#!/usr/bin/env bash
set -euo pipefail

log() {
  local level="$1" msg="$2"
  printf '{"level":"%s","script":"test.sh","msg":"%s","ts":"%s"}\n' \
    "$level" "$msg" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}

# ── Environment ───────────────────────────────────────────────────────────────

ENV_TEST=".env.test"
if [ -f "$ENV_TEST" ]; then
  set -a; source "$ENV_TEST"; set +a
  log "info" "Test environment loaded from $ENV_TEST"
else
  log "warn" "No $ENV_TEST found — using ambient environment"
fi

# ── Phase 0: Prerequisites ────────────────────────────────────────────────────

log "info" "Phase 0: Checking required env keys"

missing=0
for key in DATABASE_URL RESEND_API_KEY; do
  if [ -z "${!key:-}" ]; then
    log "error" "Missing env key: $key (add to $ENV_TEST)"
    missing=1
  fi
done

if [ "$missing" -eq 1 ]; then
  log "error" "Phase 0 failed — fix missing env keys before continuing"
  exit 1
fi

log "info" "Phase 0 passed — env keys present"

# ── Phase 1–3: TypeScript ─────────────────────────────────────────────────────

log "info" "Phases 1-3: Typecheck (react-router typegen + tsc)"
if npm run typecheck 2>&1; then
  log "info" "Typecheck passed"
else
  log "error" "Typecheck failed — fix type errors before running tests"
  exit 1
fi

# ── Phase 1–3: Vitest suite ───────────────────────────────────────────────────

log "info" "Phases 1-3: Running Vitest suite"
if npx vitest run --reporter=verbose --config vitest.config.ts 2>&1; then
  log "info" "All tests passed"
else
  log "error" "Tests failed — see output above"
  exit 1
fi

log "info" "All checks passed ✓"
