import fs from 'fs';
import readline from 'readline';

const DUMP_PATH = process.env.AWS_DUMP_PATH || 'E:/Documentos/Downloads/castillo_prod_aws.sql.txt';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const START_AT = process.env.IMPORT_START_AT || '';
const ONLY_TABLES = String(process.env.IMPORT_ONLY_TABLES || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const BATCH_SIZE = Number(process.env.IMPORT_BATCH_SIZE || 500);
const sourceIdSets = new Map();

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY.');
  process.exit(1);
}

const normalizeEmail = (row) => {
  const personal = String(row.user_personal_email || '').trim().toLowerCase();
  if (personal.includes('@')) return personal;
  const ident = String(row.user_identification || '').trim();
  if (ident) return `${ident}@legacy.elcastillo.local`;
  return `user-${row.user_id}@legacy.elcastillo.local`;
};

const sourceHasId = (table, value) => {
  if (value === null || value === undefined || value === '') return false;
  const set = sourceIdSets.get(table);
  if (!set) return true;
  return set.has(String(value));
};

const TABLES = {
  categories: {
    source: 'categories',
    target: 'categories',
    pk: 'cate_id',
    map: (row) => row,
  },
  transactions_types: {
    source: 'transactions_types',
    target: 'transactions_types',
    pk: 'transtype_id',
    map: (row) => row,
  },
  periods: {
    source: 'periods',
    target: 'periods',
    pk: 'period_id',
    map: (row) => ({
      ...row,
      user_id: sourceHasId('users', row.user_id) ? row.user_id : null,
    }),
  },
  products: {
    source: 'products',
    target: 'products',
    pk: 'prod_id',
    map: (row) => row,
  },
  users: {
    source: 'users',
    target: 'users',
    pk: 'user_id',
    map: (row) => ({
      ...row,
      user_email: normalizeEmail(row),
      auth_user_id: null,
    }),
  },
  studios: {
    source: 'studios',
    target: 'studios',
    pk: 'std_id',
    map: (row) => ({
      ...row,
      user_id_owner: sourceHasId('users', row.user_id_owner) ? row.user_id_owner : null,
    }),
  },
  studios_accounts: {
    source: 'studios_accounts',
    target: 'studios_accounts',
    pk: 'stdacc_id',
    map: (row) => row,
  },
  studios_rooms: {
    source: 'studios_rooms',
    target: 'studios_rooms',
    pk: 'stdroom_id',
    map: (row) => ({ ...row, stdroom_active: true, stdroom_occupied: false }),
  },
  studios_shifts: {
    source: 'studios_shifts',
    target: 'studios_shifts',
    pk: 'stdshift_id',
    map: (row) => row,
  },
  studios_models: {
    source: 'studios_models',
    target: 'studios_models',
    pk: 'stdmod_id',
    map: (row) => row,
  },
  models_accounts: {
    source: 'models_accounts',
    target: 'models_accounts',
    pk: 'modacc_id',
    map: (row) => row,
  },
  models_streams_files: {
    source: 'models_streams_files',
    target: 'models_streams_files',
    pk: 'modstrfile_id',
    map: (row) => row,
  },
  models_streams: {
    source: 'models_streams',
    target: 'models_streams',
    pk: 'modstr_id',
    map: (row) => ({
      ...row,
      user_id: null,
    }),
  },
  models_streams_customers: {
    source: 'models_streams_customers',
    target: 'models_streams_customers',
    pk: 'modstrcus_id',
    map: (row) => row,
  },
  transactions: {
    source: 'transactions',
    target: 'transactions',
    pk: 'trans_id',
    map: (row) => row,
  },
  payments: {
    source: 'payments',
    target: 'payments',
    pk: 'pay_id',
    map: (row) => ({
      pay_id: row.pay_id,
      std_id: row.std_id,
      payfile_id: row.payfile_id,
      pay_amount: row.pay_amount,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
  },
  accounts: {
    source: 'accounting_accounts',
    target: 'accounts',
    pk: 'accacc_id',
    map: (row) => ({
      accacc_id: row.accacc_id,
      accacc_name: row.accacc_name,
      accacc_number: row.accacc_number,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
  },
  bank_accounts: {
    source: 'banks_accounts',
    target: 'bank_accounts',
    pk: 'bacc_id',
    map: (row) => ({
      bacc_id: row.bankacc_id,
      std_id: row.std_id,
      bacc_bank: row.bankacc_entity,
      bacc_type: row.bankacc_type,
      bacc_number: row.bankacc_number,
      bacc_owner_name: row.bankacc_beneficiary_name,
      bacc_owner_id: row.bankacc_beneficiary_document,
      bacc_active: row.deleted_at ? false : true,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
  },
  exchange_rates: {
    source: 'exchanges_rates',
    target: 'exchange_rates',
    pk: null,
    aggregate: true,
  },
  payment_files: {
    source: 'payment_files_joined',
    target: 'payment_files',
    pk: 'payf_id',
    aggregate: true,
  },
};

const IMPORT_ORDER = [
  'categories',
  'transactions_types',
  'periods',
  'products',
  'users',
  'studios',
  'studios_accounts',
  'studios_rooms',
  'studios_shifts',
  'studios_models',
  'models_accounts',
  'models_streams_files',
  'models_streams',
  'models_streams_customers',
  'transactions',
  'payments',
  'accounts',
  'bank_accounts',
  'exchange_rates',
  'payment_files',
];

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
    throw new Error(`${target}: ${response.status} ${await response.text()}`);
  }
}

async function buildSourceIdSet(sourceTable, idColumn) {
  const rl = readline.createInterface({
    input: fs.createReadStream(DUMP_PATH, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let active = false;
  let sourceColumns = [];
  const ids = new Set();

  for await (const line of rl) {
    if (!active) {
      const header = parseCopyHeader(line);
      if (header && header.sourceTable === sourceTable) {
        active = true;
        sourceColumns = header.columns;
      }
      continue;
    }

    if (line === '\\.') break;

    const rawValues = line.split('\t').map(decodeValue);
    const sourceRow = Object.fromEntries(sourceColumns.map((col, index) => [col, rawValues[index] ?? null]));
    if (sourceRow[idColumn] !== null && sourceRow[idColumn] !== undefined) {
      ids.add(String(sourceRow[idColumn]));
    }
  }

  sourceIdSets.set(sourceTable, ids);
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
      }
      continue;
    }

    if (line === '\\.') break;

    const rawValues = line.split('\t').map(decodeValue);
    const sourceRow = Object.fromEntries(sourceColumns.map((col, index) => [col, rawValues[index] ?? null]));
    batch.push(config.map(sourceRow));

    if (batch.length >= BATCH_SIZE) {
      await upsertRows(config.target, config.pk, batch);
      imported += batch.length;
      console.log(`${config.target}: ${imported} filas importadas`);
      batch = [];
    }
  }

  if (batch.length) {
    await upsertRows(config.target, config.pk, batch);
    imported += batch.length;
    console.log(`${config.target}: ${imported} filas importadas`);
  }
}

async function importExchangeRates() {
  const rl = readline.createInterface({
    input: fs.createReadStream(DUMP_PATH, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  let active = false;
  let sourceColumns = [];
  const byDate = new Map();

  for await (const line of rl) {
    if (!active) {
      const header = parseCopyHeader(line);
      if (header && header.sourceTable === 'exchanges_rates') {
        active = true;
        sourceColumns = header.columns;
      }
      continue;
    }
    if (line === '\\.') break;
    const rawValues = line.split('\t').map(decodeValue);
    const row = Object.fromEntries(sourceColumns.map((col, index) => [col, rawValues[index] ?? null]));
    if (row.deleted_at) continue;
    const current = byDate.get(row.exrate_date) || {
      exrate_date: row.exrate_date,
      exrate_usd: null,
      exrate_eur: null,
      exrate_cop: 1,
      created_at: row.created_at,
    };
    if (String(row.exrate_from).toUpperCase() === 'USD' && String(row.exrate_to).toUpperCase() === 'COP') current.exrate_usd = row.exrate_rate;
    if (String(row.exrate_from).toUpperCase() === 'EUR' && String(row.exrate_to).toUpperCase() === 'COP') current.exrate_eur = row.exrate_rate;
    byDate.set(row.exrate_date, current);
  }

  const rows = [...byDate.values()];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    await upsertRows('exchange_rates', null, chunk);
    console.log(`exchange_rates: ${Math.min(i + chunk.length, rows.length)} filas importadas`);
  }
}

async function importPaymentFiles() {
  const rl = readline.createInterface({
    input: fs.createReadStream(DUMP_PATH, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  let active = null;
  let sourceColumns = [];
  const files = new Map();
  const paymentsByFile = new Map();

  for await (const line of rl) {
    const header = parseCopyHeader(line);
    if (header) {
      if (header.sourceTable === 'payments_files' || header.sourceTable === 'payments') {
        active = header.sourceTable;
        sourceColumns = header.columns;
      } else {
        active = null;
      }
      continue;
    }
    if (!active) continue;
    if (line === '\\.') {
      active = null;
      continue;
    }
    const rawValues = line.split('\t').map(decodeValue);
    const row = Object.fromEntries(sourceColumns.map((col, index) => [col, rawValues[index] ?? null]));
    if (active === 'payments_files') {
      if (!row.deleted_at) files.set(row.payfile_id, row);
    } else if (active === 'payments') {
      if (!paymentsByFile.has(row.payfile_id)) paymentsByFile.set(row.payfile_id, row.pay_id);
    }
  }

  const rows = [...files.values()]
    .map((file) => ({
      payf_id: file.payfile_id,
      pay_id: paymentsByFile.get(file.payfile_id) || null,
      payf_name: file.payfile_description,
      payf_url: file.payfile_filename,
      payf_type: file.payfile_template,
      payf_total: file.payfile_total,
      created_at: file.created_at,
    }))
    .filter((row) => row.pay_id !== null);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    await upsertRows('payment_files', 'payf_id', chunk);
    console.log(`payment_files: ${Math.min(i + chunk.length, rows.length)} filas importadas`);
  }
}

async function run() {
  await buildSourceIdSet('users', 'user_id');

  const orderedTables = ONLY_TABLES.length
    ? IMPORT_ORDER.filter((table) => ONLY_TABLES.includes(table))
    : START_AT
      ? IMPORT_ORDER.slice(Math.max(IMPORT_ORDER.indexOf(START_AT), 0))
      : IMPORT_ORDER;

  for (const table of orderedTables) {
    console.log(`\n==> ${table}`);
    if (table === 'exchange_rates') {
      await importExchangeRates();
    } else if (table === 'payment_files') {
      await importPaymentFiles();
    } else {
      await importSimpleTable(TABLES[table]);
    }
  }
}

run().catch((error) => {
  console.error('Import failed:', error.message);
  process.exit(1);
});
