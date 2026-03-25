import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const secureDir = 'e:/Documentos/Desktop/Aplicacion Castillo Alexis/software el castillo/.secure';
const keyPath = path.join(secureDir, 'vps.private.key');
const pubPath = path.join(secureDir, 'vps.public.key');

// Remove old files if they exist
if (fs.existsSync(keyPath)) fs.unlinkSync(keyPath);
if (fs.existsSync(pubPath)) fs.unlinkSync(pubPath);

console.log("Generating new SSH key without passphrase using Node...");
try {
    // We use -N '' (empty string) and -q (quiet)
    // In child_process, we can pass it as an array to avoid shell issues
    execSync(`ssh-keygen -t ed25519 -f "${keyPath}" -N "" -q`, { stdio: 'inherit' });
    console.log("Key generated successfully.");
} catch (e) {
    console.error("Error generating key:", e.message);
}
