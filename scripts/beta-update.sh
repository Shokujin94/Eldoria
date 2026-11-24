#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
test "$(git branch --show-current)" = eldoria-online-0460 || { echo "Branch incorreta"; exit 1; }
test -z "$(git status --porcelain)" || { echo "Existem alterações locais; interrompido"; exit 1; }
compose=(docker compose)
if [[ "${ELDORIA_PUBLIC:-0}" == 1 ]]; then compose+=(-f compose.yaml -f compose.public.yaml); fi
"${compose[@]}" config --quiet
bash scripts/beta-backup.sh
git pull --ff-only
"${compose[@]}" config --quiet
"${compose[@]}" up -d --build --wait
"${compose[@]}" ps
