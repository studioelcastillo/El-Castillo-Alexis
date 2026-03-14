import { authAdminUpdateUserById, createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

const targetEnv = String(process.env.RESET_PASSWORDS_ENV || process.argv[2] || 'production')
  .trim()
  .toLowerCase();

if (!['local', 'staging', 'production'].includes(targetEnv)) {
  console.error(`Entorno no soportado para reset_passwords.mjs: ${targetEnv}`);
  process.exit(1);
}

const supabaseTarget = targetEnv === 'local' ? 'staging' : targetEnv;
const supabase = createSupabaseAdminClient(supabaseTarget);

async function updatePasswords() {
  console.log(`Iniciando actualizacion masiva de contrasenas en ${targetEnv}...`);
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;
  let successCount = 0;
  let errorCount = 0;

  while (hasMore) {
      console.log(`Buscando usuarios (pagina ${page + 1})...`);
    // Obtener usuarios de la tabla 'users' pública que tiene el user_identification
    const { data: users, error } = await supabase
      .from('users')
      .select('user_identification, auth_user_id')
      .not('user_identification', 'is', null)
      .not('auth_user_id', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error obteniendo usuarios:', error);
      break;
    }

    if (!users || users.length === 0) {
      hasMore = false;
      break;
    }

    for (const user of users) {
      const doc = String(user.user_identification).trim().replace(/\D/g, '');
      if (doc.length > 0) {
        let newPassword = doc.length >= 6 ? doc.slice(-6) : doc;
        if (newPassword.length < 6) {
          newPassword = newPassword.padStart(6, '0');
        }
        try {
          await authAdminUpdateUserById(supabaseTarget, user.auth_user_id, { password: newPassword });
          console.log(`OK contrasena de ${doc} actualizada a ${newPassword}`);

          // Actualizar tambien la tabla users para consistencia con el viejo backend (opcional pero recomendado)
          await supabase.from('users').update({ user_password: newPassword }).eq('auth_user_id', user.auth_user_id);

          successCount++;
        } catch (e) {
          console.error(`Excepcion actualizando a ${doc}:`, e);
          errorCount++;
        }
      } else {
        console.warn(`Usuario ignorado: ${doc} (menos de 6 digitos)`);
      }
    }
    page++;
  }

  console.log('===================================');
  console.log('Proceso finalizado.');
  console.log(`Usuarios actualizados: ${successCount}`);
  console.log(`Errores: ${errorCount}`);
  console.log('===================================');
}

updatePasswords();
