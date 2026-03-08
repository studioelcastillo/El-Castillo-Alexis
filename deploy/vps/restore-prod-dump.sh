#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DUMP_FILE="${1:-}"
COMPOSE_FILE="$ROOT_DIR/deploy/vps/backend-rebuild.compose.yml"
ENV_FILE="$ROOT_DIR/.secure/backend-rebuild.env.local"

if [[ -z "$DUMP_FILE" ]]; then
  echo "Uso: deploy/vps/restore-prod-dump.sh /ruta/al/dump.sql"
  exit 1
fi

if [[ ! -f "$DUMP_FILE" ]]; then
  echo "No existe el dump: $DUMP_FILE"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Falta $ENV_FILE"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

docker compose -f "$COMPOSE_FILE" up -d castillo-backend-db

until docker exec castillo-backend-db pg_isready -U "${DB_USERNAME:-postgres}" >/dev/null 2>&1; do
  sleep 2
done

docker exec castillo-backend-db psql -U "${DB_USERNAME:-postgres}" -d postgres -c "DROP DATABASE IF EXISTS \"${DB_DATABASE:-castillo_backend}\";"
docker exec castillo-backend-db psql -U "${DB_USERNAME:-postgres}" -d postgres -c "CREATE DATABASE \"${DB_DATABASE:-castillo_backend}\";"
docker exec -i castillo-backend-db psql -U "${DB_USERNAME:-postgres}" -d "${DB_DATABASE:-castillo_backend}" < "$DUMP_FILE"

docker compose -f "$COMPOSE_FILE" up -d --build castillo-backend-app
docker exec castillo-backend-app php artisan key:generate --force
docker exec castillo-backend-app php artisan migrate --force || true
docker exec castillo-backend-app php artisan passport:keys --force || true

echo "Backend reconstruido en http://127.0.0.1:${BACKEND_APP_PORT:-5101}"
