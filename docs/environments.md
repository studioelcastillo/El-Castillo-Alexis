# Estrategia de Entornos y Despliegue — EL CASTILLO GROUP SAS

Este documento define la estructura de servidores y la política de desarrollo para asegurar la estabilidad del software.

## 1. Proyectos de Supabase

Se han designado dos proyectos independientes para separar los datos reales de las pruebas de desarrollo:

| Entorno        | Proyecto Supabase                         | ID de Proyecto         | Propósito                                                              |
| :------------- | :---------------------------------------- | :--------------------- | :--------------------------------------------------------------------- |
| **PRODUCCIÓN** | `gerencia1elcastillo@gmail.com's Project` | `ysorlqfwqccsgxxkpzdx` | Datos reales, usuarios finales y operaciones de negocio.               |
| **STAGING**    | `El Castillo Pruebas`                     | `pnnrsqocukixusmzrlhy` | Pruebas de nuevas funcionalidades, depuración y validación por Alexis. |

## 2. Política de Sincronización y Autorización

Para agilizar el desarrollo, se establecen las siguientes reglas de operación:

1. **Autorización Delegada**: El sistema tiene permiso pleno para modificar, mover y ejecutar comandos (`run_command`) de forma autónoma para agilizar el desarrollo. Solo se requerirá autorización explícita para la **eliminación definitiva** de archivos críticos o datos sensibles.
2. **Sincronización Total**: Cualquier cambio realizado localmente debe reflejarse en:
   - **GitHub**: Repositorio oficial (ramas `main` para producción y `staging` para pruebas).
   - **Carpeta del Proyecto**: Sincronización continua con el entorno local.
3. **Despliegue Automático**:
   - Los cambios en la rama `staging` activan el despliegue a `pruebas.livstre.com`.
   - Los cambios en la rama `main` activan el despliegue a producción.
4. **Persistencia de Datos**: Nunca se deben mezclar las credenciales de un entorno con otro. El archivo `.env.production` y `.env.staging` deben ser respetados estrictamente.

## 2.1 Convención operativa

- `.env` y `apps/dashboard/.env`: desarrollo local, deben apuntar a `staging`.
- `.env.staging`: despliegue y validación en pruebas.
- `.env.production`: despliegue real, solo para salida a produccion.
- Scripts de migración SQL: ejecutar primero en `staging` y luego replicar a `produccion` tras validación.

---

> [!IMPORTANT]
> Esta documentación debe ser consultada por cualquier desarrollador o IA antes de realizar modificaciones estructurales en el proyecto.

## 3. Hosting y dominios (Hostinger)

- Proveedor: Hostinger (hosting y DNS).
- Produccion: `terminado.livstre.com`.
- Staging: `pruebas.livstre.com`.
- Publicacion esperada: servir el contenido de `dist/spa` como raiz del sitio. Debe incluir `dashboard-app/` (o el subpath definido en `VITE_DASHBOARD_BASE`/`DASHBOARD_APP_URL`) y el archivo `.htaccess` dentro de esa carpeta para el enrutamiento SPA.
