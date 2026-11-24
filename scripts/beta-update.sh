#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
test "$(git branch --show-current)" = eldoria-online-0460 || { echo "Branch incorreta"; exit 1; }
test -z "$(git status --porcelain)" || { echo "Existem alterações locais; interrompido"; exit 1; }
bash scripts/beta-backup.sh
git pull --ff-only
docker compose -f compose.yaml -f compose.public.yaml config --quiet
docker compose -f compose.yaml -f compose.public.yaml up -d --build --wait
docker compose -f compose.yaml -f compose.public.yaml ps
