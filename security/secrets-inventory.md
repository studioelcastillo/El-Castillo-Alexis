# Inventario de secretos

Este documento registra que secretos existen, donde se usan y donde deben guardarse.
No debe contener valores reales.

## Reglas
- Nunca pegar tokens, passwords, DSN completos ni claves privadas aqui.
- Registrar solo nombre, entorno, uso y sistema de almacenamiento.
- Separar secretos publicos de privados.

## Matriz actual

| Variable / secreto | Tipo | Entorno | Uso | Fuente de carga recomendada | Referencias |
| --- | --- | --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Publico | local, staging, production | Cliente web | Variables de app frontend | `README.md`, `apps/dashboard/supabaseClient.ts` |
| `VITE_SUPABASE_ANON_KEY` | Publico | local, staging, production | Cliente web | Variables de app frontend | `README.md`, `apps/dashboard/supabaseClient.ts` |
| `VITE_API_URL` | Publico | local, staging, production | Base URL del API | Variables de app frontend | `apps/dashboard/api.ts` |
| `VITE_SESSION_KEY` | Privado bajo | local, staging, production | Cifrado de sesion local | Variables de app frontend/servidor segun despliegue | `README.md`, `apps/dashboard/utils/session.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Privado critico | local, staging | Login server-side local, scripts admin | Gestor de secretos o variables de shell locales | `.env.example`, `README.md` |
| `SUPABASE_SECRET_KEY` | Privado critico | staging, production | REST admin / Auth admin / importaciones | Gestor de secretos o variables de shell temporales | `scripts/sync_auth_from_users_admin.mjs`, `scripts/import_aws_dump_rest.mjs` |
| `SUPABASE_PROJECT_ID` | Sensible | staging, production | Conexion PostgreSQL | Variables de shell o gestor de secretos | `run_pg.mjs`, `debug_sql.mjs` |
| `SUPABASE_DB_PASSWORD` | Privado critico | staging, production | Conexion PostgreSQL | Gestor de secretos o variable efimera | `run_pg.mjs`, `debug_sql.mjs` |
| `SUPABASE_DB_CONNECTION` | Privado critico | staging, production | Conexion PostgreSQL directa | Gestor de secretos o variable efimera | `run_pg.mjs` |
| `GEMINI_API_KEY` | Privado critico | entorno del proxy | Proxy Gemini | Variables del servidor Node | `server/gemini-proxy.mjs`, `server/.env.example` |
| `GEMINI_PROXY_TOKEN` | Privado critico | entorno del proxy | Autenticacion del proxy Gemini | Variables del servidor Node | `server/gemini-proxy.mjs` |
| `GEMINI_PROXY_ALLOWED_ORIGINS` | Sensible | entorno del proxy | CORS | Variables del servidor Node | `server/gemini-proxy.mjs` |
| `EASYPANEL_STAGING_WEBHOOK` | Privado critico | staging | Despliegue remoto | Secrets de CI/CD o panel de despliegue | `scripts/deploy.mjs`, `.github/workflows/staging-deploy.yml` |
| `EASYPANEL_PRODUCTION_WEBHOOK` | Privado critico | production | Despliegue remoto | Secrets de CI/CD o panel de despliegue | `scripts/deploy.mjs`, `.github/workflows/production-deploy.yml` |
| `SUPABASE_SERVICE_KEY` | Privado critico | servidor ADMS | Escritura en Supabase desde receptor ADMS | Variables del servicio Windows | `scripts/adms-receiver.mjs` |
| `ADMS_TOKEN` | Privado critico | servidor ADMS | Autorizacion de biometrico | Variables del servicio Windows | `scripts/adms-receiver.mjs`, `docs/adms-windows.md` |
| `ADMS_ALLOWED_IPS` | Sensible | servidor ADMS | Lista de origenes permitidos | Variables del servicio Windows | `scripts/adms-receiver.mjs`, `docs/adms-windows.md` |
| `APP_KEY` | Privado critico | backend legacy | Laravel app encryption | `.env` solo en servidor/backend local | `backend-legacy/.env.example` |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Privado critico | backend legacy | Conexion DB Laravel | `.env` solo en servidor/backend local | `backend-legacy/.env.example` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Privado critico | backend legacy | Login social | `.env` solo en servidor/backend local | `backend-legacy/.env.example` |
| `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` | Privado critico | backend legacy | Login social | `.env` solo en servidor/backend local | `backend-legacy/.env.example` |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Privado critico | backend legacy | Login social | `.env` solo en servidor/backend local | `backend-legacy/.env.example` |
| `TWILIO_SID`, `TWILIO_AUTH_TOKEN` | Privado critico | backend legacy | SMS / integraciones | `.env` solo en servidor/backend local | `backend-legacy/.env.example` |
| `MP_KEY`, `MP_ACCESS_TOKEN` | Privado critico | backend legacy | MercadoPago | `.env` solo en servidor/backend local | `backend-legacy/.env.example` |
| `PUSHER_APP_KEY`, `PUSHER_APP_SECRET` | Privado critico | backend legacy | Tiempo real | `.env` solo en servidor/backend local | `backend-legacy/.env.example` |
| `INTERNAL_API_TOKEN` | Privado critico | backend legacy | Integracion interna | `.env` solo en servidor/backend local | `backend-legacy/.env.example` |
| `INTERNAL_API_ALLOWED_SERVICES` | Sensible | backend legacy | Lista permitida para servicios internos | `.env` solo en servidor/backend local | `backend-legacy/.env.example` |
| `CORS_ALLOWED_ORIGINS` | Sensible | backend legacy | Allowlist de origenes del API legacy | `.env` solo en servidor/backend local | `backend-legacy/.env.example` |
| `TERMINADO_VPS_IP` | Sensible | production | IP del servidor Hostinger | `.secure/vps.terminado.env.local` | `README.md` |
| `TERMINADO_VPS_USER` | Sensible | production | Usuario SSH (root) | `.secure/vps.terminado.env.local` | `README.md` |
| `TERMINADO_VPS_PASSWORD` | Privado critico | production | Password del usuario root | `.secure/vps.terminado.env.local` | - |
| `TERMINADO_VPS_SSH_KEY` | Privado critico | production | Clave publica SSH autorizada | `.secure/vps.terminado.env.local` | - |
| `GITHUB_TOKEN` | Privado critico | todos | Acceso al repo para despliegue | `.secure/deploy.env.local` | `.github/workflows/` |

## Ubicaciones que hoy requieren vigilancia
- Las variantes versionadas (`.env.example`, `.env.staging`, `.env.production`) deben permanecer saneadas y pasar por `npm run secrets:check`.
- `software el castillo/.env`
- `software el castillo/.env.staging`
- `software el castillo/.env.production`
- `software el castillo/apps/dashboard/.env`
- `software el castillo/backend-legacy/.env`
- `software el castillo/MEMORIA.md`

## Clasificacion rapida
- `Publico`: puede terminar en el bundle cliente.
- `Sensible`: no da acceso directo, pero no debe quedar publicado sin control.
- `Privado critico`: da acceso administrativo, escritura o despliegue.
