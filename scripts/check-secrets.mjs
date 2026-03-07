import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

const ignoredDirs = new Set([
  '.git',
  'node_modules',
  'dist',
  'vendor',
  '.vite',
  '.github\\cache',
]);

const ignoredFiles = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.staging',
  '.env.tmp',
  'package-lock.json',
]);

const allowedSuffixes = new Set([
  '.md',
  '.txt',
  '.js',
  '.mjs',
  '.ts',
  '.tsx',
  '.json',
  '.yml',
  '.yaml',
  '.sql',
  '.example',
]);

const patterns = [
  {
    label: 'Supabase personal token',
    regex: /sbp_[A-Za-z0-9_-]{20,}/g,
  },
  {
    label: 'Supabase secret token',
    regex: /sb_secret_[A-Za-z0-9_-]{20,}/g,
  },
  {
    label: 'Supabase publishable token',
    regex: /sb_publishable_[A-Za-z0-9_-]{20,}/g,
  },
  {
    label: 'JWT service or anon key literal',
    regex: /(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ANON_KEY|VITE_SUPABASE_ANON_KEY|SUPABASE_SECRET_KEY)\s*[:=]\s*['"`]?eyJ[A-Za-z0-9._-]{20,}/g,
  },
  {
    label: 'Laravel APP_KEY literal',
    regex: /APP_KEY\s*=\s*base64:[A-Za-z0-9+/=]{20,}/g,
  },
  {
    label: 'Bearer token hardcoded',
    regex: /Authorization\s*[:=]\s*['"`]Bearer\s+(?!\$\{|\$[A-Z_])[A-Za-z0-9._-]{16,}/g,
  },
  {
    label: 'Inline password mention',
    regex: /(?:password|clave)\s+(?:temporal|legacy)?\s*[:=]?\s*["'`][^"'`\n]{6,}["'`]/gi,
  },
];

const shouldIgnorePath = (entryPath) => {
  const relative = path.relative(rootDir, entryPath);
  const parts = relative.split(path.sep);

  if (parts.some((part) => ignoredDirs.has(part))) {
    return true;
  }

  const base = path.basename(entryPath);
  if (ignoredFiles.has(base)) {
    return true;
  }

  if (base.startsWith('.env.') && !base.endsWith('.example')) {
    return true;
  }

  return false;
};

const shouldScanFile = (filePath) => {
  if (shouldIgnorePath(filePath)) return false;
  const base = path.basename(filePath);
  if (base === 'MEMORIA.md' || base === 'README.md') return true;
  return allowedSuffixes.has(path.extname(filePath)) || base.endsWith('.env.example');
};

const walk = (dir, fileList = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (shouldIgnorePath(fullPath)) continue;
    if (entry.isDirectory()) {
      walk(fullPath, fileList);
      continue;
    }
    if (shouldScanFile(fullPath)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
};

const files = walk(rootDir);
const findings = [];

for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      if (pattern.regex.test(line)) {
        findings.push({
          file: path.relative(rootDir, filePath),
          line: index + 1,
          label: pattern.label,
          sample: line.trim().slice(0, 180),
        });
      }
      pattern.regex.lastIndex = 0;
    }
  });
}

if (findings.length > 0) {
  console.error('Possible secret exposure detected:');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.label}] ${finding.sample}`);
  }
  process.exit(1);
}

console.log(`Secret scan passed (${files.length} files checked).`);
