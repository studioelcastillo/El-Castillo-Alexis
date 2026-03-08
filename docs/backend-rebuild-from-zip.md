# Reconstruccion del backend desde el zip

Este flujo existe para avanzar cuando no hay acceso al servidor antiguo pero si hay una copia descargada del software y un dump PostgreSQL.

## Artefactos disponibles

- Backend Laravel: `problemas/Problema/el-castillo-webapp-develop (1).zip`
- Dump PostgreSQL: `problemas/Problema/castillo_prod_aws.sql (1).txt`

## Limitacion importante

La copia subida no incluye el `.env` real del backend. Por eso esta reconstruccion sirve para levantar una version funcional basada en el dump, pero no garantiza equivalencia exacta con el entorno historico en:

- `APP_KEY`
- credenciales reales de correo, pusher, twilio, mercadopago y otros servicios
- cualquier secreto operativo que no viva dentro de la base de datos

## Preparacion

1. Copiar `.secure/backend-rebuild.env.example` a `.secure/backend-rebuild.env.local`.
2. Ajustar al menos:
   - `APP_KEY`
   - `DB_PASSWORD`
   - `APP_URL`
   - `APP_CLIENT`
   - `APP_SERVER`
   - `INTERNAL_API_TOKEN`
3. Verificar que Docker este disponible.

## Levantar la reconstruccion

```bash
docker compose -f deploy/vps/backend-rebuild.compose.yml up -d castillo-backend-db
deploy/vps/restore-prod-dump.sh "E:/Documentos/Desktop/Aplicacion Castillo Alexis/problemas/Problema/castillo_prod_aws.sql (1).txt"
```

## Resultado esperado

- PostgreSQL restaurado en `127.0.0.1:5434`
- Laravel expuesto en `127.0.0.1:5101`
- Endpoint de prueba: `http://127.0.0.1:5101/api/app/connectivity`

## Estado actual del proyecto

Mientras no aparezca el `.env` real del backend antiguo, el entorno live sigue mas seguro usando el frontend directo en VPS y `/api` por proxy hacia el backend legacy actual.
