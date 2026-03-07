# Seguridad

Esta carpeta centraliza la documentacion de seguridad versionada del proyecto.

## Contenido
- `security/secrets-inventory.md`: inventario de secretos sin valores reales.
- `security/secrets-policy.md`: politica operativa para manejo, carga y auditoria de secretos.
- `security/private-locations.md`: mapa canonico de donde deben vivir las keys, APIs y archivos privados.

## Carpeta local privada
- Usa `/.secure/` para almacenar archivos locales no versionados con informacion sensible.
- `/.secure/` esta ignorada por git y solo deja plantillas e instrucciones seguras.
- Los archivos locales esperados despues de migrar son `/.secure/root.env.local`, `/.secure/root.staging.env.local`, `/.secure/root.production.env.local`, `/.secure/dashboard.env.local`, `/.secure/server.env.local` y `/.secure/backend-legacy.env.local`.

## Regla principal
- La documentacion versionada vive en `security/`.
- Los valores reales de API keys, tokens, DSN y credenciales locales deben vivir fuera de git, preferiblemente en `/.secure/` o en variables del entorno/plataforma.
- Toda clave, API o secreto nuevo debe seguir esa misma regla en adelante: valor real en `/.secure/` o proveedor; documentacion en `security/`.
