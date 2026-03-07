import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

for (let line of envFile.split('\n')) {
  line = line.trim();
  if (line.startsWith('VITE_SUPABASE_URL') || line.startsWith('SUPABASE_URL')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY')) {
    supabaseKey = line.split('=')[1].trim();
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan las credenciales de Supabase en el .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePasswords() {
  console.log("Iniciando actualización masiva de contraseñas...");
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;
  let successCount = 0;
  let errorCount = 0;

  while (hasMore) {
    console.log(`Buscando usuarios (página ${page + 1})...`);
    // Obtener usuarios de la tabla 'users' pública que tiene el user_identification
    const { data: users, error } = await supabase
      .from('users')
      .select('user_identification, auth_user_id')
      .not('user_identification', 'is', null)
      .not('auth_user_id', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("Error obteniendo usuarios:", error);
      break;
    }

    if (!users || users.length === 0) {
      hasMore = false;
      break;
    }

    for (const user of users) {
      const doc = String(user.user_identification).trim();
      if (doc.length >= 6) {
        const newPassword = doc.slice(-6);
        try {
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.auth_user_id,
            { password: newPassword }
          );

          if (updateError) {
             console.error(`❌ Error actualizando a ${doc}:`, updateError.message);
             errorCount++;
          } else {
             console.log(`✅ Contraseña de ${doc} actualizada a ${newPassword}`);

             // Actualizar también la tabla users para consistencia con el viejo backend (opcional pero recomendado)
             await supabase.from('users').update({ user_password: newPassword }).eq('auth_user_id', user.auth_user_id);

             successCount++;
          }
        } catch (e) {
          console.error(`💥 Excepción actualizando a ${doc}:`, e);
          errorCount++;
        }
      } else {
        console.warn(`⚠️ Usuario ignorado: ${doc} (menos de 6 dígitos)`);
      }
    }
    page++;
  }

  console.log("===================================");
  console.log(`Proceso finalizado.`);
  console.log(`✅ Usuarios actualizados: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log("===================================");
}

updatePasswords();
