# El Castillo - React/Vite

Node 18+ (recomendado Node 20).

## Instalar dependencias
```bash
npm install
```

## Desarrollo
```bash
npm run dev
```

## Build
```bash
npm run build
```

## Variables de entorno
Crea un `.env` (en el root o `apps/dashboard/.env`) y define:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (opcional, usa el API por defecto)
- `VITE_DASHBOARD_BASE` (opcional, ej: `/dashboard-app/`)
- `GEMINI_API_KEY` (opcional)
Plantilla disponible en `apps/dashboard/.env.example`.

## Lovable
Configuracion sugerida:
- Project root: repo principal
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `apps/dashboard/dist`
- Dev command: `npm run dev` (puerto 3000)
- Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Opcional: `VITE_API_URL`, `VITE_DASHBOARD_BASE`, `GEMINI_API_KEY`

## Estructura
La app principal esta en `apps/dashboard` (React + Vite).

## Notas
Proyecto consolidado en React.
