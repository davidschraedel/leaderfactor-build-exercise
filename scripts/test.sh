#!/usr/bin/env bash
set -euo pipefail

log() {
  local level="$1" msg="$2"
  printf '{"level":"%s","script":"test.sh","msg":"%s","ts":"%s"}\n' \
    "$level" "$msg" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}

# Load test env (safe dummy values — never real secrets)
ENV_TEST=".env.test"
if [ -f "$ENV_TEST" ]; then
  set -a; source "$ENV_TEST"; set +a
  log "info" "Test environment loaded from $ENV_TEST"
else
  log "warn" "No $ENV_TEST found — using ambient environment"
fi

log "info" "Step 1/2: Typecheck"
if npm run typecheck 2>&1; then
  log "info" "Typecheck passed"
else
  log "error" "Typecheck failed — fix before running tests"
  exit 1
fi

log "info" "Step 2/2: Running test suite"
if npx vitest run --reporter=verbose --passWithNoTests 2>&1; then
  log "info" "All tests passed"
else
  log "error" "Tests failed — see output above"
  exit 1
fi
