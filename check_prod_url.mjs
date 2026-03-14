import { loadSupabaseProject } from './scripts/load-supabase-env.mjs';

const production = loadSupabaseProject('production');

console.log('Prod URL:', production.url);
console.log('Anon key available:', production.anonKey ? 'yes' : 'no');
console.log('Secret key available:', production.secretKey ? 'yes' : 'no');
console.log('Service role available:', production.serviceRoleKey ? 'yes' : 'no');
