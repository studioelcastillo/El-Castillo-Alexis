const target = String(process.argv[2] || 'staging').toLowerCase();

const webhookEnv =
  target === 'production'
    ? 'EASYPANEL_PRODUCTION_WEBHOOK'
    : target === 'staging'
      ? 'EASYPANEL_STAGING_WEBHOOK'
      : null;

if (!webhookEnv) {
  console.error('Uso: node scripts/deploy.mjs staging|production');
  process.exit(1);
}

const url = process.env[webhookEnv];
if (!url) {
  console.error(`Falta la variable ${webhookEnv}.`);
  process.exit(1);
}

const response = await fetch(url, { method: 'POST' });
if (!response.ok) {
  const body = await response.text().catch(() => '');
  console.error(`Error al desplegar (${response.status}). ${body}`.trim());
  process.exit(1);
}

console.log(`Webhook legacy de Easypanel disparado: ${target}`);
