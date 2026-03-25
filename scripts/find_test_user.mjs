import { authAdminListUsers } from './load-supabase-env.mjs';

async function run() {
  try {
    const users = await authAdminListUsers('staging', { perPage: 5 });
    console.log(JSON.stringify(users.users.map(u => ({ email: u.email, id: u.id })), null, 2));
  } catch (e) {
    console.error(e);
  }
}

run();
