import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname);
const distDir = process.env.DIST_DIR || path.join('dist', 'spa');
const distRoot = path.isAbsolute(distDir) ? distDir : path.join(root, distDir);

console.log('--- DIAGNOSTICS ---');
console.log('Root directory:', root);
console.log('Distribution directory:', distRoot);
if (fs.existsSync(distRoot)) {
  console.log('Distribution directory EXISTS');
  try {
    const files = fs.readdirSync(distRoot);
    console.log('Files in distRoot:', files);
  } catch (e) {
    console.error('Error reading distRoot:', e.message);
  }
} else {
  console.error('Distribution directory DOES NOT EXIST');
}
console.log('-------------------');

const normalizeBase = (value) => {
  const raw = String(value || '').trim();
  if (!raw || raw === '/') return '/';
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
};

const base = normalizeBase(process.env.VITE_DASHBOARD_BASE || process.env.DASHBOARD_APP_URL || '/dashboard-app/');
const basePath = base === '/' ? '' : base.replace(/^\/+|\/+$/g, '');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory
app.use(express.static(distRoot));

// Root redirect to the dashboard base path
if (basePath) {
  app.get('/', (req, res) => res.redirect(`/${basePath}/`));

  // SPA routing for the subfolder
  app.get(`/${basePath}/*`, (req, res) => {
    res.sendFile(path.join(distRoot, basePath, 'index.html'));
  });
} else {
  // SPA routing for the root
  app.get('*', (req, res) => {
    res.sendFile(path.join(distRoot, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving static files from ${distRoot}`);
  if (basePath) {
    console.log(`Base path configured as /${basePath}/`);
  }
});
