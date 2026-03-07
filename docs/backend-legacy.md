# Backend legacy

- Fuente localizada en `problemas/el-castillo-webapp-develop (1).zip`.
- Backend Laravel extraido e integrado en `backend-legacy/`.
- La API legacy principal vive en `backend-legacy/routes/api.php`.

## Endurecimiento aplicado

- Middleware tenant: `backend-legacy/app/Http/Middleware/ResolveTenantContext.php`
- Resolucion de contexto tenant: `backend-legacy/app/Support/TenantContext.php`
- Helpers de scoping reutilizables: `backend-legacy/app/Http/Controllers/Controller.php`
- Grupo autenticado de API protegido con `resolveTenant` en `backend-legacy/routes/api.php`

## Controladores reforzados

- `backend-legacy/app/Http/Controllers/PaymentController.php`
- `backend-legacy/app/Http/Controllers/TransactionController.php`
- `backend-legacy/app/Http/Controllers/ModelAccountController.php`
- `backend-legacy/app/Http/Controllers/ModelGoalController.php`
- `backend-legacy/app/Http/Controllers/ModelStreamController.php`
- `backend-legacy/app/Http/Controllers/StudioController.php`
- `backend-legacy/app/Http/Controllers/StudioModelController.php`
- `backend-legacy/app/Http/Controllers/StudioRoomController.php`
- `backend-legacy/app/Http/Controllers/StudioShiftController.php`
- `backend-legacy/app/Http/Controllers/UserController.php`
- `backend-legacy/app/Http/Controllers/BankAccountController.php`
- `backend-legacy/app/Http/Controllers/StudioAccountController.php`
- `backend-legacy/app/Http/Controllers/PaymentFileController.php`
- `backend-legacy/app/Http/Controllers/SetupCommissionController.php`

## Cobertura agregada despues

- `Controller.php` ahora expone helpers para resolver `std_id` de entrada y para buscar registros ya scopeados por tenant antes de editar o borrar.
- `BankAccountController.php` y `StudioAccountController.php` ya fuerzan `std_id` accesible en `store`/`update` y bloquean `show`/`export`/`destroy` fuera de la sede.
- `PaymentFileController.php` ya limita listados, descarga, edicion y borrado a archivos creados por el usuario o vinculados a pagos de sus sedes.
- `SetupCommissionController.php` ya filtra listados y operaciones CRUD/item por `std_id`, evitando editar configuraciones de otras sedes por ID directo.

## Pendiente para ejecutar

- Instalar PHP 8.1+ y Composer en la maquina.
- Dentro de `backend-legacy/` ejecutar:

```bash
composer install
php artisan key:generate
php artisan route:list
php artisan test
```

- Configurar `.env` del backend para apuntar a la base correcta antes de publicarlo.
