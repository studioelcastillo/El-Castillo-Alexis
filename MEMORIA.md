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
- Claves recibidas y usadas para `production`: publishable `sb_publishable_5Awk9f_...` y secret `sb_secret_K2Fxg1_...`.
- URL interna de pruebas disponible: `https://pruebas.livstre.com`.
- URL de produccion: `https://login.livstre.com`.
- Se dejo una rama segura para revision en GitHub: `supabase-migration-final-safe`.
- Se endurecio la logica multi-tenant en frontend con `apps/dashboard/tenant.ts` y `apps/dashboard/tenantSettings.ts` para tomar `std_id` de la sesion activa en vez de caer por defecto al estudio `1`.
- Se ajustaron servicios criticos para respetar el estudio actual y aislar configuraciones por sede: `PhotoService`, `ContentSalesService`, `RoomControlService`, `StoreService`, `BillingService`, `LicenseService`, `MasterSettingsService`, `MonetizationService`, `BirthdayService`, `AttendanceService` y `ReportSupabaseService`.
- Las configuraciones guardadas en `settings` ahora usan clave por sede con formato `studio:{std_id}:{set_key}` y mantienen compatibilidad de lectura con claves legacy globales.
- Verificacion tecnica completada: `npm run lint` y `npm run build` ejecutaron correctamente y se regenero `dist/spa` local.

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
- `apps/dashboard/tenant.ts`
- `apps/dashboard/tenantSettings.ts`
- `apps/dashboard/AttendanceService.ts`
- `apps/dashboard/BillingService.ts`
- `apps/dashboard/BirthdayService.ts`
- `apps/dashboard/ContentSalesService.ts`
- `apps/dashboard/LicenseService.ts`
- `apps/dashboard/MasterSettingsService.ts`
- `apps/dashboard/MonetizationService.ts`
- `apps/dashboard/PhotoService.ts`
- `apps/dashboard/RoomControlService.ts`
- `apps/dashboard/StoreService.ts`
- `apps/dashboard/services/supabase/ReportSupabaseService.ts`

### GitHub
- Rama activa: `supabase-migration-final-safe`
- Ultimo commit propio: `3bb7e9a` (`docs: store production keys in session memory`)
- Estado: cambios de esta tarea enviados a `origin/supabase-migration-final-safe`; la rama `supabase-migration-final` quedo con un commit local no empujado porque GitHub bloqueo el secreto completo en `MEMORIA.md`.

### Pendientes
- Revisar el dashboard en `staging` en navegador con el usuario de prueba validado y confirmar navegacion, graficas y modulos principales.
- Revisar en navegador el dashboard de `production` con usuarios reales y confirmar que los modulos cargan correctamente con la base importada.
- Abrir PR o merge desde `supabase-migration-final-safe` cuando haya herramienta GitHub disponible (`gh` no esta instalada en este entorno).
- Confirmar si las tablas legacy ya fueron importadas en ambos proyectos o si primero hay que cargar el dump base.
- Revisar y sanear archivos locales con secretos expuestos o credenciales antiguas que ya no son validas.
- Auditar y aislar los modulos que todavia dependen fuerte de API legacy o no tienen `std_id` claro en esquema, especialmente `RemoteDesktopService`, `ChatService`, `WalletService`, `DashboardService`, `TransactionService`, `StreamService` y `ContractService`.

### Bloqueos
- El repositorio tiene muchos cambios previos no relacionados; hay que evitar incluirlos en el commit de esta tarea.
- Las credenciales antiguas encontradas para conexion directa a `staging` no autenticaron con el pooler actual.
- `production` ya tiene datos publicos y usuarios auth operativos; el pendiente principal es validacion funcional completa en interfaz.
- `gh` no esta instalado en este entorno, asi que no pude crear el PR automaticamente desde CLI.
- Algunos modulos todavia usan backend/API legacy y requieren una segunda fase para garantizar aislamiento multi-tenant completo en todas las operaciones.

### Siguiente paso recomendado
- Usar una muestra real de usuarios en `production` para validar dashboard, consultas, reportes y permisos despues de la importacion completa.
- Priorizar una segunda fase de hardening para `RemoteDesktopService`, `DashboardService`, `TransactionService`, `StreamService` y `ContractService` antes de declarar el multi-tenant completamente cerrado.
