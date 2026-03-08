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
const compatibilityDest = basePath ? null : path.join(distRoot, 'dashboard-app');
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

await rm(distRoot, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });

if (compatibilityDest && compatibilityDest !== dest) {
  await rm(compatibilityDest, { recursive: true, force: true });
  await mkdir(compatibilityDest, { recursive: true });
  await cp(src, compatibilityDest, { recursive: true });
}

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

    root /usr/share/nginx/html;

    location /assets/ {
        try_files $uri =404;
        access_log off;
        expires 1h;
        add_header Cache-Control "public";
    }

    # Root location handles base redirection if app is not at root
    location / {
        index index.html index.htm;
        ${basePath ? `rewrite ^/$ /${basePath}/ redirect;` : ''}
        try_files $uri $uri/ /${basePath ? `${basePath}/index.html` : 'index.html'};
    }


    ${basePath ? `
    location /${basePath}/assets/ {
        try_files $uri =404;
        access_log off;
        expires 1h;
        add_header Cache-Control "public";
    }

    # SPA routing for the subfolder
    location /${basePath}/ {
        index index.html index.htm;
        try_files $uri $uri/ /${basePath}/index.html;
    }
    ` : ''}
}
`;
await writeFile(path.join(distRoot, 'nginx.conf'), nginxConfig, 'utf8');

console.log(`Copied dashboard build to ${dest}`);
console.log(`Generated nginx.conf at ${path.join(distRoot, 'nginx.conf')}`);
