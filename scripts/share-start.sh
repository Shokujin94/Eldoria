#!/usr/bin/env bash
# Explicitly opens a TEMPORARY public HTTPS URL. The SQLite remains in the existing volume.
set -euo pipefail
cd "$(dirname "$0")/.."
docker info >/dev/null
compose=(docker compose -f compose.yaml -f compose.share.yaml)
if [[ -n "$("${compose[@]}" ps --status running -q tunnel)" ]]; then
  echo "Já existe um túnel ativo. Use bash scripts/share-status.sh ou encerre com bash scripts/share-stop.sh."
  exit 1
fi
docker compose up -d --build --wait eldoria
bash scripts/beta-backup.sh
success=0
trap 'if [[ "$success" != 1 ]]; then "${compose[@]}" stop tunnel >/dev/null 2>&1 || true; echo "Compartilhamento não confirmado; túnel encerrado." >&2; fi' EXIT
"${compose[@]}" up -d --no-deps --force-recreate tunnel
url=''
for ((i=0;i<45;i++)); do
  url=$("${compose[@]}" logs --no-color tunnel 2>&1 | grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' | head -n1 || true)
  [[ -n "$url" ]] && break
  sleep 2
done
[[ "$url" =~ ^https://[a-z0-9-]+\.trycloudflare\.com$ ]] || { echo "Não foi possível obter URL do túnel."; exit 1; }
cid=$("${compose[@]}" ps -q tunnel)
peer=$(docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$cid")
[[ "$peer" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "Endereço interno do túnel inválido."; exit 1; }
ELDORIA_SHARE_ORIGIN="$url" ELDORIA_SHARE_PEER="$peer" ELDORIA_SHARE_TRUST=1 "${compose[@]}" up -d --no-deps --wait eldoria
for ((i=0;i<15;i++)); do
  if curl -fsS --max-time 8 -H "Origin: $url" "$url/health" | grep -q '"ok":true'; then success=1; break; fi
  sleep 2
done
[[ "$success" == 1 ]] || { echo "Não foi possível validar a conexão HTTPS externa."; exit 1; }
echo "Eldoria disponível em: $url"
echo "Cadastro aberto. Link temporário, mantenha Docker e computador ligados."
echo "Para encerrar acesso externo: bash scripts/share-stop.sh"
