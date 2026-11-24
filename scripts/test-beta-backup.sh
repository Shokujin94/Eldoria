#!/usr/bin/env bash
# Isolated shell smoke test, no Docker or real database required.
set -euo pipefail
cd "$(dirname "$0")/.."
temp="$(mktemp -d)"
trap 'rm -rf "$temp"' EXIT
mkdir -p "$temp/bin" "$temp/out" "$temp/container"
export TEST_CONTAINER="$temp/container"
cat > "$temp/bin/docker" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
[[ "${MSYS_NO_PATHCONV:-}" == 1 && "${MSYS2_ARG_CONV_EXCL:-}" == '*' ]]
[[ "$1 $2 $3 $4" == "compose exec -T eldoria" ]]
shift 4
case "$1" in
node) [[ "$2" == server/backup.mjs && "$3" == /data/* ]]; printf 'SQLite format 3\000\001\002\377\r\n' > "$TEST_CONTAINER/${3##*/}" ;;
cat) [[ "$2" == /data/* ]]; if [[ "${TEST_BAD_COPY:-}" == 1 ]]; then printf 'truncated'; else cat "$TEST_CONTAINER/${2##*/}"; fi ;;
sha256sum) [[ "$2" == /data/* ]]; sha256sum "$TEST_CONTAINER/${2##*/}" ;;
rm) [[ "$2" == /data/* ]]; rm "$TEST_CONTAINER/${2##*/}" ;;
*) exit 2 ;;
esac
MOCK
chmod +x "$temp/bin/docker"
export PATH="$temp/bin:$PATH" ELDORIA_BACKUP_DIR="$temp/out"
bash scripts/beta-backup.sh
shopt -s nullglob
backups=("$temp/out/"*.sqlite)
[[ "${#backups[@]}" == 1 ]]
printf 'SQLite format 3\000\001\002\377\r\n' | cmp - "${backups[0]}"
if TEST_BAD_COPY=1 bash scripts/beta-backup.sh; then echo "Expected failure"; exit 1; fi
backups=("$temp/out/"*.sqlite)
partials=("$temp/out/"*.partial)
remote=("$temp/container/"*.sqlite)
[[ "${#backups[@]}" == 1 && "${#partials[@]}" == 0 && "${#remote[@]}" == 1 ]]
echo 'Backup: transferência binária, flags MSYS e rejeição de cópia truncada aprovadas.'
