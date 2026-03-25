import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let envFile;
try {
  envFile = fs.readFileSync('.env', 'utf8');
} catch (e) {
  console.error("No .env found. Run this from the root directory.");
  process.exit(1);
}

let supabaseUrl = '';
let supabaseKey = '';

for (let line of envFile.split('\n')) {
  line = line.trim();
  if (line.startsWith('SUPABASE_URL')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY')) supabaseKey = line.split('=')[1].trim();
  if (!supabaseUrl && line.startsWith('VITE_SUPABASE_URL')) supabaseUrl = line.split('=')[1].trim();
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Extrayendo beneficiarios de bank_accounts...");
  let { data: bankAccounts, error: bErr } = await supabase
    .from('bank_accounts')
    .select('bacc_owner_name, bacc_owner_id');

  if (bErr) { console.error("Error obteniendo cuentas:", bErr); return; }

  console.log("Extrayendo informacion de users...");
  let { data: users, error: uErr } = await supabase
    .from('users')
    .select('user_name, user_surname, user_identification, user_email, user_telephone, user_address');

  if (uErr) { console.error("Error obteniendo usuarios:", uErr); return; }

  const tercerosMap = new Map();

  // 1. Añadir beneficiarios bancarios
  for (const ba of ('length' in bankAccounts ? bankAccounts : [])) {
    if (!ba.bacc_owner_name || !ba.bacc_owner_id) continue;

    // Normalizar nombre
    const name = String(ba.bacc_owner_name).trim().toUpperCase();
    const id = String(ba.bacc_owner_id).trim();

    if (!tercerosMap.has(id)) {
      tercerosMap.set(id, {
        ter_name: name,
        ter_identification: id,
        ter_type: 'PERSONA',
        ter_email: null,
        ter_phone: null,
        ter_address: null,
        ter_active: true
      });
    }
  }

  // 2. Añadir usuarios (como terceros para la contabilidad)
  for (const u of ('length' in users ? users : [])) {
    const name = String((u.user_name || '') + ' ' + (u.user_surname || '')).trim().toUpperCase();
    const id = String(u.user_identification || '').trim();

    if (!name || !id) continue;

    if (!tercerosMap.has(id)) {
      tercerosMap.set(id, {
        ter_name: name,
        ter_identification: id,
        ter_type: 'PERSONA',
        ter_email: u.user_email || null,
        ter_phone: u.user_telephone || null,
        ter_address: u.user_address || null,
        ter_active: true
      });
    }
  }

  const tercerosList = Array.from(tercerosMap.values());
  console.log(`\nSe generaran ${tercerosList.length} terceros unicos desde usuarios y cuentas.`);

  if (tercerosList.length > 0) {
    const BATCH_SIZE = 500;
    let importados = 0;

    for (let i = 0; i < tercerosList.length; i += BATCH_SIZE) {
      const chunk = tercerosList.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase
        .from('terceros')
        .insert(chunk);

      if (error) {
        console.error("Error insertando terceros:", error);
      } else {
        importados += chunk.length;
        console.log(`   Insertados ${importados} terceros...`);
      }
    }
    console.log("¡Proceso de Terceros completado con exito!");
  }
}

run();
