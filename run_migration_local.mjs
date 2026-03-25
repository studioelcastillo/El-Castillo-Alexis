import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Load .env from the root of studiocore-erp
const envPath = path.resolve('studiocore-erp/.env');
console.log(`Loading env from ${envPath}...`);

const envContent = fs.readFileSync(envPath, 'utf8');
const env = { ...process.env };

for (const line of envContent.split('\n')) {
  const [key, ...valueParts] = line.trim().split('=');
  const value = valueParts.join('=');
  if (key && value) {
    env[key] = value.replace(/^['"]|['"]$/g, '');
  }
}

const scriptPath = process.argv[2] || 'studiocore-erp/apps/api/dist/database/migrate-legacy-person-documents.js';
console.log(`Environment loaded. Running migration: ${scriptPath}...`);

const child = spawn('node', [scriptPath], {
  env,
  stdio: 'inherit'
});


child.on('close', (code) => {
  console.log(`Migration child process exited with code ${code}`);
  process.exit(code);
});
