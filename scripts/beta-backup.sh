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
compose=(docker compose)
if [[ "${ELDORIA_PUBLIC:-0}" == 1 ]]; then compose+=(-f compose.yaml -f compose.public.yaml); fi
# Git Bash/MSYS must not rewrite Linux paths passed to Docker.
# Stream binary bytes to a host-side redirection instead of docker cp:
# the shell handles the local path, Docker only receives container paths.
MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' "${compose[@]}" exec -T eldoria node server/backup.mjs "/data/$name"
MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' "${compose[@]}" exec -T eldoria cat "/data/$name" > "$tmp"
test -s "$tmp"
expected="$(MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' "${compose[@]}" exec -T eldoria sha256sum "/data/$name" | cut -d ' ' -f1)"
actual="$(sha256sum "$tmp" | cut -d ' ' -f1)"
[[ "$expected" =~ ^[0-9a-f]{64}$ && "$actual" == "$expected" ]] || { echo "Cópia incompleta ou checksum divergente; backup original preservado no container."; exit 1; }
chmod 600 "$tmp"
mv "$tmp" "$dir/$name"
MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' "${compose[@]}" exec -T eldoria rm "/data/$name"
echo "Backup verificado copiado: $dir/$name"
