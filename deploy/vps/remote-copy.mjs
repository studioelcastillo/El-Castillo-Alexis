import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const [, , host, username, password, localPath, remotePath] = process.argv;

if (!host || !username || !password || !localPath || !remotePath) {
  console.error('Usage: node deploy/vps/remote-copy.mjs <host> <username> <password> <localPath> <remotePath>');
  process.exit(1);
}

const resolvedLocalPath = path.resolve(localPath);

if (!fs.existsSync(resolvedLocalPath)) {
  console.error(`Local path not found: ${resolvedLocalPath}`);
  process.exit(1);
}

const conn = new Client();
const escapedRemotePath = remotePath.replace(/'/g, `'"'"'`);

conn
  .on('ready', () => {
    conn.exec(`cat > '${escapedRemotePath}'`, (error, stream) => {
      if (error) {
        console.error(error.message);
        conn.end();
        process.exit(1);
      }

      const readStream = fs.createReadStream(resolvedLocalPath);

      const handleError = (streamError) => {
        console.error(streamError.message);
        conn.end();
        process.exit(1);
      };

      readStream.on('error', handleError);
      stream.on('error', handleError);
      stream.stderr.on('data', (data) => process.stderr.write(data));
      stream.on('close', (code) => {
        if (code && code !== 0) {
          process.exit(code);
        }
        console.log(`Uploaded ${resolvedLocalPath} -> ${remotePath}`);
        conn.end();
      });

      readStream.pipe(stream);
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
