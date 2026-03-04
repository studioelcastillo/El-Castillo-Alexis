import { existsSync } from 'fs';
import { cp, mkdir, rm } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'apps', 'dashboard', 'dist');
const distDir = process.env.DIST_DIR || path.join('dist', 'spa');
const distRoot = path.isAbsolute(distDir) ? distDir : path.join(root, distDir);
const dest = path.join(distRoot, 'dashboard-app');

if (!existsSync(src)) {
  console.error(`Dashboard build not found at ${src}`);
  process.exit(1);
}

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });

console.log(`Copied dashboard build to ${dest}`);
