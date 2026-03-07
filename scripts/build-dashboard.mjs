import { spawn } from 'child_process';

const extraHeap = '--max-old-space-size=4096';
const existingNodeOptions = String(process.env.NODE_OPTIONS || '').trim();
const nodeOptions = existingNodeOptions.includes(extraHeap)
  ? existingNodeOptions
  : [existingNodeOptions, extraHeap].filter(Boolean).join(' ');

const viteArgs = [
  'node_modules/vite/bin/vite.js',
  'build',
  '--config',
  'apps/dashboard/vite.config.ts',
  'apps/dashboard',
];

const child = spawn(process.execPath, viteArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
