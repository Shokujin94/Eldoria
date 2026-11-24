#!/usr/bin/env bash
# Deliberately offline, explicit confirmation; never use down -v.
set -euo pipefail
if [[ "$#" != 2 || "$2" != "--confirm-restore" ]]; then
  echo "Uso: bash scripts/beta-restore.sh /caminho/backup.sqlite --confirm-restore"
  echo "ATENÇÃO: substitui o progresso atual pelo da cópia. Sessões e códigos de recuperação serão invalidados."
  exit 1
fi
backup="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
test -f "$backup" && test -r "$backup" || { echo "Backup não encontrado"; exit 1; }
cd "$(dirname "$0")/.."
compose=(docker compose)
if [[ "${ELDORIA_PUBLIC:-0}" == 1 ]]; then compose+=(-f compose.yaml -f compose.public.yaml); fi
"${compose[@]}" stop eldoria
test -z "$("${compose[@]}" ps --status running -q eldoria)" || { echo "Servidor ainda está ativo"; exit 1; }
if ! "${compose[@]}" run --rm --no-deps -T eldoria node server/restore.mjs --confirm-offline-restore < "$backup"; then
  echo "Restauração não concluída. Servidor permanece parado; examine o erro antes de reiniciar."
  exit 1
fi
"${compose[@]}" up -d --wait
echo "Servidor reiniciado. Gere novos códigos de recuperação após entrar."
