#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TARGET="${1:-all}"

cd "$ROOT_DIR"

source_env_file() {
  local env_file="$1"
  if [[ ! -f "$env_file" ]]; then
    printf 'Missing required env file: %s\n' "$env_file" >&2
    exit 1
  fi

  set -a
  # shellcheck disable=SC1091
  source "$env_file"
  set +a
}

publish_staging() {
  source_env_file ".secure/vps.pruebas.env.local"
  docker rm -f castillo-frontend-pruebas elcastillo_castilloprueba >/dev/null 2>&1 || true
  docker compose -f deploy/vps/docker-compose.staging.yml up -d --build --force-recreate
  if command -v nginx >/dev/null 2>&1 && [[ -d /etc/nginx/sites-available ]]; then
    install -D -m 0644 deploy/vps/nginx-pruebas.conf /etc/nginx/sites-available/pruebas.livstre.com.conf
    if [[ -d /etc/nginx/sites-enabled ]]; then
      ln -sfn /etc/nginx/sites-available/pruebas.livstre.com.conf /etc/nginx/sites-enabled/pruebas.livstre.com.conf
    fi
  fi
}

publish_production() {
  source_env_file ".secure/vps.terminado.env.local"
  docker rm -f castillo-frontend-terminado elcastillo_castilloterminado >/dev/null 2>&1 || true
  docker compose -f deploy/vps/docker-compose.production.yml up -d --build --force-recreate
  if command -v nginx >/dev/null 2>&1 && [[ -d /etc/nginx/sites-available ]]; then
    install -D -m 0644 deploy/vps/nginx-terminado.conf /etc/nginx/sites-available/terminado.livstre.com.conf
    if [[ -d /etc/nginx/sites-enabled ]]; then
      ln -sfn /etc/nginx/sites-available/terminado.livstre.com.conf /etc/nginx/sites-enabled/terminado.livstre.com.conf
    fi
  fi
}

case "$TARGET" in
  staging)
    publish_staging
    ;;
  production)
    publish_production
    ;;
  all)
    publish_staging
    publish_production
    ;;
  *)
    printf 'Usage: %s [staging|production|all]\n' "$(basename "$0")" >&2
    exit 1
    ;;
esac

if command -v nginx >/dev/null 2>&1; then
  if [[ -d /etc/nginx/sites-enabled ]]; then
    rm -f /etc/nginx/sites-enabled/default
  fi
  nginx -t
  systemctl reload nginx
fi

printf 'Publicacion %s completada.\n' "$TARGET"
