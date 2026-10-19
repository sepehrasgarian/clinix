#!/usr/bin/env bash
# Starts everything for local development: API (http://localhost:8787) and web (http://localhost:3000).
# Usage: ./dev.sh            start both, Ctrl+C stops both
#        ./dev.sh --check    run typecheck + tests for every package and exit
set -euo pipefail
cd "$(dirname "$0")"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }

command -v node >/dev/null || { echo "Node.js is required. Install it from https://nodejs.org"; exit 1; }

if [ ! -d node_modules ] || [ ! -d node_modules/@clinix ]; then
  bold "Installing dependencies…"
  npm install
fi

if [ ! -f .env ]; then
  cp .env.example .env
  bold "Created .env from .env.example. Add your keys there (ANTHROPIC_API_KEY, GOOGLE_PLACES_API_KEY, APIFY_TOKEN)."
fi

if [ "${1:-}" = "--check" ]; then
  bold "Typecheck"; npm run typecheck
  bold "Tests"; npm test
  exit 0
fi

mkdir -p .logs
pids=()
kill_tree() {
  local pid=$1
  for child in $(pgrep -P "$pid" 2>/dev/null); do kill_tree "$child"; done
  kill "$pid" 2>/dev/null || true
}
cleanup() {
  printf '\nStopping…\n'
  for pid in "${pids[@]}"; do kill_tree "$pid"; done
  # Belt and braces: anything still holding our ports.
  lsof -ti tcp:3000 -ti tcp:8787 2>/dev/null | xargs kill 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

bold "Starting API on http://localhost:8787"
(cd apps/api && npx tsx watch src/index.ts) > .logs/api.log 2>&1 &
pids+=($!)

bold "Starting web on http://localhost:3000"
(cd apps/web && npx next dev -p 3000) > .logs/web.log 2>&1 &
pids+=($!)

for _ in $(seq 1 30); do curl -sf localhost:8787/health >/dev/null 2>&1 && break; sleep 1; done
for _ in $(seq 1 60); do curl -sf -o /dev/null localhost:3000/app 2>/dev/null && break; sleep 1; done

echo
bold "Ready."
echo "  Web      http://localhost:3000"
echo "  API      http://localhost:8787/health"
echo "  Logs     .logs/api.log  .logs/web.log"
echo
echo "Press Ctrl+C to stop both."
wait
