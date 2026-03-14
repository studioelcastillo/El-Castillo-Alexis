# Ubicacion de claves y secretos

Este archivo es la referencia unica para saber donde deben vivir las APIs, keys, tokens, passwords y demas informacion privada del proyecto.

## Regla canonica
- Valores reales: `/.secure/` o variables del proveedor/servidor.
- Documentacion versionada: `security/`.
- Codigo fuente: nunca debe contener secretos reales.

## Regla obligatoria para informacion nueva
- Toda clave nueva, API key nueva, token nuevo, webhook nuevo, password tecnico nuevo o credencial privada nueva debe guardarse primero en `/.secure/` o en el proveedor correspondiente.
- Nunca se debe crear una clave nueva directamente en `README.md`, `MEMORIA.md`, `docs/`, `security/`, scripts, componentes, SQL, workflows o codigo fuente.
- Si aparece una nueva integracion o API, su valor real va en `/.secure/` o en el secret manager del proveedor; solo su documentacion va en `security/`.
- Cada alta nueva debe actualizar tambien `security/secrets-inventory.md` para mantener una sola fuente de verdad.
- Si la nueva credencial necesita un archivo operativo `.env`, ese archivo se considera derivado; la fuente principal sigue siendo `/.secure/`.

## Fuente local principal

La carpeta local privada oficial es:

`software el castillo/.secure`

Archivos actuales esperados:
- `.secure/root.env.local`
- `.secure/root.staging.env.local`
- `.secure/root.production.env.local`
- `.secure/dashboard.env.local`
- `.secure/server.env.local`
- `.secure/backend-legacy.env.local`
- `.secure/deploy.env.local`

## Que va en cada archivo

### `.secure/root.env.local`
- Variables privadas del root y scripts locales.
- Ejemplos: `SUPABASE_PROJECT_ID`, `SUPABASE_DB_PASSWORD`, `SUPABASE_DB_CONNECTION`, `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

### `.secure/root.staging.env.local`
- Version local privada de credenciales orientadas a `staging`.
- Debe usarse cuando se trabaje con scripts o pruebas contra staging.

### `.secure/root.production.env.local`
- Version local privada de credenciales orientadas a `production`.
- Solo para tareas operativas controladas; no usar por defecto en desarrollo.

### `.secure/dashboard.env.local`
- Variables del frontend dashboard.
- Ejemplos: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`, `VITE_SESSION_KEY`, `VITE_SESSION_STORAGE`, `VITE_DASHBOARD_BASE`.

### `.secure/server.env.local`
- Variables del proxy y servicios Node complementarios.
- Ejemplos: `GEMINI_API_KEY`, `GEMINI_PROXY_TOKEN`, `GEMINI_PROXY_ALLOWED_ORIGINS`, `GEMINI_PROXY_ALLOWED_MODELS`, `GEMINI_PROXY_PORT`, `GEMINI_PROXY_HOST`.

### `.secure/backend-legacy.env.local`
- Variables privadas de Laravel legacy.
- Ejemplos: `APP_KEY`, `DB_*`, `GOOGLE_*`, `FACEBOOK_*`, `GITHUB_*`, `TWILIO_*`, `MP_*`, `PUSHER_*`, `INTERNAL_API_TOKEN`.
- Tambien debe concentrar `INTERNAL_API_ALLOWED_SERVICES`, `CORS_ALLOWED_ORIGINS` y `LEGACY_PLATFORM_PASSWORD_PLACEHOLDER`.

### `.secure/deploy.env.local`
- Variables de despliegue y servicios operativos.
- Ejemplos: `EASYPANEL_STAGING_WEBHOOK`, `EASYPANEL_PRODUCTION_WEBHOOK`, `ADMS_TOKEN`, `ADMS_ALLOWED_IPS`, `SUPABASE_SERVICE_KEY`.

## Plantillas asociadas
- `.secure/root.env.example`
- `.secure/dashboard.env.example`
- `.secure/server.env.example`
- `.secure/backend-legacy.env.example`
- `.secure/deploy.env.example`

## Ubicaciones operativas derivadas

Estos archivos pueden seguir existiendo por compatibilidad, pero la fuente de verdad local recomendada es `.secure/`.
Si estan versionados (`.env.example`, `.env.staging`, `.env.production`), deben mantenerse saneados y sin valores privados reales:
- `.env`
- `.env.staging`
- `.env.production`
- `apps/dashboard/.env`
- `server/.env`
- `backend-legacy/.env`

Si hace falta regenerarlos desde `.secure/`, usar:

```bash
npm run secure:materialize
```

Por defecto, ese comando no reescribe `.env.staging` ni `.env.production` para no volver a volcar secretos reales en archivos versionados. Solo usar `--include-versioned` en una maquina aislada si hace falta reconstruirlos temporalmente.

Si hace falta volver a copiar los `.env` actuales hacia `.secure/`, usar:

```bash
npm run secure:migrate
```

## Ubicaciones fuera del repo
- Easypanel / CI: webhooks y variables de despliegue.
- Hostinger / servidor PHP: `.env` real de Laravel en servidor.
- Servicios Windows / NSSM: ADMS y servicios locales.
- Proveedor del frontend: variables `VITE_*` del entorno desplegado.

## Resumen corto
- Claves reales locales: `software el castillo/.secure`
- Politica e inventario: `software el castillo/security`
- `.env` operativos: derivados, no fuente principal

## Regla de mantenimiento
- Siempre que se agregue una nueva clave, API, token, webhook o dato privado, debe seguirse esta misma ubicacion canonica sin excepciones: valor real en `software el castillo/.secure` o en el proveedor, y referencia documental en `software el castillo/security`.
