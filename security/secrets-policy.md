# Politica de manejo de secretos

## Objetivo
Evitar que claves, tokens, passwords y DSN administrativos queden expuestos en el repositorio, documentacion, logs o despliegues.

## Principios
- Guardar en git solo plantillas como `.env.example`.
- Cargar secretos reales desde el entorno de ejecucion o desde un gestor de secretos.
- No registrar secretos completos en `MEMORIA.md`, commits, PRs, screenshots ni logs.
- Separar siempre `local`, `staging` y `production`.
- Tratar como rotables todos los secretos privados, aunque no se roten hoy.

## Politica por entorno

### Local
- `software el castillo/.env` y `software el castillo/apps/dashboard/.env` pueden existir solo como archivos locales ignorados por git.
- Los secretos administrativos de scripts deben preferirse como variables de shell temporales antes que persistirlos en archivo.
- No reutilizar credenciales de `production` para pruebas locales.

### Staging
- Las variables del frontend deben inyectarse desde la plataforma de despliegue.
- Las credenciales administrativas de SQL, Auth admin, webhooks y servicios internos deben vivir en gestor de secretos o secrets del CI.
- Todo cambio de esquema se valida primero aqui.

### Production
- Ningun secreto real debe quedar en archivos del repo, memoria de sesion o documentacion operativa.
- Los secretos deben almacenarse solo en la plataforma que ejecuta el servicio o en el gestor de secretos del equipo.
- El acceso administrativo debe entregarse con minimo privilegio y tiempo de vida corto cuando aplique.

## Donde guardar cada grupo

| Grupo | Donde debe vivir |
| --- | --- |
| Frontend publico (`VITE_*` publicos) | Variables de despliegue del frontend |
| Supabase admin / SQL | Gestor de secretos, secrets de CI o variables efimeras de shell |
| Webhooks de despliegue | Secrets del CI/CD o panel del proveedor |
| Gemini proxy | Variables del servidor Node |
| ADMS / biometrico | Variables del servicio Windows o wrapper NSSM |
| Backend legacy Laravel | `.env` solo en servidor o maquina local de backend |

## Procedimiento operativo

### 1. Alta de un secreto nuevo
- Definir nombre estable y uso exacto.
- Clasificarlo como `publico`, `sensible` o `privado critico`.
- Registrarlo en `security/secrets-inventory.md` sin valor.
- Cargarlo en el sistema de secretos correspondiente.
- Actualizar solo el `.env.example` si hace falta documentarlo.
- Regla fija: si es una clave, API key, token, webhook o credencial privada nueva, su valor real debe quedar en `/.secure/` o en el proveedor/secret manager; nunca en codigo ni documentacion versionada.

### 2. Uso durante desarrollo
- Exportar la variable en la sesion o cargarla desde archivo local ignorado.
- Nunca pegarla dentro del codigo fuente ni en scripts.
- Evitar comandos que la impriman completa en consola.

### 3. Uso en scripts
- Leer siempre desde `process.env` o desde el entorno del servicio.
- No hardcodear tokens en `.mjs`, `.ts`, `.sql`, workflows o docs.
- Si un script requiere credenciales temporales, documentar el nombre de la variable y no el valor.
- Si un script crea usuarios o credenciales temporales, el modo seguro debe ser el default; los modos legacy/inseguros solo pueden ejecutarse por configuracion explicita.

### 4. Documentacion y memoria
- En `MEMORIA.md` solo dejar referencias del tipo: "token disponible en gestor seguro".
- Si hace falta recordar un secreto, registrar ubicacion, propietario y entorno, nunca el valor.
- Redactar accesos validados con placeholders, no con passwords reales.

### 5. Logs y salidas
- No loguear `Authorization`, `apikey`, cookies, DSN completos ni payloads con credenciales.
- Si se necesita depurar, truncar valores: primeros 4 y ultimos 4 caracteres como maximo.

### 6. Dumps y exportaciones
- Tratar dumps SQL, exports CSV y backups como material sensible aunque no contengan llaves API.
- Mantenerlos fuera del repositorio o bajo rutas ignoradas por git.
- No usarlos como fuente de ejemplos en documentacion publica porque pueden incluir datos personales, hashes o credenciales legacy.

## Checklist de saneamiento
- Confirmar que `.gitignore` cubre todos los `.env` reales.
- Confirmar que dumps como `castillo_prod_aws.sql.txt` sigan fuera del flujo de publicacion y revision compartida.
- Revisar `MEMORIA.md`, `README.md`, `docs/`, `scripts/` y `.github/workflows/` antes de cerrar una tarea.
- Buscar patrones de secretos antes de commit.
- Verificar que el build no embeba variables privadas en el cliente.
- Confirmar que los servicios de despliegue usan secrets del proveedor y no valores inline.

## Auditoria recurrente recomendada
- Semanal si se estan moviendo credenciales entre entornos.
- Mensual como minimo en operaciones estables.
- Antes de cada release a `production`.

## Busqueda sugerida antes de publicar
```bash
rg -n "sbp_|sb_secret_|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|APP_KEY=base64:|TWILIO_AUTH_TOKEN|MP_ACCESS_TOKEN|GEMINI_API_KEY|ADMS_TOKEN" .
```

## Plan de implementacion sin rotar credenciales
1. Redactar exposiciones documentales y de memoria.
2. Consolidar inventario sin valores.
3. Confirmar almacenamiento por entorno en plataforma o gestor de secretos.
4. Eliminar dependencia de secretos persistidos en archivos compartidos.
5. Preparar despues una rotacion controlada, cuando el usuario lo autorice.
