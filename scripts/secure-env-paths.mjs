import path from 'node:path';

export const secureEnvMappings = [
  {
    label: 'root local',
    source: '.env',
    target: '.secure/root.env.local',
  },
  {
    label: 'root staging',
    source: '.env.staging',
    target: '.secure/root.staging.env.local',
  },
  {
    label: 'root production',
    source: '.env.production',
    target: '.secure/root.production.env.local',
  },
  {
    label: 'dashboard',
    source: 'apps/dashboard/.env',
    target: '.secure/dashboard.env.local',
  },
  {
    label: 'server',
    source: 'server/.env',
    target: '.secure/server.env.local',
  },
  {
    label: 'backend legacy',
    source: 'backend-legacy/.env',
    target: '.secure/backend-legacy.env.local',
  },
  {
    label: 'deploy',
    source: '.secure/deploy.env.local',
    target: '.secure/deploy.env.local',
  },
];

export const resolveProjectPath = (...parts) => path.resolve(process.cwd(), ...parts);
