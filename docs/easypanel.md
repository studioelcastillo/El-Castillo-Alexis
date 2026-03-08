# Despliegue en Easypanel

> Estado actual: `pruebas.livstre.com` y `terminado.livstre.com` ya no salen desde Easypanel. Hoy viven en contenedores directos dentro del VPS y reutilizan solo el Traefik del host.

## Cuando usar este documento

Usalo solo si necesitas levantar un despliegue alterno o temporal en Easypanel.

- No es el pipeline activo de los dos dominios live.
- El flujo actual recomendado para publicar cambios reales esta en `docs/vps-deploy.md`.
- Los webhooks `deploy:staging` y `deploy:production` quedan como fallback/manual y los workflows de GitHub Actions ya no corren por `push`; ahora son solo `workflow_dispatch`.
- La validacion continua del codigo quedo separada en `/.github/workflows/ci.yml` para no mezclar CI con el fallback legacy.

## Resumen tecnico

El proyecto sigue siendo compatible con un servicio Docker en Easypanel.

- Build: `npm ci && npm run build`
- Runtime: `nginx:alpine`
- Puerto interno: `80`
- Base recomendada en Easypanel: define `/` si el dominio apunta directo al contenedor; usa `/dashboard-app/` solo si de verdad vas a publicar en subruta

## Archivos clave

- `Dockerfile`: build multi-stage para Easypanel.
- `.dockerignore`: evita subir secretos y archivos pesados al contexto Docker.
- `scripts/build-dashboard.mjs`: fuerza heap suficiente para Vite.
- `scripts/copy-dashboard.mjs`: genera `dist/spa/nginx.conf` y la carpeta `dist/spa/dashboard-app/`.

## Variables recomendadas en Easypanel

Definir en el servicio web:

- `VITE_DASHBOARD_BASE=/`
- `DASHBOARD_APP_URL=/`
- `VITE_API_URL=https://pruebas.livstre.com/api` o la URL final del backend
- `API_URL=https://pruebas.livstre.com/api` o la URL final del backend

Si mantienes un servicio historico en subruta, cambia esas dos variables a `/dashboard-app/`.

Si el frontend se conecta directo a Supabase en build:

- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`

## Configuracion sugerida en Easypanel

1. Crear un servicio tipo `App` desde GitHub o desde este repositorio.
2. Seleccionar `Dockerfile` como metodo de build.
3. Usar rama `staging` para pruebas o `main` para produccion.
4. Configurar puerto interno `80`.
5. Asignar el dominio correspondiente:
   - `pruebas.livstre.com` para staging.
   - `terminado.livstre.com` para produccion.
6. Si se publica bajo subruta, crear la regla para servir `/dashboard-app/` desde este servicio; si el dominio apunta directo al contenedor, dejalo en raiz `/`.
7. Guardar variables de entorno y lanzar deploy.

## Verificacion esperada

- Si publicas en raiz: `https://dominio/` debe responder `index.html` y `https://dominio/assets/...js` no debe caer en HTML.
- Si publicas en subruta: `https://dominio/dashboard-app/` debe responder `index.html` y `https://dominio/dashboard-app/assets/...js` debe responder con MIME JavaScript, no HTML.
- Si la app carga en blanco, revisar primero que `VITE_DASHBOARD_BASE` y `DASHBOARD_APP_URL` coincidan exactamente con la ruta publicada real.

## Webhooks opcionales

Si quieres seguir disparando deploys remotos por script o GitHub Actions, cargar en Easypanel/GitHub:

- `EASYPANEL_STAGING_WEBHOOK`
- `EASYPANEL_PRODUCTION_WEBHOOK`

Luego puedes usar:

```bash
npm run deploy:staging
npm run deploy:production
```
