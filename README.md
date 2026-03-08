# El Castillo - React/Vite

Node 18+ (recomendado Node 20).

## Instalar dependencias
```bash
npm install
```

## Desarrollo
```bash
npm run dev
```

## Build
```bash
npm run build
```

## Verificacion de secretos expuestos
```bash
npm run secrets:check
```

Este chequeo revisa archivos versionables y documentacion para detectar tokens o claves pegadas por error sin tocar tus `.env` locales reales.
Tambien conviene ejecutarlo antes de `npm run build` o de cualquier despliegue manual.
Los scripts heredados de conexion/importacion deben ejecutarse con variables de entorno (`SUPABASE_DB_PASSWORD`, `SUPABASE_DB_CONNECTION`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`) y no con valores pegados en archivo.

## Deploy

Estado actual de produccion:

- `https://pruebas.livstre.com` y `https://terminado.livstre.com` ya salen directo desde el VPS.
- Traefik del host sigue publicando ambos dominios, pero el frontend ya no depende del pipeline de build de Easypanel.
- La subruta legacy `/dashboard-app/` queda solo como compatibilidad y redirige a `/`.
- El contenedor frontend tambien puede publicar `/api` por proxy Nginx cuando se define `NGINX_API_UPSTREAM` en build, para cerrar el dominio unico sin tocar el bundle del cliente.
- GitHub Actions ahora puede desplegar `staging` automaticamente al VPS en cada push a la rama `staging`.
- `production` queda manual: se publica solo cuando se dispara el workflow `Deploy Production VPS` o cuando se pida explicitamente desde la CLI.

Si necesitas operar el despliegue directo en el VPS, revisa `docs/vps-deploy.md`.

Si aun quieres conservar un despliegue alterno en Easypanel, el repo sigue trayendo `Dockerfile` y webhooks opcionales:

```bash
EASYPANEL_STAGING_WEBHOOK="TU_WEBHOOK" npm run deploy:staging
EASYPANEL_PRODUCTION_WEBHOOK="TU_WEBHOOK" npm run deploy:production
```

Ese flujo ya no es el activo para los dos dominios live y debe considerarse solo como fallback/manual. El pipeline activo de GitHub Actions ahora despliega al VPS. Guias: `docs/easypanel.md` y `docs/vps-deploy.md`.

## Automatizacion GitHub -> VPS

- Push a rama `staging` -> workflow `Deploy Staging VPS` -> redeploy automatico de `https://pruebas.livstre.com`.
- Produccion -> workflow manual `Deploy Production VPS` -> redeploy de `https://terminado.livstre.com` solo cuando se decida.
- Ambos workflows validan `npm run secrets:check`, `npm run lint`, `npm run build`, `php artisan route:list` y `php artisan test` antes de desplegar.
- Secretos esperados en GitHub Actions:
  - `VPS_SSH_HOST`
  - `VPS_SSH_USER`
  - `VPS_SSH_PRIVATE_KEY`
  - `VPS_SSH_KNOWN_HOSTS`
  - opcionales: `VPS_SSH_PORT`, `VPS_APP_DIR`
- Requisito operativo en el VPS: el clon en `/srv/el-castillo` (o el `VPS_APP_DIR` configurado) debe poder hacer `git pull` del repo y tener materializados los archivos `.secure/*.env.local` necesarios para cada entorno.

Ademas, `/.github/workflows/ci.yml` valida frontend y backend en GitHub sin volver a activar despliegues automaticos legacy.

Si solo tienes una copia descargada del backend y un dump PostgreSQL, revisa `docs/backend-rebuild-from-zip.md` para levantar una reconstruccion funcional sin depender del servidor antiguo.

## Variables de entorno
Crea un `.env` (en el root o `apps/dashboard/.env`) y define:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (opcional, usa el API por defecto)
- `VITE_SESSION_KEY` (opcional, para cifrado de sesion)
- `VITE_SESSION_STORAGE` (opcional: `session` | `local`, por defecto `local`)
- `VITE_DASHBOARD_BASE` (recomendado actual para VPS: `/`)
- `DASHBOARD_APP_URL` (recomendado actual para VPS: `/`)
Plantilla disponible en `apps/dashboard/.env.example` y en `.secure/dashboard.env.example`.
Para el proxy de Gemini en servidor usa `server/.env.example`, `.secure/server.env.example` y `GEMINI_API_KEY`.
La documentacion de seguridad ahora vive en `security/` y la zona local privada para credenciales vive en `.secure/`.
Consulta `security/private-locations.md`, `security/secrets-inventory.md`, `security/secrets-policy.md` y `.secure/README.md`.
Regla del proyecto: toda nueva key, API, token, webhook o credencial privada debe guardarse en `.secure/` o en el proveedor correspondiente, y documentarse en `security/`.

## Migracion a carpeta segura
```bash
npm run secure:migrate
npm run secure:materialize
```

- `secure:migrate` copia los `.env` locales existentes hacia `.secure/` sin rotar claves.
- `secure:materialize` vuelve a materializar esos archivos hacia sus ubicaciones operativas si hace falta.
- La fuente recomendada de trabajo ahora es `.secure/`.
- Para despliegue directo en VPS, usa tambien `.secure/vps.pruebas.env.local` y `.secure/vps.terminado.env.local` a partir de sus `.example` versionados.

## Entornos recomendados
- Local: usar `.env` y `apps/dashboard/.env` apuntando a `staging` (`pnnrsqocukixusmzrlhy` / `https://pruebas.livstre.com/api`)
- Staging: usar `.env.staging` para `https://pruebas.livstre.com`
- Produccion: usar `.env.production` para `ysorlqfwqccsgxxkpzdx` / `https://terminado.livstre.com/api`
- Si el login local se hace por identificacion, define `SUPABASE_SERVICE_ROLE_KEY` en `.env` para habilitar la resolucion server-side solo en desarrollo

## Scripts de base de datos
Variables usadas por `test_conn.mjs`, `test_passwords.mjs`, `debug_sql.mjs`, `run_pg.mjs`:
- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_DB_PASSWORDS` (lista separada por comas para pruebas)
- `SUPABASE_DB_HOST` (opcional, default pooler)
- `SUPABASE_DB_PORT` (opcional, default 6543)
- `SUPABASE_DB_CONNECTION` (opcional, reemplaza las anteriores)
- `SQL_FILE` (opcional para `debug_sql.mjs`)
- `run_pg.mjs` ahora incluye `supabase/legacy_schema_missing.sql` para incorporar tablas legacy que no existian en el esquema actual
- Los scripts que aplican cambios por API deben ejecutarse primero contra `staging`; `supabase/apply_sql_files.mjs` y `supabase/run_migration.mjs` ya usan `staging` por defecto
- `scripts/sync_auth_from_users_admin.mjs` ahora usa por defecto `SYNC_MODE=temporary-strong`; `cedula-last5` solo debe usarse si se define explicitamente

## Backend legacy seguro
- Los endpoints legacy sensibles (`app/proxy`, `app/platform`, `bots`, `bot-views`) deben consumirse solo con `INTERNAL_API_TOKEN` y `X-Internal-Service`.
- Define `INTERNAL_API_ALLOWED_SERVICES` y `CORS_ALLOWED_ORIGINS` en el entorno del backend legacy.
- Usa `LEGACY_PLATFORM_PASSWORD_PLACEHOLDER` si necesitas seeders legacy sin exponer credenciales reales en codigo.

## Lovable
Configuracion sugerida:
- Project root: repo principal
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist/spa`
- Dev command: `npm run dev` (puerto 3000)
- Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Opcional: `VITE_API_URL`, `VITE_SESSION_STORAGE`, `VITE_DASHBOARD_BASE`

## Settings keys (Supabase)
- `monetization_token_value`: valor de token para liquidaciones (numero en texto).
- `license_clients`: JSON array para Control de Licencias.
- `license_revenue_data`: JSON array para graficas de licencias.

## Estructura
La app principal esta en `apps/dashboard` (React + Vite).

## Notas
Proyecto consolidado en React.
