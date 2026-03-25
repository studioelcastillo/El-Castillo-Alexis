import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

for (let line of envFile.split('\n')) {
  line = line.trim();
  if (line.startsWith('SUPABASE_URL')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY')) {
    supabaseKey = line.split('=')[1].trim();
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTerceros() {
  console.log("Revisando tabla terceros...");
  const { data, error, count } = await supabase
    .from('terceros')
    .select('*', { count: 'exact', head: false })
    .limit(5);

  if (error) {
    console.error("Error consultando terceros:", error);
  } else {
    console.log(`Total de terceros en la BD: ${count}`);
    if (data.length > 0) {
      console.log("Primeros registros:", data);
    } else {
        console.log("La tabla 'terceros' esta VACIA.");
    }
  }
}

checkTerceros();
