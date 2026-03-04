# 📋 El Castillo — Documentación de Servicios

> **Documento vivo**: actualizar cada vez que se agregue o modifique un servicio.
> **Última actualización**: 2026-03-02

---

## Arquitectura General

```
src/services/
├── [Servicio]Service.js          ← Wrapper (re-exporta el servicio Supabase)
├── supabase/
│   ├── [Servicio]SupabaseService.js  ← Implementación real (usa supabase client)
│   └── queryUtils.js                 ← Utilidades compartidas de filtrado/paginación
├── SSOService.js                     ← Servicio externo (usa axios → API SSO)
├── MercadoPagoService.js             ← Servicio externo (usa axios → API MercadoPago)
└── StorageService.js                ← Servicio de almacenamiento (usa supabase storage)
```

**Backend**: Supabase (PostgreSQL + Auth + Storage)
**Proyecto Supabase**: `wukvaemawvjavwqocxyb` (El_Castillo_BaseDatos)

---

## 🔐 AuthSupabaseService

**Archivo**: `src/services/supabase/AuthSupabaseService.js`
**Tabla(s)**: `users`, `profiles`, `login_history` + Supabase Auth
**Descripción**: Maneja autenticación de usuarios. Soporta login por email o cédula, registra historial de acceso.

| Método                         | Descripción                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `login({ email, password })`   | Autenticar usuario (email o cédula). Registra en `login_history` |
| `logout()`                     | Cerrar sesión en Supabase Auth                                   |
| `recoveryPassword({ email })`  | Enviar email de recuperación                                     |
| `newPassword({ password })`    | Actualizar contraseña                                            |
| `getSession()`                 | Obtener sesión activa                                            |
| `getUser()`                    | Obtener usuario autenticado                                      |
| `checkSession()`               | Verificar si hay sesión activa                                   |
| `getActiveDataPolicy()`        | Mock de política de datos                                        |
| `getUserProfile(authUserId)`   | Perfil extendido desde tabla `users`                             |
| `changePassword({ password })` | Cambiar contraseña                                               |

---

## 👤 UserSupabaseService

**Archivo**: `src/services/supabase/UserSupabaseService.js`
**Tabla(s)**: `users`, `profiles`, `studios_models`, `studios`, `models_accounts`, storage `el-castillo`
**Descripción**: CRUD completo de usuarios. Maneja listados, búsqueda, creación, edición, subida de imágenes y sincronización con Supabase Auth.

| Método                    | Descripción                               |
| ------------------------- | ----------------------------------------- |
| `getUsers(params)`        | Listar usuarios con filtros y relaciones  |
| `getUser(params)`         | Obtener usuario individual con perfil     |
| `addUser(params)`         | Crear usuario + registro en Supabase Auth |
| `editUser(params)`        | Editar datos del usuario                  |
| `uploadUserImage(params)` | Subir imagen de perfil a Storage          |

---

## 👤 User2SupabaseService

**Archivo**: `src/services/supabase/User2SupabaseService.js`
**Tabla(s)**: `users`, `profiles`
**Descripción**: Servicio alternativo de usuarios con filtros avanzados y paginación.

| Método             | Descripción                           |
| ------------------ | ------------------------------------- |
| `getUsers(params)` | Listar usuarios con filtros avanzados |
| `getUser(params)`  | Obtener usuario individual            |
| `addUser(params)`  | Crear usuario                         |
| `editUser(params)` | Editar usuario                        |
| `delUser(params)`  | Eliminar usuario                      |

---

## 🔑 UserPermission2SupabaseService

**Archivo**: `src/services/supabase/UserPermission2SupabaseService.js`
**Tabla(s)**: `users_permissions2`
**Descripción**: Gestión de permisos de usuario (roles y accesos).

| Método                   | Descripción                |
| ------------------------ | -------------------------- |
| `getPermissions(params)` | Listar permisos            |
| `getPermission(params)`  | Obtener permiso individual |
| `addPermission(params)`  | Crear permiso              |
| `editPermission(params)` | Editar permiso             |
| `delPermission(params)`  | Eliminar permiso           |

---

## 🏢 StudioSupabaseService

**Archivo**: `src/services/supabase/StudioSupabaseService.js`
**Tabla(s)**: `studios`
**Descripción**: CRUD de estudios (sedes de trabajo).

| Método               | Descripción                |
| -------------------- | -------------------------- |
| `getStudios(params)` | Listar estudios            |
| `getStudio(params)`  | Obtener estudio individual |
| `addStudio(params)`  | Crear estudio              |
| `editStudio(params)` | Editar estudio             |
| `delStudio(params)`  | Eliminar estudio           |

---

## 👥 StudioModelSupabaseService

**Archivo**: `src/services/supabase/StudioModelSupabaseService.js`
**Tabla(s)**: `studios_models`, `users`, `studios`
**Descripción**: Gestión de contratos de modelos asignadas a estudios. Incluye datos laborales y salariales.

| Método                     | Descripción                     |
| -------------------------- | ------------------------------- |
| `getStudiosModels(params)` | Listar contratos con relaciones |
| `getStudioModel(params)`   | Obtener contrato individual     |
| `addStudioModel(params)`   | Crear contrato                  |
| `editStudioModel(params)`  | Editar contrato                 |
| `delStudioModel(params)`   | Eliminar contrato               |

---

## 🏠 StudioRoomSupabaseService

**Archivo**: `src/services/supabase/StudioRoomSupabaseService.js`
**Tabla(s)**: `studios_rooms`
**Descripción**: Gestión de salas/habitaciones dentro de cada estudio.

| Método                    | Descripción   |
| ------------------------- | ------------- |
| `getStudiosRooms(params)` | Listar salas  |
| `getStudioRoom(params)`   | Obtener sala  |
| `addStudioRoom(params)`   | Crear sala    |
| `editStudioRoom(params)`  | Editar sala   |
| `delStudioRoom(params)`   | Eliminar sala |

---

## ⏰ StudioShiftSupabaseService

**Archivo**: `src/services/supabase/StudioShiftSupabaseService.js`
**Tabla(s)**: `studios_shifts`
**Descripción**: Gestión de turnos de trabajo en los estudios.

| Método                     | Descripción    |
| -------------------------- | -------------- |
| `getStudiosShifts(params)` | Listar turnos  |
| `getStudioShift(params)`   | Obtener turno  |
| `addStudioShift(params)`   | Crear turno    |
| `editStudioShift(params)`  | Editar turno   |
| `delStudioShift(params)`   | Eliminar turno |

---

## 💳 StudioAccountSupabaseService

**Archivo**: `src/services/supabase/StudioAccountSupabaseService.js`
**Tabla(s)**: `studios_accounts`
**Descripción**: Cuentas financieras asociadas a cada estudio.

| Método                       | Descripción     |
| ---------------------------- | --------------- |
| `getStudiosAccounts(params)` | Listar cuentas  |
| `getStudioAccount(params)`   | Obtener cuenta  |
| `addStudioAccount(params)`   | Crear cuenta    |
| `editStudioAccount(params)`  | Editar cuenta   |
| `delStudioAccount(params)`   | Eliminar cuenta |

---

## 📊 ModelAccountSupabaseService

**Archivo**: `src/services/supabase/ModelAccountSupabaseService.js`
**Tabla(s)**: `models_accounts`, `studios_models`
**Descripción**: Cuentas de plataformas (Chaturbate, etc.) asignadas a modelos.

| Método                                  | Descripción                 |
| --------------------------------------- | --------------------------- |
| `getModelsAccounts(params)`             | Listar cuentas con contrato |
| `getModelsAccountsByModel(params)`      | Cuentas por modelo          |
| `getModelAccount(params)`               | Cuenta individual           |
| `addModelAccount(params)`               | Crear cuenta                |
| `editModelAccount(params)`              | Editar cuenta               |
| `delModelAccount(params)`               | Eliminar cuenta             |
| `activateModelAccount(params)`          | Activar cuenta              |
| `inactivateModelAccount(params)`        | Desactivar cuenta           |
| `inactivateMassiveModelAccount(params)` | Desactivar en lote          |
| `changeAccountsContract(params)`        | Cambiar contrato asociado   |
| `getPlatforms(params)`                  | Listar plataformas únicas   |

---

## 📹 ModelStreamSupabaseService

**Archivo**: `src/services/supabase/ModelStreamSupabaseService.js`
**Tabla(s)**: `models_streams`, `models_accounts` | **⚠️ Usa axios** para `populateStreams` e `importModelStream`
**Descripción**: Registro de transmisiones/jornadas de las modelos.

| Método                            | Descripción                                     |
| --------------------------------- | ----------------------------------------------- |
| `getModelsStreams(params)`        | Listar transmisiones                            |
| `getModelsStreamsByModel(params)` | Transmisiones por modelo                        |
| `getModelStream(params)`          | Transmisión individual                          |
| `addModelStream(params)`          | Registrar transmisión                           |
| `editModelStream(params)`         | Editar transmisión                              |
| `delModelStream(params)`          | Eliminar transmisión                            |
| `populateStreams(params)`         | ⚠️ Poblar desde scraping (axios → API Laravel)  |
| `importModelStream(params)`       | ⚠️ Importar desde archivo (axios → API Laravel) |

---

## 👥 ModelStreamCustomerSupabaseService

**Archivo**: `src/services/supabase/ModelStreamCustomerSupabaseService.js`
**Tabla(s)**: `models_streams_customers`
**Descripción**: Clientes/seguidores registrados durante transmisiones.

| Método                              | Descripción      |
| ----------------------------------- | ---------------- |
| `getModelsStreamsCustomers(params)` | Listar clientes  |
| `addModelStreamCustomer(params)`    | Crear cliente    |
| `getModelStreamCustomer(params)`    | Obtener cliente  |
| `editModelStreamCustomer(params)`   | Editar cliente   |
| `delModelStreamCustomer(params)`    | Eliminar cliente |

---

## 📁 ModelStreamFileSupabaseService

**Archivo**: `src/services/supabase/ModelStreamFileSupabaseService.js`
**Tabla(s)**: `models_streams_files`
**Descripción**: Archivos adjuntos a las transmisiones (capturas, evidencias).

| Método                          | Descripción      |
| ------------------------------- | ---------------- |
| `getModelsStreamsFiles(params)` | Listar archivos  |
| `addModelStreamFile(params)`    | Subir archivo    |
| `getModelStreamFile(params)`    | Obtener archivo  |
| `editModelStreamFile(params)`   | Editar archivo   |
| `delModelStreamFile(params)`    | Eliminar archivo |

---

## 🎯 ModelGoalSupabaseService

**Archivo**: `src/services/supabase/ModelGoalSupabaseService.js`
**Tabla(s)**: `models_goals`, `studios_models`
**Descripción**: Metas de rendimiento asignadas a modelos (tokens, USD).

| Método                   | Descripción   |
| ------------------------ | ------------- |
| `getModelsGoals(params)` | Listar metas  |
| `getModelGoal(params)`   | Obtener meta  |
| `addModelGoal(params)`   | Crear meta    |
| `editModelGoal(params)`  | Editar meta   |
| `delModelGoal(params)`   | Eliminar meta |

---

## 💰 ModelTransactionSupabaseService

**Archivo**: `src/services/supabase/ModelTransactionSupabaseService.js`
**Tabla(s)**: `models_transactions`
**Descripción**: Transacciones financieras (ingresos/egresos) por modelo.

| Método                          | Descripción          |
| ------------------------------- | -------------------- |
| `getModelsTransactions(params)` | Listar transacciones |
| `getModelTransaction(params)`   | Obtener transacción  |
| `addModelTransaction(params)`   | Crear transacción    |
| `editModelTransaction(params)`  | Editar transacción   |
| `delModelTransaction(params)`   | Eliminar transacción |

---

## 🏦 AccountSupabaseService

**Archivo**: `src/services/supabase/AccountSupabaseService.js`
**Tabla(s)**: `accounts`
**Descripción**: Cuentas contables generales.

| Método                | Descripción              |
| --------------------- | ------------------------ |
| `getAccounts(params)` | Listar cuentas contables |
| `editAccount(params)` | Editar cuenta            |

---

## 🏦 BankAccountSupabaseService

**Archivo**: `src/services/supabase/BankAccountSupabaseService.js`
**Tabla(s)**: `bank_accounts`
**Descripción**: Cuentas bancarias de usuarios.

| Método                     | Descripción              |
| -------------------------- | ------------------------ |
| `getBanksAccounts(params)` | Listar cuentas bancarias |
| `getBankAccount(params)`   | Obtener cuenta           |
| `addBankAccount(params)`   | Crear cuenta             |
| `editBankAccount(params)`  | Editar cuenta            |
| `delBankAccount(params)`   | Eliminar cuenta          |

---

## 📂 CategorySupabaseService

**Archivo**: `src/services/supabase/CategorySupabaseService.js`
**Tabla(s)**: `categories`
**Descripción**: Categorías para clasificar transacciones/productos.

| Método                  | Descripción        |
| ----------------------- | ------------------ |
| `getCategories(params)` | Listar categorías  |
| `getCategory(params)`   | Obtener categoría  |
| `addCategory(params)`   | Crear categoría    |
| `editCategory(params)`  | Editar categoría   |
| `delCategory(params)`   | Eliminar categoría |

---

## 🔗 CommissionSupabaseService

**Archivo**: `src/services/supabase/CommissionSupabaseService.js`
**Tabla(s)**: `commissions_relations`, `studios_models`, `setup_commissions`
**Descripción**: Árbol jerárquico de comisiones entre modelos/monitores.

| Método                                    | Descripción                          |
| ----------------------------------------- | ------------------------------------ |
| `getCommisssionsTree(params)`             | Obtener árbol completo de comisiones |
| `addRelation(params)`                     | Crear relación de comisión           |
| `delRelation(params)`                     | Eliminar relación                    |
| `editRelation(params)`                    | Editar relación                      |
| `editRelationParent(params)`              | Cambiar padre en jerarquía           |
| `getCommissionsOfChiefCommission(params)` | Hijos de una comisión                |

---

## ⚙️ SetupCommissionSupabaseService

**Archivo**: `src/services/supabase/SetupCommissionSupabaseService.js`
**Tabla(s)**: `setup_commissions`, `setup_commissions_item`
**Descripción**: Configuración de escalas de comisiones (porcentajes, valores fijos).

| Método                        | Descripción            |
| ----------------------------- | ---------------------- |
| `getSetupCommissions(params)` | Listar configuraciones |
| `getSetupCommission(params)`  | Obtener configuración  |
| `addSetupCommission(params)`  | Crear configuración    |
| `editSetupCommission(params)` | Editar configuración   |
| `delSetupCommission(params)`  | Eliminar configuración |

---

## 📊 DashboardSupabaseService

**Archivo**: `src/services/supabase/DashboardSupabaseService.js`
**Tabla(s)**: `models_streams`, `models_goals`, `periods` + RPC functions
**Descripción**: Datos para el dashboard principal (indicadores, gráficas, metas).

| Método                                       | Descripción                          |
| -------------------------------------------- | ------------------------------------ |
| `getIndicators({ per_id, std_id })`          | KPIs del dashboard (vía RPC)         |
| `getTasks(user_id)`                          | Tareas pendientes (vía RPC)          |
| `getCharts({ per_id, std_id })`              | Gráficas de ganancias por plataforma |
| `getModelGoals({ per_id, std_id, user_id })` | Metas por modelo con progreso        |
| `getStudioGoals({ per_id, std_id })`         | Metas agregadas por estudio          |

---

## 📄 DocumentSupabaseService

**Archivo**: `src/services/supabase/DocumentSupabaseService.js`
**Tabla(s)**: Storage bucket `el-castillo`
**Descripción**: Subida y gestión de documentos e imágenes en Supabase Storage.

| Método                            | Descripción                |
| --------------------------------- | -------------------------- |
| `uploadImage(params)`             | Subir imagen al storage    |
| `uploadVideo(params)`             | Subir video al storage     |
| `getUserVideos(params)`           | Listar videos de usuario   |
| `getUserImagesMultimedia(params)` | Listar imágenes multimedia |
| `deleteDocument(params)`          | Eliminar documento         |

---

## 💱 ExchangeRateSupabaseService

**Archivo**: `src/services/supabase/ExchangeRateSupabaseService.js`
**Tabla(s)**: `exchange_rates`
**Descripción**: Tasas de cambio USD/COP.

| Método                      | Descripción         |
| --------------------------- | ------------------- |
| `getExchangesRates(params)` | Listar tasas        |
| `getExchangeRate(params)`   | Obtener tasa        |
| `addExchangeRate(params)`   | Crear tasa          |
| `editExchangeRate(params)`  | Editar tasa         |
| `delExchangeRate(params)`   | Eliminar tasa       |
| `getLatest()`               | Obtener última tasa |

---

## 📊 LiquidationSupabaseService

**Archivo**: `src/services/supabase/LiquidationSupabaseService.js`
**Tabla(s)**: `models_streams`, `studios_models`, `periods`
**Descripción**: Liquidación de comisiones por modelo y estudio. Agrega ganancias y calcula comisiones.

| Método                          | Descripción                        |
| ------------------------------- | ---------------------------------- |
| `getLiquidations(params)`       | Listar liquidaciones               |
| `addLiquidation(params)`        | Crear liquidación                  |
| `getLiquidation(params)`        | Obtener liquidación                |
| `editLiquidation(params)`       | Editar liquidación                 |
| `delLiquidation(params)`        | Eliminar liquidación               |
| `getModelsLiquidation(params)`  | Liquidación desglosada por modelo  |
| `getStudiosLiquidation(params)` | Liquidación desglosada por estudio |

---

## 🌍 LocationSupabaseService

**Archivo**: `src/services/supabase/LocationSupabaseService.js`
**Tabla(s)**: `locations`
**Descripción**: Ubicaciones geográficas (países, departamentos, ciudades).

| Método                                | Descripción                   |
| ------------------------------------- | ----------------------------- |
| `getLocations()`                      | Árbol completo de ubicaciones |
| `getCountries()`                      | Listar países                 |
| `getDepartments(params)`              | Departamentos por país        |
| `getCities(params)`                   | Ciudades por departamento     |
| `addCountry/addDepartment/addCity`    | Crear ubicación               |
| `editCountry/editDepartment/editCity` | Editar ubicación              |
| `delCountry/delDepartment/delCity`    | Eliminar ubicación            |

---

## 📋 LogSupabaseService

**Archivo**: `src/services/supabase/LogSupabaseService.js`
**Tabla(s)**: `logs`
**Descripción**: Registro de auditoría (cambios en entidades del sistema).

| Método                      | Descripción                          |
| --------------------------- | ------------------------------------ |
| `getLogs(params)`           | Listar logs con filtros y paginación |
| `getLogsWithFilers(params)` | Alias de getLogs                     |
| `getLog(params)`            | Obtener log individual               |

---

## 🕐 LoginHistorySupabaseService

**Archivo**: `src/services/supabase/LoginHistorySupabaseService.js`
**Tabla(s)**: `login_history`, `users`
**Descripción**: Historial de logins de usuarios.

| Método               | Descripción                     |
| -------------------- | ------------------------------- |
| `getHistory(params)` | Listar historial con paginación |

---

## 👁️ MonitorSupabaseService

**Archivo**: `src/services/supabase/MonitorSupabaseService.js`
**Tabla(s)**: `studios_models`, `users`, `models_streams`
**Descripción**: Vista de monitores con las modelos que supervisan.

| Método                | Descripción                      |
| --------------------- | -------------------------------- |
| `getMonitors(params)` | Listar monitores con sus modelos |
| `getMonitor(params)`  | Obtener monitor individual       |

---

## 🔔 NotificationSupabaseService

**Archivo**: `src/services/supabase/NotificationSupabaseService.js`
**Tabla(s)**: `notifications`
**Descripción**: Notificaciones internas del sistema.

| Método                     | Descripción           |
| -------------------------- | --------------------- |
| `getNotifications(params)` | Listar notificaciones |
| `getNotification(params)`  | Obtener notificación  |
| `addNotification(params)`  | Crear notificación    |
| `editNotification(params)` | Editar notificación   |
| `delNotification(params)`  | Eliminar notificación |

---

## 💵 PaymentSupabaseService

**Archivo**: `src/services/supabase/PaymentSupabaseService.js`
**Tabla(s)**: `payments`
**Descripción**: Registros de pagos a modelos/monitores.

| Método                | Descripción   |
| --------------------- | ------------- |
| `getPayments(params)` | Listar pagos  |
| `getPayment(params)`  | Obtener pago  |
| `addPayment(params)`  | Crear pago    |
| `editPayment(params)` | Editar pago   |
| `delPayment(params)`  | Eliminar pago |

---

## 📄 PaymentFileSupabaseService

**Archivo**: `src/services/supabase/PaymentFileSupabaseService.js`
**Tabla(s)**: `payment_files`
**Descripción**: Archivos de soporte de pagos (comprobantes).

| Método                    | Descripción      |
| ------------------------- | ---------------- |
| `getPaymentFiles(params)` | Listar archivos  |
| `addPaymentFile(params)`  | Subir archivo    |
| `getPaymentFile(params)`  | Obtener archivo  |
| `editPaymentFile(params)` | Editar archivo   |
| `delPaymentFile(params)`  | Eliminar archivo |

---

## 📊 PaysheetSupabaseService

**Archivo**: `src/services/supabase/PaysheetSupabaseService.js`
**Tabla(s)**: `paysheets`, `periods`, `payroll_transactions`
**Descripción**: Planillas de pago y consulta de períodos.

| Método                      | Descripción                              |
| --------------------------- | ---------------------------------------- |
| `getPaysheetUsers(params)`  | Listar planillas con estudios y períodos |
| `getPaysheetPDF(params)`    | Obtener datos de transacción para PDF    |
| `getPayrollPeriods(params)` | Listar períodos de nómina                |

---

## 💼 PayrollSupabaseService _(NUEVO)_

**Archivo**: `src/services/supabase/PayrollSupabaseService.js`
**Tabla(s)**: `payroll_periods`, `payroll_concepts`, `payroll_transactions`, `periods`, `studios_models`, `models_streams`
**Descripción**: Módulo completo de nómina colombiana. Gestiona períodos, liquidación con cálculos de prestaciones sociales, seguridad social, parafiscales y horas extras.

| Método                                    | Descripción                                            |
| ----------------------------------------- | ------------------------------------------------------ |
| `getPayrollPeriods(params)`               | Listar períodos de nómina                              |
| `autoGeneratePeriod(params)`              | Generar período automático (semanal/quincenal/mensual) |
| `autoGenerateNextPeriods(params)`         | Generar N períodos futuros                             |
| `closePeriod(periodId)`                   | Cerrar período                                         |
| `openPeriod(periodId)`                    | Reabrir período                                        |
| `deletePeriod(periodId)`                  | Eliminar período                                       |
| `getCommissionPeriods(params)`            | Períodos de comisión del estudio                       |
| `getPeriodsByIds(periodIds)`              | Obtener períodos por IDs                               |
| `getPayrollTransactions(payrollPeriodId)` | Transacciones de nómina del período                    |
| `getEligibleEmployees(stdId)`             | Empleados con contrato LABORAL                         |
| `previewPayroll(params)`                  | Vista previa de liquidación                            |
| `processPayroll(params)`                  | Procesar y guardar liquidación                         |
| `addConcept(params)`                      | Agregar concepto (hora extra)                          |
| `deleteConcept(conceptId)`                | Eliminar concepto                                      |
| `getPayrollPdf(payrollTransId)`           | Obtener datos para PDF                                 |

---

## 📅 PeriodSupabaseService

**Archivo**: `src/services/supabase/PeriodSupabaseService.js`
**Tabla(s)**: `periods`
**Descripción**: Períodos contables/operativos del sistema.

| Método                | Descripción      |
| --------------------- | ---------------- |
| `getPeriods(params)`  | Listar períodos  |
| `getPeriod(params)`   | Obtener período  |
| `addPeriod(params)`   | Crear período    |
| `editPeriod(params)`  | Editar período   |
| `delPeriod(params)`   | Eliminar período |
| `closePeriod(params)` | Cerrar período   |

---

## 📝 PetitionSupabaseService

**Archivo**: `src/services/supabase/PetitionSupabaseService.js`
**Tabla(s)**: `petitions`
**Descripción**: Peticiones/solicitudes de las modelos (vacaciones, permisos, etc.).

| Método                 | Descripción       |
| ---------------------- | ----------------- |
| `getPetitions(params)` | Listar peticiones |
| `getPetition(params)`  | Obtener petición  |
| `addPetition(params)`  | Crear petición    |
| `editPetition(params)` | Editar petición   |
| `delPetition(params)`  | Eliminar petición |

---

## 🛒 ProductSupabaseService

**Archivo**: `src/services/supabase/ProductSupabaseService.js`
**Tabla(s)**: `products`
**Descripción**: Productos del catálogo (monedas virtuales, servicios).

| Método                | Descripción       |
| --------------------- | ----------------- |
| `getProducts(params)` | Listar productos  |
| `getProduct(params)`  | Obtener producto  |
| `addProduct(params)`  | Crear producto    |
| `editProduct(params)` | Editar producto   |
| `delProduct(params)`  | Eliminar producto |

---

## 👤 ProfileSupabaseService

**Archivo**: `src/services/supabase/ProfileSupabaseService.js`
**Tabla(s)**: `profiles`
**Descripción**: Perfiles/roles del sistema (ADMIN, MONITOR, MODELO, etc.).

| Método          | Descripción                 |
| --------------- | --------------------------- |
| `getProfiles()` | Listar perfiles disponibles |

---

## 📊 ReportSupabaseService

**Archivo**: `src/services/supabase/ReportSupabaseService.js`
**Tabla(s)**: `models_streams`, `studios_models`
**Descripción**: Reportes analíticos de ganancias y rendimiento.

| Método                   | Descripción                   |
| ------------------------ | ----------------------------- |
| `getReports(params)`     | Generar reporte con filtros   |
| `getModelReport(params)` | Reporte individual por modelo |

---

## ⚙️ SettingSupabaseService

**Archivo**: `src/services/supabase/SettingSupabaseService.js`
**Tabla(s)**: `settings`
**Descripción**: Configuraciones generales del sistema.

| Método                | Descripción            |
| --------------------- | ---------------------- |
| `getSettings(params)` | Listar configuraciones |
| `getSetting(params)`  | Obtener configuración  |
| `addSetting(params)`  | Crear configuración    |
| `editSetting(params)` | Editar configuración   |
| `delSetting(params)`  | Eliminar configuración |

---

## 💸 TransactionSupabaseService

**Archivo**: `src/services/supabase/TransactionSupabaseService.js`
**Tabla(s)**: `transactions`
**Descripción**: Transacciones financieras generales.

| Método                    | Descripción          |
| ------------------------- | -------------------- |
| `getTransactions(params)` | Listar transacciones |
| `getTransaction(params)`  | Obtener transacción  |
| `addTransaction(params)`  | Crear transacción    |
| `editTransaction(params)` | Editar transacción   |
| `delTransaction(params)`  | Eliminar transacción |

---

## 📂 TransactionTypeSupabaseService

**Archivo**: `src/services/supabase/TransactionTypeSupabaseService.js`
**Tabla(s)**: `transactions_types`
**Descripción**: Tipos de transacción (ingreso, egreso, etc.).

| Método                         | Descripción   |
| ------------------------------ | ------------- |
| `getTransactionsTypes(params)` | Listar tipos  |
| `getTransactionType(params)`   | Obtener tipo  |
| `addTransactionType(params)`   | Crear tipo    |
| `editTransactionType(params)`  | Editar tipo   |
| `delTransactionType(params)`   | Eliminar tipo |

---

## 🔧 queryUtils.js

**Archivo**: `src/services/supabase/queryUtils.js`
**Descripción**: Utilidades compartidas para construir queries de Supabase.

| Función                            | Descripción                                |
| ---------------------------------- | ------------------------------------------ |
| `normalizeQueryString(str)`        | Convertir query string a Map de parámetros |
| `applyQueryFilters(query, params)` | Aplicar filtros, ordenamiento y paginación |

---

## 🔐 ApiModuleSupabaseService _(NUEVO)_

**Archivo**: `src/services/supabase/ApiModuleSupabaseService.js`
**Tabla(s)**: `api_modules`, `api_permissions`, `api_user_overrides`
**Descripción**: Sistema dinámico de módulos y permisos API. Registra módulos, asigna permisos por perfil, excepciones por usuario, y carga permisos efectivos para la sesión. Reemplaza los permisos hardcodeados de `sGate.js`.

| Método                                | Descripción                                    |
| ------------------------------------- | ---------------------------------------------- |
| `getModules()`                        | Listar todos los módulos registrados           |
| `getModule(params)`                   | Obtener módulo por ID                          |
| `addModule(params)`                   | Registrar nuevo módulo                         |
| `editModule(params)`                  | Editar módulo                                  |
| `delModule(params)`                   | Eliminar módulo                                |
| `getPermissionsMatrix()`              | Matriz completa módulos × perfiles             |
| `getPermissionsByProfile(profId)`     | Permisos de un perfil específico               |
| `savePermission(params)`              | Guardar/actualizar permiso (upsert)            |
| `savePermissionsBatch(list)`          | Guardar múltiples permisos en lote             |
| `delPermission(params)`               | Eliminar un permiso                            |
| `getUserOverrides(userId)`            | Obtener excepciones de un usuario              |
| `saveUserOverride(params)`            | Guardar/actualizar excepción                   |
| `delUserOverride(params)`             | Eliminar excepción                             |
| `loadUserPermissions(userId, profId)` | Cargar permisos efectivos (perfil + overrides) |

**Panel Admin**: `src/pages/ApiModules/ApiModules.vue` — Ruta: `/api_modules`

---

## 📁 StorageSupabaseService

**Archivo**: `src/services/supabase/StorageSupabaseService.js`
**Bucket**: `el-castillo`
**Descripción**: Manejo genérico de archivos en Supabase Storage.

| Método                 | Descripción                      |
| ---------------------- | -------------------------------- |
| `uploadFile(params)`   | Subir archivo al bucket          |
| `deleteFile(params)`   | Eliminar archivo del bucket      |
| `getPublicUrl(params)` | Obtener URL pública de un objeto |

---

## 🌐 Servicios Externos (NO Supabase)

### SSOService

**Archivo**: `src/services/SSOService.js` (usa axios → API SSO externa)

| Método           | Descripción             |
| ---------------- | ----------------------- |
| `status(params)` | Estado del servicio SSO |
| `sso(params)`    | Ejecutar proceso SSO    |

### MercadoPagoService

**Archivo**: `src/services/MercadoPagoService.js` (usa axios → API MercadoPago)

| Método                  | Descripción               |
| ----------------------- | ------------------------- |
| `addPreference(params)` | Crear preferencia de pago |
| `feedback(params)`      | Procesar feedback de pago |

---

## 📊 Resumen de Tablas Supabase

| Tabla                      | Servicio(s) que la usan                         |
| -------------------------- | ----------------------------------------------- |
| `users`                    | Auth, User, User2, Dashboard                    |
| `profiles`                 | Auth, User, Profile                             |
| `users_permissions2`       | UserPermission2                                 |
| `studios`                  | Studio, StudioModel, Dashboard                  |
| `studios_models`           | StudioModel, ModelAccount, Payroll, Liquidation |
| `studios_rooms`            | StudioRoom                                      |
| `studios_shifts`           | StudioShift                                     |
| `studios_accounts`         | StudioAccount                                   |
| `models_accounts`          | ModelAccount, ModelStream                       |
| `models_goals`             | ModelGoal, Dashboard                            |
| `models_streams`           | ModelStream, Dashboard, Liquidation, Payroll    |
| `models_streams_customers` | ModelStreamCustomer                             |
| `models_streams_files`     | ModelStreamFile                                 |
| `models_transactions`      | ModelTransaction                                |
| `accounts`                 | Account                                         |
| `bank_accounts`            | BankAccount                                     |
| `categories`               | Category                                        |
| `commissions_relations`    | Commission                                      |
| `setup_commissions`        | SetupCommission                                 |
| `exchange_rates`           | ExchangeRate                                    |
| `periods`                  | Period, Paysheet, Payroll                       |
| `transactions`             | Transaction                                     |
| `transactions_types`       | TransactionType                                 |
| `products`                 | Product                                         |
| `payments`                 | Payment                                         |
| `payment_files`            | PaymentFile                                     |
| `paysheets`                | Paysheet                                        |
| `payroll_periods`          | Payroll                                         |
| `payroll_concepts`         | Payroll                                         |
| `payroll_transactions`     | Payroll, Paysheet                               |
| `notifications`            | Notification                                    |
| `petitions`                | Petition                                        |
| `locations`                | Location                                        |
| `logs`                     | Log                                             |
| `login_history`            | LoginHistory, Auth                              |
| `settings`                 | Setting                                         |
| `api_modules`              | **ApiModule**                                   |
| `api_permissions`          | **ApiModule**                                   |
| `api_user_overrides`       | **ApiModule**                                   |
| `terceros`                 | _(sin servicio dedicado — solo RLS)_            |
| Storage `el-castillo`      | Document, User                                  |
