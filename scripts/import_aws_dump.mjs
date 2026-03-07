import fs from 'fs';
import readline from 'readline';
import { Client } from 'pg';

const DUMP_PATH = process.env.AWS_DUMP_PATH || 'castillo_prod_aws.sql.txt';
const connectionString = process.env.SUPABASE_DB_CONNECTION;
const START_AT = process.env.IMPORT_START_AT || '';
const ONLY_TABLES = String(process.env.IMPORT_ONLY_TABLES || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (!connectionString) {
  console.error('Missing SUPABASE_DB_CONNECTION.');
  process.exit(1);
}

const TABLES = {
  categories: {
    target: 'categories',
    columns: ['cate_id', 'cate_name', 'created_at', 'updated_at', 'deleted_at'],
    pk: 'cate_id',
  },
  transactions_types: {
    target: 'transactions_types',
    columns: ['transtype_id', 'transtype_group', 'transtype_name', 'transtype_behavior', 'transtype_rtefte', 'created_at', 'updated_at', 'deleted_at', 'transtype_value'],
    pk: 'transtype_id',
  },
  periods: {
    target: 'periods',
    columns: ['period_id', 'period_start_date', 'period_end_date', 'period_closed_date', 'created_at', 'updated_at', 'period_state', 'user_id', 'period_observation', 'liquidated_at'],
    pk: 'period_id',
  },
  products: {
    target: 'products',
    columns: ['prod_id', 'cate_id', 'prod_code', 'prod_name', 'created_at', 'updated_at', 'deleted_at', 'prod_purchase_price', 'prod_wholesaler_price', 'prod_sale_price', 'prod_stock', 'transtype_id'],
    pk: 'prod_id',
  },
  users: {
    target: 'users',
    columns: ['user_id', 'user_identification', 'user_name', 'user_surname', 'user_email', 'user_password', 'user_token_recovery_password', 'prof_id', 'user_sex', 'user_telephone', 'user_address', 'user_image', 'user_active', 'user_last_login', 'email_verified_at', 'remember_token', 'created_at', 'updated_at', 'deleted_at', 'user_birthdate', 'user_bank_entity', 'user_bank_account', 'user_bank_account_type', 'user_document_type', 'user_beneficiary_name', 'user_beneficiary_document', 'user_beneficiary_document_type', 'user_identification_type', 'user_name2', 'user_surname2', 'city_id', 'user_rh', 'user_model_category', 'user_personal_email', 'user_issued_in'],
    pk: 'user_id',
  },
  studios: {
    target: 'studios',
    columns: ['std_id', 'std_nit', 'std_name', 'std_shifts', 'std_percent', 'std_liquidation_interval', 'created_at', 'updated_at', 'deleted_at', 'std_image', 'std_bank_entity', 'std_bank_account', 'std_bank_account_type', 'std_ally', 'std_ally_master_pays', 'std_active', 'std_discountstudio_eur', 'std_discountstudio_usd', 'std_discountmodel_eur', 'std_discountmodel_usd', 'user_id_owner', 'std_rtefte', 'city_id', 'std_stdacc', 'std_verification_digit', 'std_manager_name', 'std_manager_id', 'std_manager_phone', 'std_company_name', 'std_principal', 'payroll_liquidation_interval', 'payroll_auto_generate', 'std_address', 'std_dispenser'],
    pk: 'std_id',
  },
  studios_accounts: {
    target: 'studios_accounts',
    columns: ['stdacc_id', 'std_id', 'stdacc_app', 'stdacc_username', 'stdacc_password', 'stdacc_apikey', 'stdacc_active', 'stdacc_last_search_at', 'stdacc_last_result_at', 'stdacc_fail_message', 'stdacc_fail_count', 'created_at', 'updated_at', 'deleted_at'],
    pk: 'stdacc_id',
  },
  studios_rooms: {
    target: 'studios_rooms',
    columns: ['stdroom_id', 'std_id', 'stdroom_name', 'created_at', 'updated_at', 'deleted_at', 'stdroom_consecutive'],
    pk: 'stdroom_id',
  },
  studios_shifts: {
    target: 'studios_shifts',
    columns: ['stdshift_id', 'std_id', 'stdshift_name', 'stdshift_begin_time', 'stdshift_finish_time', 'stdshift_capacity', 'created_at', 'updated_at', 'deleted_at'],
    pk: 'stdshift_id',
  },
  studios_models: {
    target: 'studios_models',
    columns: ['stdmod_id', 'std_id', 'stdroom_id', 'user_id_model', 'stdmod_start_at', 'stdmod_finish_at', 'stdmod_active', 'stdmod_percent', 'stdmod_rtefte', 'created_at', 'updated_at', 'deleted_at', 'stdshift_id', 'stdmod_commission_type', 'stdmod_goal', 'modgoal_reach_goal', 'stdmod_contract_type', 'stdmod_contract_number', 'city_id', 'stdmod_monthly_salary', 'stdmod_biweekly_salary', 'stdmod_daily_salary', 'stdmod_dotacion_amount', 'stdmod_has_sena', 'stdmod_has_caja_compensacion', 'stdmod_has_icbf', 'stdmod_arl_risk_level', 'stdmod_position', 'stdmod_area'],
    pk: 'stdmod_id',
  },
  models_accounts: {
    target: 'models_accounts',
    columns: ['modacc_id', 'stdmod_id', 'modacc_app', 'modacc_username', 'modacc_password', 'modacc_state', 'modacc_active', 'created_at', 'updated_at', 'deleted_at', 'modacc_last_search_at', 'modacc_last_result_at', 'modacc_fail_message', 'modacc_fail_count', 'modacc_payment_username', 'modacc_mail', 'modacc_linkacc', 'last_activation_at', 'modacc_screen_name', 'modacc_earnings_rtefte'],
    pk: 'modacc_id',
  },
  models_streams_files: {
    target: 'models_streams_files',
    columns: ['modstrfile_id', 'modstrfile_description', 'modstrfile_filename', 'modstrfile_template', 'created_by', 'created_at', 'updated_at', 'deleted_at'],
    pk: 'modstrfile_id',
  },
  models_streams: {
    target: 'models_streams',
    columns: ['modstr_id', 'modacc_id', 'modstr_date', 'modstr_period', 'modstr_start_at', 'modstr_finish_at', 'modstr_price', 'modstr_earnings_value', 'modstr_earnings_trm', 'modstr_earnings_percent', 'modstr_earnings_tokens', 'modstr_earnings_tokens_rate', 'modstr_earnings_usd', 'modstr_earnings_eur', 'modstr_earnings_cop', 'modstr_time', 'created_at', 'updated_at', 'deleted_at', 'modstrfile_id', 'modstr_earnings_trm_studio', 'modstr_earnings_percent_studio', 'modstr_earnings_cop_studio', 'modstr_source', 'period_id', 'stdmod_id', 'std_id', 'stdacc_id', 'modstr_addon', 'modstr_rtefte_model', 'modstr_rtefte_studio'],
    pk: 'modstr_id',
  },
  models_streams_customers: {
    target: 'models_streams_customers',
    columns: ['modstrcus_id', 'modstr_id', 'modstrcus_name', 'modstrcus_account', 'modstrcus_website', 'modstrcus_product', 'modstrcus_price', 'modstrcus_earnings', 'modstrcus_received_at', 'modstrcus_chat_duration', 'created_at', 'updated_at', 'deleted_at'],
    pk: 'modstrcus_id',
  },
  transactions: {
    target: 'transactions',
    columns: ['trans_id', 'transtype_id', 'user_id', 'prod_id', 'trans_date', 'trans_description', 'trans_amount', 'trans_quantity', 'trans_rtefte', 'created_at', 'updated_at', 'deleted_at', 'stdmod_id', 'trans_pendingbalance', 'trans_pendingbalance_unchanged_times', 'period_id', 'payroll_period_id'],
    pk: 'trans_id',
  },
  payments: {
    target: 'payments',
    columns: ['pay_id', 'std_id', 'payfile_id', 'pay_amount', 'created_at', 'updated_at'],
    pk: 'pay_id',
    transform: (row) => ({
      pay_id: row.pay_id,
      std_id: row.std_id,
      payfile_id: row.payfile_id,
      pay_amount: row.pay_amount,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
  },
  accounting_accounts: {
    target: 'accounting_accounts',
    columns: ['accacc_id', 'accacc_code', 'accacc_name', 'accacc_number', 'created_at', 'updated_at'],
    pk: null,
  },
  banks_accounts: {
    target: 'banks_accounts',
    columns: ['bankacc_id', 'std_id', 'bankacc_entity', 'bankacc_number', 'bankacc_type', 'bankacc_main', 'created_at', 'updated_at', 'deleted_at', 'bankacc_beneficiary_name', 'bankacc_beneficiary_document', 'bankacc_beneficiary_document_type'],
    pk: null,
  },
  exchanges_rates: {
    target: 'exchanges_rates',
    columns: ['exrate_id', 'exrate_date', 'exrate_from', 'exrate_to', 'exrate_rate', 'exrate_type', 'created_at', 'updated_at', 'deleted_at'],
    pk: null,
  },
  payments_files: {
    target: 'payments_files',
    columns: ['payfile_id', 'payfile_description', 'payfile_filename', 'payfile_template', 'payfile_total', 'created_by', 'created_at', 'updated_at', 'deleted_at'],
    pk: null,
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
  'accounting_accounts',
  'banks_accounts',
  'exchanges_rates',
  'payments_files',
];

const BATCH_SIZE = 250;

const parseCopyHeader = (line) => {
  const match = line.match(/^COPY public\.([^(\s]+) \((.+)\) FROM stdin;$/);
  if (!match) return null;
  return {
    sourceTable: match[1],
    columns: match[2].split(',').map((col) => col.trim()),
  };
};

const decodeValue = (value) => {
  if (value === '\\N') return null;
  return value
    .replace(/\\t/g, '\t')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\\\/g, '\\');
};

const buildInsert = (tableConfig, rows) => {
  const cols = tableConfig.columns;
  const values = [];
  const placeholders = rows.map((row, rowIndex) => {
    const marks = cols.map((col, colIndex) => {
      values.push(row[col] ?? null);
      return `$${rowIndex * cols.length + colIndex + 1}`;
    });
    return `(${marks.join(', ')})`;
  });

  const updateClause = tableConfig.pk
    ? (() => {
        const updateCols = cols.filter((col) => col !== tableConfig.pk);
        return updateCols.length
          ? `ON CONFLICT (${tableConfig.pk}) DO UPDATE SET ${updateCols.map((col) => `${col} = EXCLUDED.${col}`).join(', ')}`
          : `ON CONFLICT (${tableConfig.pk}) DO NOTHING`;
      })()
    : '';

  return {
    sql: `INSERT INTO public.${tableConfig.target} (${cols.join(', ')}) VALUES ${placeholders.join(', ')} ${updateClause}`.trim(),
    values,
  };
};

const setSequence = async (client, tableConfig) => {
  if (!tableConfig.pk) return;
  const seqQuery = `SELECT pg_get_serial_sequence('public.${tableConfig.target}', '${tableConfig.pk}') AS seq`;
  const seqRes = await client.query(seqQuery);
  const seq = seqRes.rows[0]?.seq;
  if (!seq) return;
  await client.query(`SELECT setval($1, COALESCE((SELECT MAX(${tableConfig.pk}) FROM public.${tableConfig.target}), 1), true)`, [seq]);
};

async function importTable(client, sourceTable) {
  const config = TABLES[sourceTable];
  const sourcePath = DUMP_PATH;
  const rl = readline.createInterface({
    input: fs.createReadStream(sourcePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let active = false;
  let sourceColumns = [];
  let batch = [];
  let imported = 0;

  const flush = async () => {
    if (!batch.length) return;
    const { sql, values } = buildInsert(config, batch);
    await client.query(sql, values);
    imported += batch.length;
    batch = [];
    console.log(`${sourceTable}: ${imported} filas importadas`);
  };

  for await (const line of rl) {
    if (!active) {
      const header = parseCopyHeader(line);
      if (header && header.sourceTable === sourceTable) {
        active = true;
        sourceColumns = header.columns;
      }
      continue;
    }

    if (line === '\\.') {
      await flush();
      rl.close();
      break;
    }

    const rawValues = line.split('\t').map(decodeValue);
    const sourceRow = Object.fromEntries(sourceColumns.map((col, index) => [col, rawValues[index] ?? null]));
    const row = config.transform ? config.transform(sourceRow) : Object.fromEntries(config.columns.map((col) => [col, sourceRow[col] ?? null]));
    batch.push(row);
    if (batch.length >= BATCH_SIZE) {
      await flush();
    }
  }

  await setSequence(client, config);
  return imported;
}

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query("SET session_replication_role = replica");
    console.log(`Importando dump desde ${DUMP_PATH}`);
    const orderedTables = ONLY_TABLES.length
      ? IMPORT_ORDER.filter((table) => ONLY_TABLES.includes(table))
      : START_AT
        ? IMPORT_ORDER.slice(Math.max(IMPORT_ORDER.indexOf(START_AT), 0))
        : IMPORT_ORDER;

    for (const table of orderedTables) {
      console.log(`\n==> ${table}`);
      await importTable(client, table);
    }

    console.log('\nEjecutando alineacion legacy -> esquema actual...');
    const legacySql = fs.readFileSync('supabase/legacy_aws_alignment.sql', 'utf8');
    await client.query(legacySql);
    console.log('Alineacion completada.');
  } finally {
    await client.query("SET session_replication_role = origin").catch(() => {});
    await client.end();
  }
}

run().catch((error) => {
  console.error('Import failed:', error.message);
  process.exit(1);
});
