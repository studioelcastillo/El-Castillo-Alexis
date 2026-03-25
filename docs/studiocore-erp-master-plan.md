# StudioCore ERP - Master Plan

## 0. Resumen ejecutivo

- El software actual `software el castillo/` cubre parte importante del dominio de negocio, pero **no cumple todavia** la meta pedida para `StudioCore ERP` como ERP vertical multiempresa y multisede, API-first, modular, documentado y mantenible.
- La brecha principal no es solo de pantallas; es de **arquitectura, modelo de datos, estrategia multiempresa, backend unificado, cobertura funcional y pruebas**.
- La decision recomendada es **no seguir injertando todo sobre el legacy actual**. La forma correcta es levantar una **nueva plataforma greenfield dentro del mismo repositorio**, reutilizando conocimiento funcional del sistema actual, pero no su deuda tecnica.
- El software actual queda como **fuente de referencia funcional y de reglas de negocio**. `StudioCore ERP` se construye como producto nuevo.

## 1. Diagnostico del software actual frente al objetivo

| Dominio | Estado actual | Gap vs objetivo | Decision |
| --- | --- | --- | --- |
| Auth y sesion | Parcial | Hay auth real, pero no MFA robusto, rotacion formal, sesiones enterprise ni backend unificado | Rehacer |
| Dashboard | Parcial | Ya existe dashboard operativo, pero no un dashboard gerencial multiempresa real | Rehacer reutilizando KPIs |
| Multiempresa / multisede | Parcial | Hoy domina `studio/std_id`; no existe modelo canonico `company + branch` transversal | Rehacer |
| Usuarios / roles / permisos | Parcial | Existen roles y permisos, pero no RBAC uniforme por empresa, sede y accion | Rehacer |
| Personas / modelos / administrativos | Parcial | Hay entidades y flujos, pero no estan normalizados en un modelo HR ERP canonico | Migrar y normalizar |
| Catalogos maestros | Parcial | Muchos catalogos existen, pero no con gobierno uniforme | Rehacer |
| Intranet | Parcial | Hay chat y elementos internos, pero no un modulo editorial de publicaciones/audiencias completo | Nuevo |
| Turnos / asistencia | Parcial | Existe base funcional, pero no como dominio limpio con reglas homologadas | Rehacer reutilizando reglas |
| Control de acceso fisico | Parcial | ADMS y eventos existen, pero no como modulo ERP estandarizado | Rehacer reutilizando integracion |
| Nomina modelos | Parcial/Alta | Hay mucha logica legacy, pero no bajo arquitectura limpia ni modelo target | Migrar reglas |
| Nomina administrativos | Parcial | Hay piezas, no solucion integral coherente | Nuevo con soporte de legacy |
| Novedades / incapacidades / vacaciones | Parcial | Cobertura incompleta y dispersa | Rehacer |
| Sanciones / llamados | Baja | No hay modulo completo visible y robusto end-to-end | Nuevo |
| Finanzas operativas | Parcial | Existen transacciones, pagos, cuentas; falta modelo financiero canonico | Rehacer |
| Monedas / TRM | Parcial | Existe soporte basico, falta estrategia snapshot y gobierno de cierres | Rehacer |
| Metas / bonos / tokens / porcentajes | Parcial/Alta | Existe logica de negocio valiosa, pero no empaquetada como dominio limpio | Migrar reglas |
| Plataformas operativas | Parcial | Existe informacion y servicios, pero sin gobierno canonico | Rehacer |
| Reportes | Parcial | Existen varios reportes, falta catalogo consolidado y exportacion consistente | Rehacer |
| Tienda / inventario | Parcial | Existe base funcional, pero no con caja, compras, ventas e inventario canonicos | Rehacer |
| Caja / facturacion interna | Parcial | Hay piezas relacionadas, no una solucion completa | Nuevo |
| Alertas / vencimientos | Parcial | Existen alertas dispersas; falta motor transversal | Nuevo |
| Auditoria / trazabilidad | Parcial | Hay logs, pero no auditoria obligatoria uniforme por dominio | Rehacer |
| API interna / webhooks | Parcial | Hay endpoints e integraciones puntuales; falta contrato versionado y consistente | Rehacer |
| Logs / observabilidad / DevOps | Parcial | Hay despliegue y scripts, pero no stack productivo unificado para el nuevo ERP | Rehacer |

## 2. Vision de producto

### 2.1 Nombre interno

- `StudioCore ERP`

### 2.2 Tipo de producto

- ERP vertical web multiempresa y multisede para operacion, RRHH, nomina, finanzas, acceso fisico, inventario, tienda, intranet y auditoria.

### 2.3 Problema que resuelve

- Centraliza la operacion de organizaciones con varias empresas y sedes.
- Elimina dispersion de hojas de calculo, archivos aislados y calculos manuales.
- Reduce errores de nomina, asistencia, inventario y trazabilidad.
- Permite controlar personas, dinero, accesos, documentos y decisiones en una sola plataforma.

### 2.4 Propuesta de valor

- Un solo sistema para operar la empresa desde acceso, personas y asistencia hasta nomina, finanzas, tienda, inventario, reportes y auditoria.

### 2.5 Usuarios objetivo

- Owner
- Administrador general
- Contabilidad
- RRHH
- Coordinador de sede
- Recepcion / seguridad
- Responsable de tienda
- Supervisor operativo
- Auditor / solo lectura
- Colaborador restringido

### 2.6 North Star Metrics

- Tiempo promedio de cierre de nomina
- Porcentaje de procesos operativos ejecutados dentro del sistema
- Exactitud de liquidaciones y reportes
- Disminucion de errores manuales
- Porcentaje de asistencia registrada en tiempo
- Porcentaje de movimientos auditados
- Tiempo de respuesta del sistema
- Uso diario por empresa y sede

### 2.7 Objetivos MVP

- Auth real
- Multiempresa / multisede real
- Personas
- Novedades base
- Nomina base
- Finanzas operativas base
- Reportes base
- Intranet base
- Tienda base
- Auditoria minima obligatoria

### 2.8 Objetivos post-MVP

- Biometria avanzada
- Reconocimiento facial
- Automatizaciones
- App movil
- Integraciones externas
- Analitica avanzada
- Aprobaciones multinivel

## 3. Decision arquitectonica

### 3.1 Estrategia

- Mantener `software el castillo/` como sistema actual y fuente de descubrimiento funcional.
- Construir `StudioCore ERP` como **nuevo producto dentro del repo**, sin copiar branding, textos ni codigo legacy.
- Reutilizar solo conocimiento de negocio, taxonomia funcional y reglas validadas.

### 3.2 Principios tecnicos

- Monolito modular API-first
- Multiempresa y multisede desde la primera migracion
- Backend como unica autoridad para reglas criticas
- Frontend sin botones muertos ni estados falsos
- Auditoria obligatoria en acciones sensibles
- Soft delete en datos sensibles
- Contratos tipados entre frontend y backend
- Migraciones versionadas
- Observabilidad desde el inicio

### 3.3 Estructura objetivo del repositorio

```text
software el castillo/
  backend-legacy/                 # legado actual
  apps/dashboard/                 # frontend actual
  docs/studiocore-erp-master-plan.md
  studiocore-erp/
    apps/
      api/                        # nuevo backend NestJS
      web/                        # nuevo frontend React
    packages/
      contracts/                  # tipos compartidos
      ui/                         # design system propio
      config/                     # eslint/tsconfig/shared
    infra/
      docker/
      nginx/
      compose/
    docs/
      adr/
      seeds/
      manuals/
```

## 4. Arquitectura del sistema

### 4.1 Frontend

- `React + TypeScript + Vite`
- `Tailwind CSS`
- `TanStack Query`
- `Zustand`
- `React Hook Form + Zod`
- `TanStack Table`
- `Recharts` o `ECharts`
- `Axios` tipado o wrapper `fetch`
- Componentes propios reutilizables

### 4.2 Backend

- `NestJS` como framework principal
- REST API versionada `/api/v1`
- Swagger / OpenAPI
- DTOs + validacion `class-validator` / `zod` server-side
- RBAC fuerte + tenant guards
- Jobs asincronicos con `BullMQ`
- Cache y colas sobre `Redis`

### 4.3 Base de datos

- `PostgreSQL`
- Migraciones versionadas
- Indices por `company_id`, `branch_id`, `status`, fechas y claves de consulta operativa
- Snapshots para cierres (nomina, TRM, caja)

### 4.4 Almacenamiento

- S3 compatible para adjuntos, soportes, plantillas y exportaciones

### 4.5 Infraestructura

- Docker
- Docker Compose local y staging
- Nginx reverse proxy
- Cloudflare
- CI/CD con validacion, test, build, migraciones controladas y despliegue
- Backups automaticos y restauracion probada

## 5. Arquitectura frontend

### 5.1 Shell

- Sidebar lateral
- Topbar superior
- Breadcrumbs
- Selector de empresa
- Selector de sede
- Busqueda global
- Notificaciones
- Avatar / menu de usuario
- Contenedor principal de contenido
- Drawer lateral para detalles cuando aplique

### 5.2 Modulos visibles

- Dashboard
- Intranet
- Personas
- Nomina
- Operacion
- Control de acceso
- Finanzas
- Tienda
- Reportes
- Auditoria
- Configuracion

### 5.3 Estandar de pantalla

- Titulo
- Breadcrumb
- Busqueda
- Filtros
- Tabla paginada
- Columnas configurables
- Empty state
- Error state
- Skeleton state
- Acciones por fila
- Acciones masivas donde aplique
- Exportacion
- Modales de confirmacion
- Toasts
- Drawer detalle

### 5.4 Estandar de formularios

- Validacion cliente con Zod
- Validacion servidor con DTO / schema
- Estados `dirty`, `saving`, `success`, `error`
- Adjuntos reales
- Mensajes de error utiles
- Secciones largas divididas por tabs o accordions

### 5.5 Componentes base

- `AppShell`
- `Sidebar`
- `Topbar`
- `Breadcrumbs`
- `SearchBar`
- `FilterBar`
- `DataTableEnterprise`
- `StatusBadge`
- `MetricCard`
- `ChartCard`
- `EmptyState`
- `SkeletonTable`
- `ConfirmModal`
- `FormModal`
- `DrawerDetail`
- `ExportMenu`
- `Pagination`
- `Tabs`
- `ToastManager`
- `AuditTimeline`

## 6. Arquitectura backend

### 6.1 Modulos de dominio

- `auth`
- `tenancy` (companies, branches, tenant context)
- `iam` (users, roles, permissions)
- `audit`
- `people`
- `models`
- `staff`
- `catalogs`
- `intranet`
- `operations`
- `attendance`
- `access-control`
- `payroll`
- `payroll-novelties`
- `finance`
- `store`
- `reports`
- `imports-exports`
- `notifications`
- `integrations`
- `observability`

### 6.2 Capas por modulo

- `controller`
- `service`
- `repository`
- `dto`
- `domain` / `rules`
- `events` / `jobs`

### 6.3 Cross-cutting obligatorios

- `CurrentUserInterceptor`
- `TenantContextGuard`
- `PermissionGuard`
- `AuditTrailService`
- `DomainErrorMapper`
- `Idempotency` para webhooks e imports
- `RequestContext` con `company_id`, `branch_id`, `user_id`, `request_id`

## 7. Modelo de base de datos

### 7.1 Decision

- Se adopta como **contrato canonico V1** el modelo de datos que definiste en tu especificacion: `companies`, `branches`, `users`, `roles`, `permissions`, `audit_logs`, `people`, `models`, `staff`, `people_documents`, `bank_accounts`, `people_status_history`, catalogos, operacion, nomina, finanzas, intranet, acceso fisico, tienda y tablas de sistema.
- Toda tabla operativa nueva debe incluir `company_id` y `branch_id` cuando aplique.
- Todas las entidades sensibles deben incluir `created_at`, `updated_at` y, cuando aplique, `deleted_at`.
- Toda accion sensible debe generar `audit_logs`.

### 7.2 Convenciones adicionales

- Unicidad compuesta por tenant donde aplique: por ejemplo `company_id + code`, `branch_id + sku`, `company_id + email`.
- `jsonb` solo para `breakdown`, `summary`, `payload`, `meta`, `raw_payload` y configuraciones realmente dinamicas.
- Snapshots congelados para `exchange_rate_snapshot`, cierres de nomina, caja y exportaciones.
- Adjuntos siempre por referencia (`file_url`, `file_name`, `mime_type`, `size`) y nunca binarios en tabla.

### 7.3 Dominios de mayor riesgo a modelar primero

- Auth / IAM
- Companies / branches
- People / models / staff
- Payroll periods / payroll items / novelties
- Financial movements / categories / currencies / exchange rates
- Products / inventory movements / sales / cash sessions
- Audit logs

## 8. API y contratos

### 8.1 Convenciones de API

- Base path: `/api/v1`
- Paginacion: `page`, `pageSize`, `total`, `items`
- Filtros estandar: `search`, `status`, `companyId`, `branchId`, `from`, `to`
- Error envelope consistente: `code`, `message`, `details`, `requestId`
- Swagger obligatorio por modulo
- Autorizacion por permiso + tenant

### 8.2 Contrato funcional

- Se adopta como contrato inicial la matriz de endpoints que definiste para `auth`, `companies`, `branches`, `users`, `roles`, `permissions`, `people`, `models`, `staff`, `catalogs`, `intranet`, `operations`, `attendance`, `payroll`, `hr`, `finance`, `access control`, `store`, `reports`, `audit` y `system`.
- Cada endpoint tendra:
  - DTO request
  - DTO response
  - reglas RBAC
  - validacion tenant-aware
  - auditoria cuando sea sensible
  - pruebas unitarias/integracion al menos para caminos criticos

## 9. Flujos pantalla por pantalla

### 9.1 Pantallas obligatorias V1

- Login
- Recuperacion de contrasena
- Dashboard
- Listado y detalle de modelos
- Listado y detalle de administrativos
- Catalogos
- Intranet / feed
- Crear publicacion
- Turnos
- Asistencia
- Inasistencias
- Eventos de acceso
- Dispositivos
- Periodos de nomina
- Detalle de nomina
- Novedades
- Incapacidades
- Vacaciones
- Sanciones y llamados
- Ingresos / egresos / movimientos
- Monedas / TRM
- Metas / bonos / tokens
- Plataformas operativas
- Productos
- Inventario
- Compras
- Ventas
- POS / nueva venta
- Caja
- Facturas
- Reportes
- Auditoria
- Configuracion avanzada

### 9.2 Regla de UX no negociable

- Si una accion aun no existe en backend, el boton **no se renderiza**.
- Si el usuario no tiene permiso, la accion se oculta y ademas el backend la bloquea.

## 10. Roles y permisos

### 10.1 Roles minimos

- Owner
- Admin general
- Contabilidad
- RRHH
- Coordinador de sede
- Seguridad / recepcion
- Admin tienda
- Auditor / solo lectura
- Colaborador restringido

### 10.2 Matriz de permisos

Cada modulo debe soportar acciones:

- `view`
- `create`
- `edit`
- `delete`
- `export`
- `approve`
- `cancel`
- `close`
- `reopen`
- `audit`
- `manage_config`

### 10.3 Reglas

- Permiso por modulo
- Permiso por accion
- Scope por empresa
- Scope por sede
- Permisos extraordinarios para cierre / reapertura / anulacion
- UI y backend aplican la misma politica

## 11. Reglas de negocio obligatorias

### 11.1 Multiempresa y multisede

- Toda entidad operativa pertenece a una empresa.
- Casi toda entidad operativa pertenece a una sede.
- Los reportes pueden ser por sede o consolidados.
- Un usuario puede operar varias sedes segun sus permisos.

### 11.2 Nomina

- No se calcula si faltan parametros obligatorios.
- No se cierra con novedades criticas pendientes.
- El cierre congela calculos y snapshots.
- La reapertura requiere permiso especial y deja auditoria.
- Cada recalculo genera un `payroll_run`.

### 11.3 Asistencia

- No se permite doble entrada abierta.
- Las entradas manuales quedan auditadas.
- La tardanza depende de turno y tolerancia.
- Las ausencias pueden justificarse.

### 11.4 Disciplina

- Sanciones y llamados tienen historial.
- Algunos tipos pueden afectar nomina.
- Soporte adjunto segun tipo.

### 11.5 Finanzas

- Todo movimiento requiere categoria, fecha, monto y sede.
- La anulacion no elimina; revierte y audita.

### 11.6 Inventario / tienda

- No vender sin stock.
- Toda compra suma stock.
- Toda venta resta stock.
- Toda anulacion revierte kardex.
- El cierre de caja es transaccional.

### 11.7 Intranet

- Publicaciones por audiencia, rol, tipo de usuario o sede.
- Estados: `draft`, `scheduled`, `published`, `archived`.

### 11.8 Acceso fisico

- Eventos duplicados se deduplican.
- Fallos de integracion van a reproceso.
- Eventos fallidos tambien se guardan.

## 12. Criterios de aceptacion por dominio

- `Auth`: login real, recuperacion real, logout real, sesiones seguras.
- `IAM`: usuarios/roles/permisos aplican en UI y backend.
- `Personas`: CRUD real, documentos, historial, estados.
- `Nomina`: periodos, novedades, calculo, cierre, reapertura y exportacion.
- `RRHH`: incapacidades, vacaciones, sanciones y llamados con soportes.
- `Operacion`: turnos, asistencia, ausencias, tiempo en linea, metas.
- `Acceso fisico`: dispositivos, eventos, reproceso, alertas.
- `Finanzas`: registro, aprobacion, anulacion, filtros, reportes.
- `Intranet`: CRUD, estados, audiencias, lecturas.
- `Tienda`: productos, compras, ventas, inventario, caja, facturas.
- `Reportes`: filtros, vista previa y exportacion real.
- `Auditoria`: busqueda, detalle y exportacion de logs.

## 13. Roadmap por fases

### Fase 0 - Fundacion

- Monorepo nuevo
- Auth
- Companies / branches
- IAM
- Audit base
- Design system base
- Seed demo base

### Fase 1 - Core organizacional

- Personas
- Modelos
- Administrativos
- Documentos
- Catalogos base
- Dashboard base

### Fase 2 - Operacion

- Turnos
- Asistencia
- Inasistencias
- Tiempo en linea
- Metas / bonos base
- Plataformas

### Fase 3 - Nomina y RRHH

- Periodos
- Novedades
- Incapacidades
- Vacaciones
- Sanciones
- Llamados
- Calculo base
- Cierre / reapertura

### Fase 4 - Finanzas

- Movimientos
- Categorias
- Monedas / TRM
- Reportes financieros

### Fase 5 - Intranet y notificaciones

- Posts
- Audiencias
- Adjuntos
- Lecturas
- Notificaciones

### Fase 6 - Tienda

- Productos
- Compras
- Inventario
- Ventas
- Caja
- Facturas

### Fase 7 - Acceso fisico e integraciones

- Dispositivos
- Eventos
- Biometrics metadata
- Webhooks
- Reproceso

### Fase 8 - Hardening final

- Observabilidad
- Backups / restore drill
- QA masivo
- Documentacion final
- Release productivo

## 14. Backlog por epicas

- `Epica 1`: Seguridad y acceso
- `Epica 2`: Core organizacional
- `Epica 3`: Personas
- `Epica 4`: RRHH y nomina
- `Epica 5`: Operacion
- `Epica 6`: Intranet
- `Epica 7`: Finanzas
- `Epica 8`: Tienda
- `Epica 9`: Acceso fisico
- `Epica 10`: Reportes y auditoria

Cada epica se parte en historias `CRUD`, `detalle`, `aprobaciones`, `reportes`, `exportaciones`, `auditoria`, `tests` y `observabilidad`.

## 15. Seguridad y privacidad

### 15.1 Requisitos obligatorios

- Password hashing seguro (`argon2id` o `bcrypt` con politica definida)
- MFA opcional al menos para admins
- Refresh tokens o sesiones seguras
- Rate limiting
- Proteccion contra IDOR
- Validacion tenant-aware
- Validacion server-side total
- Sanitizacion de entradas
- Politicas de adjuntos y antivirus si aplica
- Variables de entorno seguras
- Backups automaticos y restauracion probada

### 15.2 Biometrics

- No guardar biometria cruda si no es obligatorio.
- Guardar referencia cifrada o plantilla cifrada.
- Acceso restringido y auditado.

### 15.3 Acciones auditadas obligatoriamente

- Login
- Logout sensible
- Cambio de contrasena
- Cambio de rol
- Alta/baja de usuario
- Alta/edicion de personas
- Novedades
- Cierre/reapertura de nomina
- Sanciones
- Movimientos financieros
- Ajustes de inventario
- Apertura/cierre de caja
- Cambios de TRM
- Sincronizacion de dispositivos

## 16. Estrategia de pruebas

### 16.1 Unit tests

- Calculo de nomina
- Reglas de cierre
- Deducciones
- Bonos
- Snapshot TRM
- Control de stock
- Cierre de caja
- Tardanzas
- Deduplicacion de eventos de acceso

### 16.2 Integration tests

- Login
- Permisos
- Creacion de persona
- Creacion/aprobacion de novedad
- Calculo de nomina
- Venta
- Cierre de caja
- Webhook de acceso

### 16.3 E2E

- Login exitoso/fallido
- Crear modelo
- Cargar novedad
- Calcular nomina
- Cerrar nomina
- Publicar comunicado
- Abrir caja
- Vender producto
- Generar reporte
- Registrar asistencia manual

### 16.4 QA checklist

- Cero botones muertos
- Validaciones correctas
- Permisos correctos
- Exportaciones correctas
- Calculos consistentes
- Filtros funcionales
- Paginacion real
- Auditoria presente

## 17. DevOps y despliegue

- Dockerfile por app
- Compose local
- Entornos: dev, staging, prod
- CI/CD con lint, test, build, migrations check, security scan
- Logs estructurados
- Error handling centralizado
- Health checks
- Monitoreo de CPU, RAM, disco, errores, jobs, colas y backups
- Alertas por fallos criticos
- Manual de rollback

## 18. Seeds y datos demo

### 18.1 Seeds minimos

- 1 owner
- 1 empresa demo
- 2 sedes demo
- roles base
- permisos base
- 10 administrativos demo
- 20 modelos demo
- catalogos base
- 1 caja demo
- productos demo
- periodos demo
- publicaciones demo

### 18.2 Restricciones

- Sin datos reales
- Sin credenciales reales
- Sin adjuntos sensibles

## 19. Manual tecnico

Debe cubrir:

- Instalacion local
- Variables de entorno
- Arranque de frontend, backend, redis y postgres
- Migraciones
- Seeds
- Testing
- Build
- Despliegue
- Rollback
- Backups
- Restore drill
- Estructura de modulos
- Como agregar un modulo nuevo

## 20. Manual funcional

Debe cubrir:

- Que hace cada modulo
- Como crear usuarios y roles
- Como operar sedes
- Como registrar personas
- Como cargar novedades
- Como calcular y cerrar nomina
- Como registrar movimientos financieros
- Como operar tienda y caja
- Como publicar en intranet
- Como consultar auditoria
- Como exportar reportes

## 21. Plan inmediato de construccion

### Sprint 1

- Crear base `studiocore-erp/`
- Definir contratos compartidos
- Levantar backend NestJS con `auth`, `tenancy`, `iam`, `audit`, `health`
- Levantar frontend con `AppShell`, login, dashboard base y navegacion real
- Crear esquema inicial de `companies`, `branches`, `users`, `roles`, `permissions`, `audit_logs`

### Sprint 2

- Personas, modelos, staff, documentos
- Catalogos base
- Filtros y tablas enterprise
- Auditoria y permisos de CRUD

### Sprint 3

- Nomina base, periodos, novedades y reportes base

## 22. Conclusiones

- **No**, el software actual no tiene todavia todo el alcance pedido para `StudioCore ERP`.
- **Si** tiene suficiente conocimiento funcional para acelerar discovery y reglas de negocio.
- La forma profesional de construirlo es una **reingenieria controlada**: mantener legado como referencia y construir plataforma nueva modular, multiempresa y multisede desde la base.
- Este documento queda como contrato de producto y arquitectura para ejecutar la construccion por fases, sin mockups vacios ni componentes decorativos.
