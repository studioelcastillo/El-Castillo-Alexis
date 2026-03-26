/**
 * run_migration.mjs — Crea las tablas de scraping en Supabase
 * Ejecutar desde la raíz del proyecto "software el castillo":
 *   node scripts/scrapers/streamate/run_migration.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Leer .env del root del proyecto ─────────────────────────────────────────
function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('[') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && val) out[key] = val;
  }
  return out;
}

const rootEnv = loadDotEnv(path.resolve(__dirname, '../../../.env'));
const env = { ...rootEnv, ...process.env };

const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

console.log(`\n🚀  Ejecutando migración de tablas de scraping`);
console.log(`📡  Proyecto: ${SUPABASE_URL}\n`);

// ── Leer SQL ──────────────────────────────────────────────────────────────────
const sqlPath = path.join(__dirname, 'migration_scraping_tables.sql');
const fullSql = fs.readFileSync(sqlPath, 'utf8');

// ── Ejecutar vía REST pg-meta /query ─────────────────────────────────────────
// El endpoint /rest/v1/rpc/exec_sql no existe en todos los proyectos;
// usamos el endpoint pg-meta que Supabase expone con service role key.
async function execSqlRest(sql) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/`;
  // Fallback: usar fetch directo al endpoint de Supabase SQL
  const res = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  return res;
}

// ── Separar en statements individuales y ejecutar uno por uno ────────────────
const statements = fullSql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

let ok = 0, errs = 0;

for (const stmt of statements) {
  const preview = stmt.replace(/\s+/g, ' ').slice(0, 72);
  process.stdout.write(`  ▶ ${preview}…\n`);

  // Intentar via Supabase JS client con createClient + rpc si hay access
  // Para DDL (CREATE TABLE, CREATE INDEX, ALTER TABLE) usamos la pg-meta API
  const res = await execSqlRest(stmt + ';');

  if (res.ok) {
    console.log(`     ✅  OK`);
    ok++;
  } else {
    const text = await res.text().catch(() => '(no body)');
    // 42P07 = table already exists → fine with IF NOT EXISTS
    if (text.includes('already exists') || text.includes('42P07')) {
      console.log(`     ℹ️  Ya existe (OK con IF NOT EXISTS)`);
      ok++;
    } else if (res.status === 404) {
      // pg-meta endpoint not exposed — fall through to manual SQL editor msg
      console.log(`     ⚠️  Endpoint /pg/query no disponible en este proyecto.`);
      errs++;
      break;
    } else {
      console.log(`     ❌  Error ${res.status}: ${text.slice(0, 120)}`);
      errs++;
    }
  }
}

console.log('');
if (errs === 0) {
  console.log('✅  ¡Migración completada exitosamente!');
  console.log('   Las tablas scraping_jobs, scraping_attempts y scraping_streamate están listas.\n');
} else {
  console.log('⚠️  El endpoint /pg/query no está disponible via REST en este proyecto.');
  console.log('');
  console.log('👉  Por favor ejecuta el SQL manualmente en el Supabase SQL Editor:');
  console.log(`    ${SUPABASE_URL.replace('.supabase.co', '')}/dashboard/project/_/sql`);
  console.log(`    Archivo: scripts/scrapers/streamate/migration_scraping_tables.sql\n`);
}
