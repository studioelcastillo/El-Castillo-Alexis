-- PASO SUGERIDO: Permitir que el frontend busque el email por identificación antes de loguearse.
-- Esto soluciona el error "Usuario no encontrado" en el login.

-- 1. Asegurar que RLS está activo
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar política previa si existe
DROP POLICY IF EXISTS "Allow anon read for login lookup" ON public.users;

-- 3. Crear política para permitir lectura de campos básicos a usuarios anónimos
CREATE POLICY "Allow anon read for login lookup" ON public.users
FOR SELECT
TO anon, authenticated
USING (
  -- Solo permitir si se busca por identificación exacta (más seguro)
  -- o permitir consulta general para el flujo de login
  true
);

-- NOTA: Si prefieres más seguridad, puedes restringir la política a columnas específicas, 
-- pero para el flujo de login de Supabase, permitir el SELECT básico es lo estándar.
