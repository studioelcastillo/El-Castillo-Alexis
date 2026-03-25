import fs from 'fs';
import readline from 'readline';

const DUMP_PATH = 'E:\\Documentos\\Desktop\\Aplicacion Castillo Alexis\\problemas\\castillo_prod_aws.sql.txt';

let envFile;
try {
  envFile = fs.readFileSync('.env', 'utf8');
} catch (e) {
  console.error("No .env found. Run this from the root directory.");
  process.exit(1);
}

let SUPABASE_URL = '';
let SUPABASE_SECRET_KEY = '';

for (let line of envFile.split('\n')) {
  line = line.trim();
  if (line.startsWith('SUPABASE_URL')) SUPABASE_URL = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY')) SUPABASE_SECRET_KEY = line.split('=')[1].trim();
  if (!SUPABASE_URL && line.startsWith('VITE_SUPABASE_URL')) SUPABASE_URL = line.split('=')[1].trim();
}

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY.');
  process.exit(1);
}

const BATCH_SIZE = 500;

// Configuración de las tablas que vamos a importar
const TABLES = {
  models_goals: {
    source: 'models_goals',
    target: 'models_goals',
    pk: 'modgoal_id',
    columns: ['modgoal_id', 'stdmod_id', 'modgoal_type', 'modgoal_amount', 'created_at', 'updated_at', 'deleted_at', 'modgoal_percent', 'modgoal_auto', 'modgoal_date', 'modgoal_reach_goal'],
    map: row => row
  },
  models_transactions: {
    source: 'models_transactions',
    target: 'models_transactions',
    pk: 'modtrans_id',
    columns: ['modtrans_id', 'stdmod_id', 'transtype_id', 'modtrans_date', 'modtrans_description', 'modtrans_amount', 'prod_id', 'created_at', 'updated_at', 'deleted_at', 'modtrans_quantity', 'modtrans_rtefte'],
    map: row => row
  },
  commissions: {
    source: 'commissions',
    target: 'commissions',
    pk: 'com_id',
    // Old DB might have a different structure, let's map whatever fields exist, but assume exact match first
    columns: ['com_id', 'std_id', 'user_id', 'com_type', 'com_percentage', 'com_fixed_amount', 'com_currency', 'com_active', 'period_id', 'created_at', 'updated_at'],
    map: row => row
  },
  petitions: {
    source: 'petitions',
    target: 'petitions',
    pk: 'ptn_id',
    columns: ['ptn_id', 'ptn_consecutive', 'ptn_type', 'ptn_nick', 'ptn_nick_final', 'ptn_password', 'ptn_password_final', 'ptn_mail', 'ptn_payment_pseudonym', 'ptn_page', 'user_id', 'created_at', 'updated_at', 'ptn_linkacc'],
    map: row => row
  }
};

const IMPORT_ORDER = ['petitions'];

const parseCopyHeader = (line) => {
  const match = line.match(/^COPY public\.([^(\s]+) \((.+)\) FROM stdin;$/);
  if (!match) return null;
  return { sourceTable: match[1], columns: match[2].split(',').map((col) => col.trim()) };
};

const decodeValue = (value) => {
  if (value === '\\N') return null;
  return value
    .replace(/\\t/g, '\t')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\\\/g, '\\');
};

async function upsertRows(target, pk, rows) {
  if (!rows.length) return;
  const url = new URL(`${SUPABASE_URL}/rest/v1/${target}`);
  if (pk) url.searchParams.set('on_conflict', pk);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    throw new Error(`${target}: HTTP ${response.status} => ${await response.text()}`);
  }
}

async function importSimpleTable(config) {
  const rl = readline.createInterface({
    input: fs.createReadStream(DUMP_PATH, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let active = false;
  let sourceColumns = [];
  let batch = [];
  let imported = 0;

  for await (const line of rl) {
    if (!active) {
      const header = parseCopyHeader(line);
      if (header && header.sourceTable === config.source) {
        active = true;
        sourceColumns = header.columns;
        console.log(`Encontrada tabla ${config.source} en el dump.`);
      }
      continue;
    }

    if (line === '\\.') {
        break;
    }

    const rawValues = line.split('\t').map(decodeValue);
    const sourceRow = Object.fromEntries(sourceColumns.map((col, index) => [col, rawValues[index] ?? null]));

    // Only map properties that exist in both source and target columns definition
    const mappedRow = {};
    for (const targetCol of config.columns) {
        if (sourceRow[targetCol] !== undefined) {
             mappedRow[targetCol] = sourceRow[targetCol];
        } else {
             mappedRow[targetCol] = null;
        }
    }

    // specific validation for numeric values missing or null strings
    if (config.target === 'petitions') {
        if (mappedRow.ptn_state === undefined) mappedRow.ptn_state = 'PENDING';
    }

    batch.push(config.map(mappedRow));

    if (batch.length >= BATCH_SIZE) {
      await upsertRows(config.target, config.pk, batch);
      imported += batch.length;
      console.log(`  > ${config.target}: ${imported} filas insertadas`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await upsertRows(config.target, config.pk, batch);
    imported += batch.length;
    console.log(`  > ${config.target}: ${imported} filas insertadas`);
  }

  console.log(`Terminado con tabla ${config.target}: ${imported} filas en total.`);
}

async function run() {
  for (const table of IMPORT_ORDER) {
    console.log(`\n==> ${table}`);
    try {
        await importSimpleTable(TABLES[table]);
    } catch (err) {
        console.error(`Error importando ${table}: `, err);
    }
  }
  console.log("\nProceso de importación de tablas faltantes completado.");
}

run().catch((error) => {
  console.error('Import failed:', error.message);
  process.exit(1);
});
