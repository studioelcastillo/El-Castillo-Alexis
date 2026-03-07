-- Script para actualizar las contraseñas de todos los usuarios
-- a los últimos 6 dígitos de su número de identificación.
-- Este script se ejecutará directamente en el editor SQL de Supabase.

-- 1. Crear una función temporal para actualizar los usuarios
DO $$
DECLARE
    user_record RECORD;
    new_password_text TEXT;
    encrypted_pass TEXT;
    success_count INT := 0;
    skipped_count INT := 0;
BEGIN
    RAISE NOTICE 'Iniciando actualización de contraseñas masiva...';

    -- Iterar sobre todos los usuarios public.users que tienen identificación y auth_id
    FOR user_record IN
        SELECT auth_user_id, user_identification
        FROM public.users
        WHERE auth_user_id IS NOT NULL
          AND user_identification IS NOT NULL
          AND LENGTH(TRIM(user_identification)) >= 6
    LOOP
        -- Extraer los últimos 5 dígitos
        new_password_text := RIGHT(TRIM(user_record.user_identification), 6);

        -- Generar el hash bcrypt usando el core_crypt de auth
        -- Usar gen_salt('bf') que es el estándar para bcrypt ($2a$)
        encrypted_pass := crypt(new_password_text, gen_salt('bf'));

        -- 1. Actualizar auth.users (el login real de Supabase)
        UPDATE auth.users
        SET encrypted_password = encrypted_pass,
            updated_at = NOW()
        WHERE id = user_record.auth_user_id;

        -- 2. Actualizar public.users (para consistencia con la aplicación)
        UPDATE public.users
        SET user_password = new_password_text,
            updated_at = NOW()
        WHERE auth_user_id = user_record.auth_user_id;

        success_count := success_count + 1;
    END LOOP;

    RAISE NOTICE 'Proceso completado.';
    RAISE NOTICE '✅ Usuarios actualizados: %', success_count;
END $$;
