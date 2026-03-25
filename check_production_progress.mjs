import { createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAdminClient('production');

async function checkProgress() {
  console.log("Checking Production progress...");
  const { data: users, error } = await supabase
    .from('users')
    .select('user_identification, user_password')
    .not('user_identification', 'is', null)
    .not('user_password', 'is', null);

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  let count6 = 0;
  let count5 = 0;
  let total = users.length;

  for (const user of users) {
    const ident = String(user.user_identification).trim();
    const pass = String(user.user_password).trim();
    
    if (ident.length >= 6 && pass === ident.slice(-6)) {
      count6++;
    } else if (ident.length >= 5 && pass === ident.slice(-5)) {
      count5++;
    }
  }

  console.log({
    total_with_data: total,
    with_6_digits: count6,
    with_5_digits: count5,
    others: total - count6 - count5
  });
}

checkProgress();
