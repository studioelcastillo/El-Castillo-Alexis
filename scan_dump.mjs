import fs from 'fs';
import readline from 'readline';

const dumpPath = 'E:\\Documentos\\Desktop\\Aplicacion Castillo Alexis\\problemas\\castillo_prod_aws.sql.txt';

async function scanTables() {
  const fileStream = fs.createReadStream(dumpPath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const tables = new Set();
  const copyRegex = /^COPY public\.([a-zA-Z0-9_]+) \((.*?)\) FROM stdin;$/;

  for await (const line of rl) {
    const match = line.match(copyRegex);
    if (match) {
      const tableName = match[1];
      const columns = match[2];
      tables.add(tableName);
      console.log(`\nTable: ${tableName}`);
      console.log(`Columns: ${columns}`);
    }
  }

  console.log(`\nTotal tables found: ${tables.size}`);
  console.log(`Tables list: ${Array.from(tables).join(', ')}`);
}

scanTables();
