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
- Se actualizo `README.md` con la nueva pieza del flujo de migracion.

### Archivos tocados recientemente
- `MEMORIA.md`
- `AGENTS.md`
- `supabase/legacy_schema_missing.sql`
- `supabase/legacy_aws_alignment.sql`
- `run_pg.mjs`
- `README.md`

### Pendientes
- Ejecutar la migracion completa primero en `staging` y validar lectura/escritura del dashboard con datos reales.
- Conseguir credencial administrativa valida para aplicar SQL en `production` (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_SERVICE_KEY` de gestion o credenciales DB directas). En `.env.production` solo esta la URL y la anon key.
- Confirmar si las tablas legacy ya fueron importadas en ambos proyectos o si primero hay que cargar el dump base.
- Hacer commit y push solo de los archivos creados/modificados para esta tarea, sin mezclar cambios ajenos del arbol actual.

### Bloqueos
- No hay credencial administrativa utilizable para ejecutar SQL en `production` desde el entorno actual.
- El repositorio tiene muchos cambios previos no relacionados; hay que evitar incluirlos en el commit de esta tarea.

### Siguiente paso recomendado
- Si se confirma la credencial de despliegue o acceso a DB, ejecutar primero en `staging` y luego replicar en `production` la secuencia `schema.sql` -> `legacy_schema_missing.sql` -> `legacy_aws_alignment.sql` -> scripts complementarios.
