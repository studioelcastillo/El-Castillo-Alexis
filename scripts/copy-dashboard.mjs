import { existsSync } from 'fs';
import { cp, mkdir, readFile, rm, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'apps', 'dashboard', 'dist');
const distDir = process.env.DIST_DIR || path.join('dist', 'spa');
const distRoot = path.isAbsolute(distDir) ? distDir : path.join(root, distDir);
const normalizeBase = (value) => {
  const raw = String(value || '').trim();
  if (!raw || raw === '/') return '/';
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
};
const base = normalizeBase(process.env.VITE_DASHBOARD_BASE || process.env.DASHBOARD_APP_URL || '/');
const basePath = base === '/' ? '' : base.replace(/^\/+|\/+$/g, '');
const dest = basePath ? path.join(distRoot, basePath) : distRoot;
const htaccessPath = path.join(dest, '.htaccess');
const dashboardRewriteRule = [
  '  RewriteCond %{REQUEST_FILENAME} !-f',
  '  RewriteCond %{REQUEST_FILENAME} !-d',
  '  RewriteRule . index.html [L]',
].join('\n');

if (!existsSync(src)) {
  console.error(`Dashboard build not found at ${src}`);
  process.exit(1);
}

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });

if (existsSync(htaccessPath)) {
  const content = await readFile(htaccessPath, 'utf8');
  if (!content.includes('RewriteRule . index.html')) {
    let updated = content;
    if (content.includes('RewriteEngine On')) {
      updated = content.replace(
        /RewriteEngine On\s*/i,
        (match) => `${match}${dashboardRewriteRule}\n`
      );
    } else if (content.includes('<IfModule mod_rewrite.c>')) {
      updated = content.replace(
        /<IfModule mod_rewrite\.c>\s*/i,
        (match) => `${match}  RewriteEngine On\n${dashboardRewriteRule}\n`
      );
    } else {
      updated = `<IfModule mod_rewrite.c>\n  RewriteEngine On\n${dashboardRewriteRule}\n</IfModule>\n`;
    }
    await writeFile(htaccessPath, updated, 'utf8');
  }
} else {
  const initial = `<IfModule mod_rewrite.c>\n  RewriteEngine On\n${dashboardRewriteRule}\n</IfModule>\n`;
  await writeFile(htaccessPath, initial, 'utf8');
}

const nginxConfig = `server {
    listen 80;
    listen 3000;
    listen 3032;
    listen 3033;

    # Root location handles base redirection if app is not at root
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        ${basePath ? `rewrite ^/$ /${basePath}/ redirect;` : ''}
        try_files $uri $uri/ /${basePath ? `${basePath}/index.html` : 'index.html'};
    }


    ${basePath ? `
    # SPA routing for the subfolder
    location /${basePath}/ {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /${basePath}/index.html;
    }
    ` : ''}
}
`;
await writeFile(path.join(distRoot, 'nginx.conf'), nginxConfig, 'utf8');

console.log(`Copied dashboard build to ${dest}`);
console.log(`Generated nginx.conf at ${path.join(distRoot, 'nginx.conf')}`);
