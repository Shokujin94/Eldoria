#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose -f compose.yaml -f compose.share.yaml stop tunnel
docker compose up -d --no-deps --wait eldoria
echo "Acesso externo encerrado. Jogo local: http://localhost:8787"
