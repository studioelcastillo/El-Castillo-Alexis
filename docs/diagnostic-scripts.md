# Scripts de diagnostico

## Objetivo

Este repo acumula utilidades operativas para revisar login, RLS, sincronizacion con Supabase, estado de usuarios, migraciones y despliegues. Este archivo sirve como indice rapido para que el conjunto siga siendo util aunque existan muchos scripts historicos.

## Convencion actual

- `scripts/`: utilidades mantenidas y reutilizables del repo.
- `tmp/` y `tmp_*.mjs`: pruebas puntuales o helpers de investigacion rapida.
- raiz del repo (`check_*`, `test_*`, `debug_*`, `verify_*`, `apply_*`, `sync_*`, `find_*`, `fix_*`): diagnosticos historicos que se conservaron por trazabilidad operativa.

## Entradas canonicas

- `scripts/check-secrets.mjs`: escaneo de secretos versionados; debe pasar antes de push/deploy.
- `scripts/load-supabase-env.mjs`: carga estandar de configuracion Supabase desde entorno seguro.
- `scripts/deploy.mjs`: despliegues del frontend legacy.
- `scripts/materialize-secure-env.mjs`: materializa envs locales desde `.secure/`.
- `scripts/sync_auth_from_users_admin.mjs`: sincronizacion admin sobre Supabase via variables de entorno.

## Grupos utiles

- **RLS / auth / sesiones**: `check_rls*.mjs`, `verify_prod_rls.mjs`, `fix_rls_login.mjs`, `test_auth*.mjs`, `test_user_access_prod*.mjs`, `verify_user_debug.mjs`.
- **Usuarios / perfiles / candidatos**: `check_users.mjs`, `check_user_*.mjs`, `check_profiles_*.mjs`, `get_test_user.mjs`, `test_*candidate*.mjs`, `advanced_search.mjs`.
- **Supabase admin / management API**: `audit_rls_status.mjs`, `apply_rls*.mjs`, `test_mgmt*.mjs`, `tmp_*`, `scripts/apply_*hardening*.mjs`, `scripts/simple_count.mjs`.
- **Migracion / datos legacy**: `import_missing_aws_tables.mjs`, `populate_terceros.mjs`, `sync_prod_*.mjs`, `scan_dump.mjs`, `find_anomalies.mjs`, `check_terceros.mjs`.
- **Infra / VPS**: `deploy/vps/remote-copy.mjs`, `test_vps_pg.mjs`, `test_ports_staging.mjs`.

## Regla de mantenimiento

- Ningun script versionado debe contener secretos literales, passwords reales ni tokens pegados.
- Si un script necesita credenciales, debe leerlas desde `process.env` o desde `scripts/load-supabase-env.mjs`.
- Para nuevos scripts temporales, preferir `tmp/` o prefijo `tmp_` y documentar el proposito en `MEMORIA.md` cuando afecten decisiones del repo.
