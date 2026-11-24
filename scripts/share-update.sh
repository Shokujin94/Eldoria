#!/usr/bin/env bash
# Keep the existing Quick Tunnel running; rebuild only the game service.
set -euo pipefail
cd "$(dirname "$0")/.."
test "$(git branch --show-current)" = eldoria-online-0460 || { echo "Branch incorreta"; exit 1; }
test -z "$(git status --porcelain)" || { echo "Existem alterações locais; atualização interrompida"; exit 1; }
compose=(docker compose -f compose.yaml -f compose.share.yaml)
cid=$("${compose[@]}" ps --status running -q tunnel)
[[ -n "$cid" ]] || { echo "Túnel inativo. Use beta-update.sh e share-start.sh."; exit 1; }
url=$("${compose[@]}" logs --no-color tunnel 2>&1 | grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' | head -n1 || true)
[[ "$url" =~ ^https://[a-z0-9-]+\.trycloudflare\.com$ ]] || { echo "URL não encontrada"; exit 1; }
peer=$(docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$cid")
[[ "$peer" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "Peer do túnel inválido"; exit 1; }
export ELDORIA_SHARE_ORIGIN="$url" ELDORIA_SHARE_PEER="$peer" ELDORIA_SHARE_TRUST=1
"${compose[@]}" config --quiet
bash scripts/beta-backup.sh
git pull --ff-only
"${compose[@]}" config --quiet
"${compose[@]}" build eldoria
"${compose[@]}" up -d --no-deps --wait eldoria
for ((i=0;i<15;i++)); do
  if curl -fsS --max-time 8 -H "Origin: $url" "$url/health" | grep -q '"ok":true'; then
    echo "Servidor atualizado: $url"
    exit 0
  fi
  sleep 2
done
echo "Servidor reconstruído, mas acesso externo ainda não confirmado. Verifique share-status.sh."
exit 1
