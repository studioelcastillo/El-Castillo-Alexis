import fs from 'node:fs';
import path from 'node:path';
import { secureEnvMappings, resolveProjectPath } from './secure-env-paths.mjs';

const force = process.argv.includes('--force');
const includeVersioned = process.argv.includes('--include-versioned');
const versionedSources = new Set(['.env.staging', '.env.production']);

const copyIfNeeded = (sourceRelative, targetRelative) => {
  const source = resolveProjectPath(sourceRelative);
  const target = resolveProjectPath(targetRelative);

  if (!fs.existsSync(source)) {
    return { status: 'missing', source: sourceRelative, target: targetRelative };
  }

  if (!force && fs.existsSync(target)) {
    return { status: 'skipped', source: sourceRelative, target: targetRelative };
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  return { status: 'copied', source: sourceRelative, target: targetRelative };
};

const results = secureEnvMappings
  .filter((entry) => entry.source !== entry.target)
  .filter((entry) => includeVersioned || !versionedSources.has(entry.source))
  .map((entry) => ({ label: entry.label, ...copyIfNeeded(entry.source, entry.target) }));

for (const result of results) {
  console.log(`${result.status.toUpperCase()}: ${result.label} (${result.source} -> ${result.target})`);
}

if (!includeVersioned) {
  for (const source of versionedSources) {
    console.log(`SKIPPED: versioned template (${source}) - use --include-versioned only when importing real secrets from an isolated machine.`);
  }
}
