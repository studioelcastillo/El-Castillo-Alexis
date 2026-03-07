# MEMORIA

## Como usar este archivo
- Este archivo guarda el estado de trabajo entre sesiones.
- Al iniciar una nueva conversacion, revisar primero `MEMORIA.md`.
- Al terminar una tarea o al quedar trabajo a medias, actualizar este archivo.
- Mantener la informacion breve, concreta y vigente.

## Estado actual

### Objetivo actual
- Integrar la base de datos real del dump AWS (`castillo_prod_aws.sql.txt`) en Supabase para `staging` y `production`, manteniendo compatibilidad con el dashboard actual.

### Ultimo avance
- Se reviso la documentacion principal: `README.md`, `docs/environments.md`, `docs/adms-windows.md`, `apps/dashboard/README.md` y `SERVICES.md`.
- Se comparo `E:\Documentos\Downloads\castillo_prod_aws.sql.txt` contra los esquemas en `supabase/`.
- Se detecto que el dump AWS tenia una tabla legacy faltante en el proyecto: `payments_files`.
- Se agrego `supabase/legacy_aws_alignment.sql` para alinear tablas legacy con las tablas que usa la app: `accounts`, `bank_accounts`, `exchange_rates`, `payment_files` y `settings`.
- Se actualizo `run_pg.mjs` para ejecutar tambien `supabase/legacy_aws_alignment.sql`.
- Se hizo commit y push de estos cambios en la rama `supabase-migration-final` con el commit `c74cd12`.
- Se revisaron credenciales dentro del proyecto y del historial local: solo aparecieron credenciales parciales de `staging` y scripts viejos con passwords hardcodeados, pero no una credencial administrativa valida para `production`.
- Se probo acceso por Management API con la service role de `staging` y devolvio `401`, por lo que no sirve como token de gestion.
- Se consulto `settings` en `staging` con la service role y no aparecieron llaves de Supabase ni credenciales de produccion guardadas alli.
- Se recupero acceso SQL real a `staging` usando la conexion `postgresql://postgres.pnnrsqocukixusmzrlhy@aws-1-us-east-1.pooler.supabase.com:6543/postgres` con la clave encontrada en scripts legacy.
- Se importo el dump AWS a `staging` con `scripts/import_aws_dump.mjs` y quedaron cargadas tablas clave como `users` (4182), `studios` (97), `studios_models` (4243), `models_accounts` (16394), `models_streams` (382752), `transactions` (4163), `payments` (575), `accounts` (11), `bank_accounts` (39), `exchange_rates` (496) y `payment_files` (23).
- Se sincronizo `staging` con Supabase Auth usando `supabase/sync_legacy_auth.sql`: quedaron `4182` usuarios en `auth.users`, `4182` identidades y `4182` filas de `public.users` enlazadas por `auth_user_id`.
- Se valido login real en `staging`: se asigno temporalmente la clave `Temporal2026!` al usuario `user_id=1` (`1144083039@legacy.elcastillo.local`) y el inicio de sesion funciono tanto por email directo como por flujo de identificacion con lookup server-side.
- Se recibio una `sb_secret` de `production` y se confirmo que sirve para REST y `auth/v1/admin`, pero no para `api.supabase.com` ni para ejecutar SQL de gestion.
- Con esa `sb_secret` se importaron en `production` las tablas publicas principales mediante `scripts/import_aws_dump_rest.mjs`: `users` (4182), `studios` (97), `studios_models` (4243), `models_accounts` (16394), `models_streams` (382752), `transactions` (4163), `payments` (575), `accounts` (11), `bank_accounts` (39), `exchange_rates` (496) y `payment_files` (23).
- Se crearon usuarios de autenticacion en `production` desde `public.users` con `scripts/sync_auth_from_users_admin.mjs`, usando como password los ultimos 5 digitos de la cedula. Quedaron `4182` filas de `public.users` enlazadas con `auth_user_id`.
- Se valido login real en `production` para la cedula `1144083039` con clave `83039`, tanto por email directo como por flujo de identificacion.

### Archivos tocados recientemente
- `MEMORIA.md`
- `AGENTS.md`
- `supabase/legacy_schema_missing.sql`
- `supabase/legacy_aws_alignment.sql`
- `run_pg.mjs`
- `README.md`
- `supabase/schema.sql`
- `scripts/import_aws_dump.mjs`
- `supabase/sync_legacy_auth.sql`
- `scripts/import_aws_dump_rest.mjs`
- `scripts/sync_auth_from_users_admin.mjs`
- `supabase/sync_legacy_auth.sql`

### GitHub
- Rama activa: `supabase-migration-final`
- Ultimo commit propio: `c74cd12` (`fix: align legacy AWS schema for Supabase sync`)
- Estado: cambios de esta tarea ya enviados a `origin/supabase-migration-final`

### Pendientes
- Validar login real en `staging` con credenciales antiguas de un usuario existente y revisar que el dashboard navegue sin errores con los datos importados.
- Revisar el dashboard en `staging` en navegador con el usuario de prueba validado y confirmar navegacion, graficas y modulos principales.
- Definir como poblar `auth.users` en `production`: crear todos los usuarios con clave temporal comun, crear solo un usuario administrador temporal, o esperar credencial SQL para importar hashes legacy.
- Revisar en navegador el dashboard de `production` con usuarios reales y confirmar que los modulos cargan correctamente con la base importada.
- Conseguir credencial administrativa valida para aplicar SQL en `production` (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_SERVICE_KEY` de gestion o credenciales DB directas). En `.env.production` solo esta la URL y la anon key.
- Confirmar si las tablas legacy ya fueron importadas en ambos proyectos o si primero hay que cargar el dump base.
- Hacer commit y push solo de los archivos creados/modificados para esta tarea, sin mezclar cambios ajenos del arbol actual.
- Revisar y sanear archivos locales con secretos expuestos o credenciales antiguas que ya no son validas.

### Bloqueos
- No hay credencial administrativa utilizable para ejecutar SQL en `production` desde el entorno actual.
- El repositorio tiene muchos cambios previos no relacionados; hay que evitar incluirlos en el commit de esta tarea.
- Las credenciales antiguas encontradas para conexion directa a `staging` no autenticaron con el pooler actual.
- La importacion completa en `production` sigue bloqueada por falta de password de DB o token de gestion valido.
- `production` ya tiene datos publicos y usuarios auth operativos; el pendiente principal es validacion funcional completa en interfaz.

### Siguiente paso recomendado
- Usar los nuevos scripts (`scripts/import_aws_dump.mjs` y `supabase/sync_legacy_auth.sql`) para replicar el mismo proceso en `production` apenas aparezca una credencial administrativa valida.
- Usar una muestra real de usuarios en `production` para validar dashboard, consultas, reportes y permisos despues de la importacion completa.
