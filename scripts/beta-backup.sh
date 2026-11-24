#!/usr/bin/env bash
set -euo pipefail
umask 077
cd "$(dirname "$0")/.."
dir="${ELDORIA_BACKUP_DIR:-$HOME/eldoria-backups}"
mkdir -p "$dir"
stamp="$(date -u +%Y%m%dT%H%M%SZ)-$$"
name="eldoria-$stamp.sqlite"
tmp="$dir/$name.partial"
trap 'rm -f "$tmp"' EXIT
docker compose exec -T eldoria node server/backup.mjs "/data/$name"
docker compose cp "eldoria:/data/$name" "$tmp"
chmod 600 "$tmp"
mv "$tmp" "$dir/$name"
docker compose exec -T eldoria rm "/data/$name"
echo "Backup verificado copiado: $dir/$name"
