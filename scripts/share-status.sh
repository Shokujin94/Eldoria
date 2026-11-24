#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
compose=(docker compose -f compose.yaml -f compose.share.yaml)
"${compose[@]}" ps
if [[ -z "$("${compose[@]}" ps --status running -q tunnel)" ]]; then echo "Nenhum túnel ativo."; exit 1; fi
url=$("${compose[@]}" logs --no-color tunnel 2>&1 | grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' | head -n1 || true)
[[ "$url" =~ ^https://[a-z0-9-]+\.trycloudflare\.com$ ]] || { echo "URL não encontrada."; exit 1; }
curl -fsS --max-time 10 -H "Origin: $url" "$url/health"
printf '\nEndereço público temporário: %s\n' "$url"
