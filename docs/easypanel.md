# Despliegue en Easypanel

## Resumen

El proyecto ya queda listo para desplegarse como contenedor Docker en Easypanel.

- Build: `npm ci && npm run build`
- Runtime: `nginx:alpine`
- Puerto interno: `80`
- Subruta publicada recomendada: `/dashboard-app/`

## Archivos clave

- `Dockerfile`: build multi-stage para Easypanel.
- `.dockerignore`: evita subir secretos y archivos pesados al contexto Docker.
- `scripts/build-dashboard.mjs`: fuerza heap suficiente para Vite.
- `scripts/copy-dashboard.mjs`: genera `dist/spa/nginx.conf` y la carpeta `dist/spa/dashboard-app/`.

## Variables recomendadas en Easypanel

Definir en el servicio web:

- `VITE_DASHBOARD_BASE=/dashboard-app/`
- `DASHBOARD_APP_URL=/dashboard-app/`
- `VITE_API_URL=https://pruebas.livstre.com/api` o la URL final del backend
- `API_URL=https://pruebas.livstre.com/api` o la URL final del backend

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
6. Si se publica bajo subruta, crear la regla para servir `/dashboard-app/` desde este servicio.
7. Guardar variables de entorno y lanzar deploy.

## Verificacion esperada

- `https://dominio/dashboard-app/` debe responder `index.html`.
- `https://dominio/dashboard-app/assets/...js` debe responder con MIME JavaScript, no HTML.
- Si `/dashboard-app/` carga pero queda en blanco, revisar que `VITE_DASHBOARD_BASE` y `DASHBOARD_APP_URL` sigan en `/dashboard-app/`.

## Webhooks opcionales

Si quieres seguir disparando deploys remotos por script o GitHub Actions, cargar en Easypanel/GitHub:

- `EASYPANEL_STAGING_WEBHOOK`
- `EASYPANEL_PRODUCTION_WEBHOOK`

Luego puedes usar:

```bash
npm run deploy:staging
npm run deploy:production
```
