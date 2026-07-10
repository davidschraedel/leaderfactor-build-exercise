#!/usr/bin/env bash
set -euo pipefail

log() {
  local level="$1" msg="$2"
  printf '{"level":"%s","script":"dev.sh","msg":"%s","ts":"%s"}\n' \
    "$level" "$msg" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}

if [ ! -f .env ]; then
  log "warn" "No .env file found — copy .env.example and fill in credentials"
fi

if [ -f .env ]; then
  set -a; source .env; set +a
  log "info" "Environment loaded from .env"
fi

log "info" "Starting dev server at http://localhost:5173"
npm run dev
