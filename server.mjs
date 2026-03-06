import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname);
const distDir = process.env.DIST_DIR || path.join('dist', 'spa');
const distRoot = path.isAbsolute(distDir) ? distDir : path.join(root, distDir);

console.log('--- DIAGNOSTICS START ---');
console.log('Current Time:', new Date().toISOString());
console.log('Root directory:', root);
console.log('Distribution directory:', distRoot);

// Recursively find index.html to see where the build actually landed
function findIndexHtml(dir, depth = 0) {
  if (depth > 4) return null;
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const found = findIndexHtml(fullPath, depth + 1);
      if (found) return found;
    } else if (file === 'index.html') {
      return fullPath;
    }
  }
  return null;
}

const foundPath = findIndexHtml(root);
if (foundPath) {
  console.log('CRITICAL: Found index.html at:', foundPath);
} else {
  console.error('CRITICAL: index.html NOT FOUND in any subfolder of root!');
}

if (fs.existsSync(distRoot)) {
  console.log('Distribution directory EXISTS');
  try {
    const files = fs.readdirSync(distRoot);
    console.log('Files in distRoot:', files);
  } catch (e) {
    console.error('Error reading distRoot:', e.message);
  }
} else {
  console.error('Distribution directory DOES NOT EXIST at', distRoot);
  // List current directory to see what IS here
  console.log('Listing project root:', fs.readdirSync(root));
}
console.log('--- DIAGNOSTICS END ---');

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
  app.get('/', (req, res) => {
    console.log('Redirecting root to:', `/${basePath}/`);
    res.redirect(`/${basePath}/`);
  });

  // SPA routing for the subfolder
  app.get(`/${basePath}/*`, (req, res) => {
    const indexPath = path.join(distRoot, basePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error('SPA fallback failed: index.html not found at', indexPath);
      res.status(404).send('Dashboard files not found. Check server logs.');
    }
  });
} else {
  // SPA routing for the root
  app.get('*', (req, res) => {
    const indexPath = path.join(distRoot, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error('SPA fallback failed: index.html not found at', indexPath);
      res.status(404).send('Root files not found. Check server logs.');
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving static files from ${distRoot}`);
  if (basePath) {
    console.log(`Base path configured as /${basePath}/`);
  }
});
