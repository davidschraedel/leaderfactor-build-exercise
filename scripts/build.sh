#!/usr/bin/env bash
set -euo pipefail

log() {
  local level="$1" msg="$2"
  printf '{"level":"%s","script":"build.sh","msg":"%s","ts":"%s"}\n' \
    "$level" "$msg" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}

log "info" "Loading environment"
if [ -f .env ]; then
  set -a; source .env; set +a
fi

log "info" "Running typecheck"
if npm run typecheck 2>&1; then
  log "info" "Typecheck passed"
else
  log "error" "Typecheck failed — fix type errors before building"
  exit 1
fi

log "info" "Building application"
if npm run build 2>&1; then
  log "info" "Build complete — output in build/"
else
  log "error" "Build failed"
  exit 1
fi
