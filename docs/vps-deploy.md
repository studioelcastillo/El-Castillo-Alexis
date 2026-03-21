# Despliegue en VPS propio

Este flujo reemplaza el build de Easypanel por despliegue directo en VPS.

## Dominios objetivo

- Pruebas: `https://pruebas.livstre.com`
- Final: `https://terminado.livstre.com`

## Que queda preparado en este repo

- `deploy/vps/docker-compose.yml`: levanta frontend y backend para ambos dominios.
- `deploy/vps/docker-compose.staging.yml`: levanta solo `pruebas`.
- `deploy/vps/docker-compose.production.yml`: levanta solo `terminado`.
- `deploy/vps/nginx-pruebas.conf`: proxy del dominio de pruebas.
- `deploy/vps/nginx-terminado.conf`: proxy del dominio final.
- `backend-legacy/Dockerfile`: imagen lista para correr Laravel sobre Apache.
- `backend-legacy/.dockerignore`: evita subir secretos y basura local al build.
- `Dockerfile`: ahora usa `/` como base por defecto para despliegues en subdominios raiz (`pruebas` y `terminado`).
- `deploy/vps/remote-exec.mjs`: utilidad local para ejecutar comandos SSH no interactivos contra el VPS.

## Importante sobre secretos

- No guardar passwords del VPS en codigo, Git ni tablas de la app.
- Las credenciales operativas deben vivir solo en el VPS o en `.secure/` local.
- Los datos funcionales del sistema siguen en la base de datos; la configuracion del servidor no debe persistirse dentro de tablas de negocio.

## Archivos privados que debes crear fuera de Git

Crear estos archivos locales a partir de tus valores reales:

- `.secure/backend-legacy.pruebas.env.local` desde `.secure/backend-legacy.pruebas.env.example`
- `.secure/backend-legacy.terminado.env.local` desde `.secure/backend-legacy.terminado.env.example`
- `.secure/vps.pruebas.env.local` desde `.secure/vps.pruebas.env.example`
- `.secure/vps.terminado.env.local` desde `.secure/vps.terminado.env.example`
- `.secure/backend-rebuild.env.local` desde `.secure/backend-rebuild.env.example` si vas a reconstruir el backend desde un dump

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

- `PRUEBAS_VITE_SUPABASE_URL`
- `PRUEBAS_VITE_SUPABASE_ANON_KEY`
- `TERMINADO_VITE_SUPABASE_URL`
- `TERMINADO_VITE_SUPABASE_ANON_KEY`
- `PRUEBAS_VITE_API_URL` y `PRUEBAS_API_URL` si quieres sobreescribir `/api`
- `TERMINADO_VITE_API_URL` y `TERMINADO_API_URL` si quieres sobreescribir `/api`
- `PRUEBAS_NGINX_API_UPSTREAM` y `TERMINADO_NGINX_API_UPSTREAM` si quieres que Nginx del frontend haga proxy de `/api` hacia otro backend HTTP/HTTPS

## Flujo recomendado en el VPS

1. Instalar Docker, Docker Compose plugin y Nginx si el VPS no los tiene.
2. Clonar o actualizar este repo en el VPS en `/srv/el-castillo`.
3. Mantener fuera de Git los valores operativos reales de cada entorno.
4. Construir y publicar contenedores directos reutilizando Traefik del host.

```bash
sudo bash deploy/vps/publish.sh staging
sudo bash deploy/vps/publish.sh production
```

`deploy/vps/publish.sh` acepta `staging`, `production` o `all` y carga automaticamente los `.secure/*.env.local` requeridos para el entorno solicitado.

Alternativa automatizada en Ubuntu 24.04:

```bash
sudo bash deploy/vps/bootstrap-ubuntu.sh
sudo bash deploy/vps/publish.sh
```

5. Si no reutilizas Traefik y prefieres Nginx del host, copiar `deploy/vps/nginx-pruebas.conf` y `deploy/vps/nginx-terminado.conf` a `/etc/nginx/sites-available/`.
6. Crear los symlinks en `/etc/nginx/sites-enabled/`.
7. Emitir SSL con Certbot para ambos dominios.
8. Recargar Nginx.

## Operacion remota desde esta maquina

Para ejecutar comandos SSH no interactivos desde el repo local:

```bash
node deploy/vps/remote-exec.mjs <host> <usuario> <password> "docker ps"
```

La utilidad `deploy/vps/remote-exec.mjs` se uso para inspeccionar Hostinger, reconstruir contenedores y validar el estado real del routing.

## Automatizacion desde GitHub Actions

- `/.github/workflows/staging-deploy.yml` despliega `staging` automaticamente en cada push a la rama `staging`.
- `/.github/workflows/production-deploy.yml` despliega `production` solo por `workflow_dispatch`.
- Ambos esperan estos secretos en GitHub:
  - `VPS_SSH_HOST`
  - `VPS_SSH_USER`
  - `VPS_SSH_PRIVATE_KEY`
  - `VPS_SSH_KNOWN_HOSTS`
  - opcionales: `VPS_SSH_PORT`, `VPS_APP_DIR`
- Ademas el VPS debe tener un clon funcional del repo en `/srv/el-castillo` (o en `VPS_APP_DIR`) con permisos para `git pull` y con estos archivos locales presentes:
  - `.secure/vps.pruebas.env.local`
  - `.secure/vps.terminado.env.local`
  - `.secure/backend-legacy.pruebas.env.local`
  - `.secure/backend-legacy.terminado.env.local`
- Si tambien se va a publicar `studiocore-erp`, los archivos `vps.*.env.local` deben incluir ademas las variables `STUDIOCORE_*_ENABLED`, `STUDIOCORE_*_DATABASE_URL`, `STUDIOCORE_*_DATABASE_SCHEMA`, `STUDIOCORE_*_JWT_ACCESS_SECRET`, `STUDIOCORE_*_JWT_REFRESH_SECRET`, y opcionalmente `STUDIOCORE_*_VITE_API_BASE_URL`, `STUDIOCORE_*_VITE_BASE_PATH`, `STUDIOCORE_*_S3_*`.

## Estado operativo aplicado en Hostinger

- Repo clonado en `/srv/el-castillo`.
- Frontends directos construidos como `castillo-frontend-pruebas:direct` y `castillo-frontend-terminado:direct`.
- Contenedores activos fuera de Swarm con nombres `elcastillo_castilloprueba` y `elcastillo_castilloterminado`.
- Ambos contenedores unidos a las redes `easypanel` y `easypanel-elcastillo` para reutilizar el Traefik ya expuesto en `80/443`.
- Traefik sigue resolviendo los hosts desde `/etc/easypanel/traefik/config/main.yaml`, pero ya apunta a esos contenedores standalone y no a servicios Swarm desplegados por Easypanel.
- `/dashboard-app/` queda redirigido a `/` para compatibilidad con enlaces antiguos.
- `deploy/vps/nginx-pruebas.conf` y `deploy/vps/nginx-terminado.conf` ya incluyen `/health`, redireccion de `/dashboard-app/` a `/` y proxy `/api/` consistente hacia Laravel.
- `deploy/vps/publish.sh` tambien puede publicar `studiocore-erp` cuando `STUDIOCORE_STAGING_ENABLED=true` o `STUDIOCORE_PRODUCTION_ENABLED=true`, exponiendo el frontend nuevo en `/erp/` y el API en `/erp-api/`.
- El `nginx.conf` generado dentro de la imagen frontend tambien soporta `/health` y puede publicar `/api` por proxy si `NGINX_API_UPSTREAM` llega en build.
- Estado live actual: los dos frontends del VPS ya estan reconstruidos con `NGINX_API_UPSTREAM=https://el-castillo-api.bygeckode.com`, asi que `/api` responde por el mismo dominio aunque el backend legacy todavia no viva fisicamente en ese VPS.

## Verificaciones esperadas

- `https://pruebas.livstre.com/` carga el dashboard.
- `https://pruebas.livstre.com/api/...` debe responder desde el backend del mismo dominio cuando se conecte formalmente el backend legacy fuera de Easypanel.
- `https://terminado.livstre.com/` carga el dashboard.
- `https://terminado.livstre.com/api/...` debe responder desde el backend del mismo dominio cuando se conecte formalmente el backend legacy fuera de Easypanel.
- `https://pruebas.livstre.com/dashboard-app/` redirige a `/`.
- `https://terminado.livstre.com/dashboard-app/` redirige a `/`.
- Si `studiocore-erp` esta habilitado, `https://pruebas.livstre.com/erp/` debe cargar el frontend nuevo y `https://pruebas.livstre.com/erp-api/api/v1/health` debe responder OK.

## Notas operativas

- Este despliegue sirve el frontend en la raiz `/` del subdominio, no en `/dashboard-app/`.
- El frontend usa `/api` para hablar con el backend del mismo dominio.
- Si usas una base de datos distinta para pruebas y final, separa por completo sus variables `DB_*`.
- El frontend de `pruebas` debe construirse con `staging` y el de `terminado` con `production`; no mezclar `.env.staging` y `.env.production` al rebuild.
