import { Client } from 'ssh2';

const [, , host, username, password, ...commandParts] = process.argv;

if (!host || !username || !password || commandParts.length === 0) {
  console.error('Usage: node deploy/vps/remote-exec.mjs <host> <username> <password> <command>');
  process.exit(1);
}

const command = commandParts.join(' ');
const conn = new Client();

conn
  .on('ready', () => {
    conn.exec(command, (error, stream) => {
      if (error) {
        console.error(error.message);
        conn.end();
        process.exit(1);
      }

      stream.on('close', (code) => {
        conn.end();
        process.exit(code ?? 0);
      });

      stream.on('data', (data) => process.stdout.write(data));
      stream.stderr.on('data', (data) => process.stderr.write(data));
    });
  })
  .on('error', (error) => {
    console.error(error.message);
    process.exit(1);
  })
  .connect({
    host,
    username,
    password,
    readyTimeout: 20000,
  });
