# Zona local privada

Esta carpeta esta pensada para archivos locales con informacion sensible del proyecto.

## Reglas
- No guardes este contenido en git.
- No copies tokens reales a `README.md`, `MEMORIA.md`, `docs/` ni `security/`.
- Usa estos archivos solo como almacenamiento local transitorio o como puente hacia variables del sistema/plataforma.

## Archivos sugeridos
- `.secure/root.env.local`
- `.secure/dashboard.env.local`
- `.secure/server.env.local`
- `.secure/backend-legacy.env.local`
- `.secure/deploy.env.local`
- `.secure/vps.pruebas.env.local`
- `.secure/vps.terminado.env.local`

## Recomendacion
- Si el proveedor permite secrets nativos, prefiere el panel del proveedor sobre archivos locales.
