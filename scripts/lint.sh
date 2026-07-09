#!/usr/bin/env bash
set -euo pipefail

log() {
  local level="$1" msg="$2"
  printf '{"level":"%s","script":"lint.sh","msg":"%s","ts":"%s"}\n' \
    "$level" "$msg" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}

log "info" "Running TypeScript typecheck (strict mode)"
if npm run typecheck 2>&1; then
  log "info" "Typecheck passed — no type errors"
else
  log "error" "Typecheck failed — review tsc output above"
  exit 1
fi
