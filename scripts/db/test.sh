#!/usr/bin/env bash
# Recria o banco de teste, aplica as migrations e roda os testes de RLS.
set -euo pipefail
cd "$(dirname "$0")/../.."
./scripts/db/apply.sh plano_a_test >/dev/null
psql -v ON_ERROR_STOP=1 -X -q -t -A -d plano_a_test -f scripts/db/rls-test.sql 2>&1 | grep -E "NOTICE|ERROR|RLS" | sed 's/^psql:[^ ]* //'
