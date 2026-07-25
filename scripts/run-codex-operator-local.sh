#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# Keep this dedicated checkout current. Refuse non-fast-forward updates and
# preserve failed experiment branches for inspection.
git checkout main
git pull --ff-only origin main

OPERATOR_ENV_FILE="${OPERATOR_ENV_FILE:-.env.local}"
node --env-file-if-exists="$OPERATOR_ENV_FILE" scripts/run-codex-operator.mjs
