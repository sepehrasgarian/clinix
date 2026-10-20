#!/usr/bin/env bash
# Exercises the pre-commit guard in a throwaway repository. Run by ./dev.sh --check.
set -euo pipefail
hook="$(cd "$(dirname "$0")" && pwd)/pre-commit"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cd "$tmp"
git init -q . && git config user.email t@example.com && git config user.name t
mkdir -p scripts/githooks && cp "$hook" scripts/githooks/pre-commit && git config core.hooksPath scripts/githooks

expect() { # expect <0|1> <label>
  if git commit -q -m "$2" >/dev/null 2>&1; then got=0; else got=1; fi
  [ "$got" = "$1" ] || { echo "FAIL: $2 (expected exit $1, got $got)"; exit 1; }
  echo "ok: $2"
}

echo "hello" > README.md && git add README.md && expect 0 "ordinary file commits"
echo "private" > CLAUDE.md && git add -f CLAUDE.md && expect 1 "CLAUDE.md is blocked"; git restore --staged CLAUDE.md
echo "private" > AGENTS.md && git add -f AGENTS.md && expect 1 "AGENTS.md is blocked"; git restore --staged AGENTS.md
mkdir -p apps/api && echo "private" > apps/api/CLAUDE.md && git add -f apps/api/CLAUDE.md && expect 1 "nested CLAUDE.md is blocked"; git restore --staged apps/api/CLAUDE.md
echo "KEY=1" > .env && git add -f .env && expect 1 ".env is blocked"; git restore --staged .env
mkdir -p prompts_text/x && echo "guide" > prompts_text/x/g.txt && git add -f prompts_text && expect 1 "private guides are blocked"; git restore --staged prompts_text
# The sample key is assembled at run time so this file never contains one.
printf "const k = '%s%s';\n" "sk-ant-" "api03-abcdefghijklmnop" > key.ts && git add key.ts && expect 1 "a staged API key is blocked"; git restore --staged key.ts
echo "export const model = process.env.MODEL;" > ok.ts && git add ok.ts && expect 0 "normal code commits"
echo "all pre-commit guard checks passed"
