#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR"
docker compose -f deploy/vps/docker-compose.yml up -d --build

install -D -m 0644 deploy/vps/nginx-pruebas.conf /etc/nginx/sites-available/pruebas.livstre.com.conf
install -D -m 0644 deploy/vps/nginx-terminado.conf /etc/nginx/sites-available/terminado.livstre.com.conf

ln -sfn /etc/nginx/sites-available/pruebas.livstre.com.conf /etc/nginx/sites-enabled/pruebas.livstre.com.conf
ln -sfn /etc/nginx/sites-available/terminado.livstre.com.conf /etc/nginx/sites-enabled/terminado.livstre.com.conf
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

printf '%s\n' 'Publicacion base completada. Falta emitir SSL si aun no existe.'
