import fs from 'fs';
import readline from 'readline';
import path from 'path';

const dumpPath = path.join(process.cwd(), 'castillo_prod_aws.sql.txt');
const keys = ['monetization_token_value', 'license_clients', 'license_revenue_data'];

if (!fs.existsSync(dumpPath)) {
  console.error('Dump file not found:', dumpPath);
  process.exit(1);
}

const counts = new Map(keys.map((k) => [k, 0]));

const stream = fs.createReadStream(dumpPath, { encoding: 'utf8' });
const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

rl.on('line', (line) => {
  keys.forEach((key) => {
    if (line.includes(key)) {
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  });
});

rl.on('close', () => {
  keys.forEach((key) => {
    const count = counts.get(key) || 0;
    console.log(`${key}: ${count > 0 ? 'found' : 'not found'} (${count})`);
  });
});
