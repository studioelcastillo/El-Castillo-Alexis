# StudioCore ERP

Esta carpeta se reserva para la nueva plataforma `StudioCore ERP`.

## Objetivo

- Construir una nueva solucion ERP vertical, multiempresa y multisede.
- Reutilizar conocimiento funcional del sistema actual sin copiar branding ni deuda tecnica.

## Estado

- Fase actual: bootstrap funcional de fase 0 con backend core inicial y frontend base operativo.
- Documento maestro: `docs/studiocore-erp-master-plan.md`
- Bootstrap tecnico actual para `apps/api`, `apps/web`, `packages/contracts`, `packages/ui`, `.env.example` y `docker-compose.yml`.

## Estructura objetivo

```text
studiocore-erp/
  apps/
    api/
    web/
  packages/
    contracts/
    ui/
    config/
  infra/
    docker/
    nginx/
    compose/
  docs/
    adr/
    manuals/
    seeds/
```

## Principios

- Nada visible queda de maqueta.
- Sin botones muertos.
- Validacion frontend y backend.
- Auditoria obligatoria.
- Tenant isolation real por empresa y sede.
- Reglas criticas solo en backend.

## Bootstrap disponible hoy

- `studiocore-erp/apps/api`: backend NestJS con `auth`, `companies`, `branches`, `users`, `roles`, `permissions`, `audit-logs`, `health`, migracion inicial y seed demo.
- `studiocore-erp/apps/web`: frontend React/Vite con login real, `AppShell`, dashboard base y gestion operativa para `companies`, `branches`, `users` y `roles`, ademas de vistas de `permissions` y `audit`.
- `studiocore-erp/apps/api` ya cubre la epica inicial de `people`: CRUD, contratos, documentos, upload real a S3/MinIO y acceso firmado a adjuntos nuevos.
- `studiocore-erp/apps/api` expone `catalogs` base versionados y overrides persistidos por empresa para people, contratos y documentos; `apps/web` ya los consume en `PeoplePage` y los administra desde la pantalla `Catalogos`.
- `studiocore-erp/apps/api` ya expone tambien `models` y `staff` como modulos especializados sobre el nucleo `people`, y `apps/web` suma vistas separadas para listado/detalle operativo de cada dominio.
- `studiocore-erp/apps/api` ya abre tambien Fase 2 con `operations/shifts` y `attendance`, incluyendo turnos, registro manual de asistencia, auditoria y scope tenant por sede; `apps/web` ya suma las vistas `Turnos` y `Asistencia`.
- `studiocore-erp/apps/api` ya suma `absences` y `goals` para ausencias reportadas/aprobadas y metas/bonos base por periodo o turno; `apps/web` agrega las vistas `Inasistencias` y `Metas` sobre la misma shell administrativa.
- `studiocore-erp/apps/api` ya suma `online_time` para sesiones online por persona/plataforma/turno con duracion, tokens y monto bruto; `apps/web` agrega la vista `Tiempo en linea` dentro del bloque operativo.
- `studiocore-erp/apps/api` ya abre la base de `payroll` con periodos, calculo de snapshot, cierre y reapertura usando contratos + asistencia + ausencias + metas + tiempo en linea; `apps/web` suma la vista `Periodos` para operar ese flujo inicial.
- `studiocore-erp/apps/api` ya suma `payroll_novelties` para bonos, deducciones y eventos criticos por periodo/persona; el calculo de payroll ya las incorpora y el cierre se bloquea si quedan novedades criticas pendientes. `apps/web` agrega la vista `Novedades` y el snapshot de nomina ya muestra su impacto.
- `studiocore-erp/apps/api` ya abre `hr` base con `incapacities` y `vacations`; cuando un caso queda aprobado intenta sincronizar una novedad a payroll del periodo correspondiente. `apps/web` agrega las vistas `Incapacidades` y `Vacaciones`.
- `studiocore-erp/apps/api` ya genera `payroll items` detallados por persona dentro del snapshot, con componentes monetarios y alertas operativas; `apps/web` ya los muestra en el desglose inferior de `Nomina > Periodos`.
- `studiocore-erp/apps/api` ya suma `hr disciplinary actions` y exportacion CSV de payroll; sanciones aprobadas con impacto crean deducciones en nomina y `Nomina > Periodos` ya puede exportar el snapshot, mientras `RRHH > Disciplina` opera llamados/sanciones con soporte.
- `studiocore-erp/packages/contracts`: contratos TypeScript compartidos para auth, tenant y recursos core.
- `studiocore-erp/packages/ui`: primitives UI reutilizables para shell, formularios, badges, mensajes y cards del nuevo frontend.
- `studiocore-erp/docker-compose.yml`: PostgreSQL + Redis + MinIO local.
- `studiocore-erp/.env.example`: variables base del nuevo sistema.

## Esquema dedicado recomendado

- Si el greenfield va a convivir con tablas legacy dentro de la misma base PostgreSQL/Supabase, define `DATABASE_SCHEMA` para aislar las tablas nuevas del ERP.
- Ejemplo recomendado para staging/produccion compartidos: `DATABASE_SCHEMA=studiocore_erp`.
- Los scripts `db:migrate`, `db:seed`, el runtime Nest y las migraciones ya respetan ese esquema dedicado cuando la variable existe.

## Importacion legacy inicial

- `apps/api` incluye `npm run db:import:legacy:people --workspace @studiocore/api` para migrar personas, contratos y metadata documental desde la base legacy hacia el greenfield.
- Los documentos legacy importados quedan por ahora como referencias externas (`publicUrl` + `storagePath`), no como binarios copiados al bucket nuevo.
- Los uploads nuevos desde la UI/API si quedan almacenados en el object storage del greenfield y se abren con URL firmada.
- `apps/api` tambien incluye `npm run db:migrate:legacy:documents --workspace @studiocore/api` para copiar esas referencias externas al storage gestionado del greenfield cuando ya exista conectividad al origen.
- La ficha de `people` ya distingue entre `Storage gestionado` y `Referencia externa`, y permite migrar un documento puntual desde la UI/API sin tocar el sistema legacy.

## Siguiente paso de implementacion

- endurecer `tenancy` y guards por empresa/sede en todo el backend nuevo
- cubrir `audit` e `iam` con pruebas automatizadas de integracion
- seguir abriendo la epica de `people` y `catalogos`, ahora con base para overrides tenant-aware persistidos y futura gobernanza auditada
- profundizar `operations` y `attendance` con ausencias, tiempo en linea, metas/bonos base y linkage con payroll/RRHH
- abrir el siguiente paso de Fase 2 con `tiempo en linea` y luego enlazar `goals` / `attendance` / `absences` con payroll y RRHH
- enlazar `turnos`, `asistencia`, `inasistencias`, `metas` y `tiempo en linea` con payroll / RRHH antes de abrir calculos y cierres
- profundizar `payroll` con novedades, items detallados, cierre congelado por snapshot y luego abrir RRHH sobre esta base operativa
- abrir `hr` base (incapacidades/vacaciones) y luego `payroll novelties` mas ricas / items detallados sobre el mismo periodo congelado
- profundizar `hr` con incapacidades/vacaciones mas ricas, luego abrir items detallados de nomina y exportaciones/cierres congelados
- abrir `rrhh disciplinario` o exportaciones/cierre congelado de nomina sobre el snapshot ya detallado
- profundizar exportaciones/cierre congelado de nomina o abrir `finance` / `reports` aprovechando que el flujo RRHH→nomina ya existe end-to-end
