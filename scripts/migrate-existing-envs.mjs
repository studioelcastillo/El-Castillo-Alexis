import fs from 'node:fs';
import path from 'node:path';
import { secureEnvMappings, resolveProjectPath } from './secure-env-paths.mjs';

const force = process.argv.includes('--force');

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
  .map((entry) => ({ label: entry.label, ...copyIfNeeded(entry.source, entry.target) }));

for (const result of results) {
  console.log(`${result.status.toUpperCase()}: ${result.label} (${result.source} -> ${result.target})`);
}
