# Despliegue en VPS propio

Este flujo reemplaza Easypanel por un VPS con Docker Compose y Nginx del host.

## Dominios objetivo

- Pruebas: `https://pruebas.livstre.com`
- Final: `https://terminado.livstre.com`

## Que queda preparado en este repo

- `deploy/vps/docker-compose.yml`: levanta frontend y backend para ambos dominios.
- `deploy/vps/nginx-pruebas.conf`: proxy del dominio de pruebas.
- `deploy/vps/nginx-terminado.conf`: proxy del dominio final.
- `backend-legacy/Dockerfile`: imagen lista para correr Laravel sobre Apache.
- `backend-legacy/.dockerignore`: evita subir secretos y basura local al build.

## Importante sobre secretos

- No guardar passwords del VPS en codigo, Git ni tablas de la app.
- Las credenciales operativas deben vivir solo en el VPS o en `.secure/` local.
- Los datos funcionales del sistema siguen en la base de datos; la configuracion del servidor no debe persistirse dentro de tablas de negocio.

## Archivos privados que debes crear fuera de Git

Crear estos archivos locales a partir de tus valores reales:

- `.secure/backend-legacy.pruebas.env.local` desde `.secure/backend-legacy.pruebas.env.example`
- `.secure/backend-legacy.terminado.env.local` desde `.secure/backend-legacy.terminado.env.example`

Minimos recomendados por entorno:

- `APP_KEY`
- `APP_NAME`
- `APP_ENV`
- `APP_URL`
- `APP_SERVER`
- `DB_CONNECTION=pgsql`
- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`
- `CORS_ALLOWED_ORIGINS`
- `INTERNAL_API_TOKEN`

Si el frontend va directo a Supabase en build, tambien define en el entorno del build:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Flujo recomendado en el VPS

1. Instalar Docker, Docker Compose plugin y Nginx.
2. Clonar este repo en el VPS.
3. Crear los archivos `.secure/backend-legacy.pruebas.env.local` y `.secure/backend-legacy.terminado.env.local` con claves reales.
4. Levantar contenedores:

```bash
docker compose -f deploy/vps/docker-compose.yml up -d --build
```

Alternativa automatizada en Ubuntu 24.04:

```bash
sudo bash deploy/vps/bootstrap-ubuntu.sh
sudo bash deploy/vps/publish.sh
```

5. Copiar los archivos `deploy/vps/nginx-pruebas.conf` y `deploy/vps/nginx-terminado.conf` a `/etc/nginx/sites-available/`.
6. Crear los symlinks en `/etc/nginx/sites-enabled/`.
7. Emitir SSL con Certbot para ambos dominios.
8. Recargar Nginx.

## Verificaciones esperadas

- `https://pruebas.livstre.com/` carga el dashboard.
- `https://pruebas.livstre.com/api/...` responde desde Laravel.
- `https://terminado.livstre.com/` carga el dashboard.
- `https://terminado.livstre.com/api/...` responde desde Laravel.

## Notas operativas

- Este despliegue sirve el frontend en la raiz `/` del subdominio, no en `/dashboard-app/`.
- El frontend usa `/api` para hablar con el backend del mismo dominio.
- Si usas una base de datos distinta para pruebas y final, separa por completo sus variables `DB_*`.
