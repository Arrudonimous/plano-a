#!/usr/bin/env bash
# Recria um banco local de teste e aplica todas as migrations em ordem.
# Uso: scripts/db/apply.sh [nome_do_banco]   (requer psql e um Postgres local)
set -euo pipefail
DB="${1:-plano_a_test}"
PSQL=(psql -v ON_ERROR_STOP=1 -q -X)
cd "$(dirname "$0")/../.."
"${PSQL[@]}" -d postgres -c "drop database if exists $DB" -c "create database $DB"
"${PSQL[@]}" -d "$DB" -f scripts/db/supabase-stub.sql
for f in supabase/migrations/*.sql; do
  echo "→ $f"
  "${PSQL[@]}" -d "$DB" -f "$f"
done
echo "OK: $DB"
