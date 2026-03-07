import fs from 'fs';

async function run() {
  const envFile = fs.readFileSync('.env', 'utf8');
  let supabaseUrl = '';
  let supabaseKey = '';

  for (let line of envFile.split('\n')) {
    line = line.trim();
    if (line.startsWith('VITE_SUPABASE_URL') || line.startsWith('SUPABASE_URL')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY')) {
      supabaseKey = line.split('=')[1].trim();
    }
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
  }

  console.log("Fetching users...");
  const usersRes = await fetch(`${supabaseUrl}/rest/v1/users?select=auth_user_id,user_identification&user_identification=not.is.null`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });

  if (!usersRes.ok) {
    const errorText = await usersRes.text();
    console.error("Failed to fetch users:", errorText);
    process.exit(1);
  }

  const users = await usersRes.json();
  console.log(`Found ${users.length} users with identifications.`);

  let success = 0;
  let errors = 0;

  for (const user of users) {
    if (!user.auth_user_id) continue;

    const doc = String(user.user_identification).trim();
    if (doc.length >= 5) {
      const newPassword = doc.slice(-5);

      const updateRes = await fetch(`${supabaseUrl}/rest/v1/rpc/change_user_password`, {
        method: 'POST',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uid: user.auth_user_id, new_password: newPassword })
      });

      if (updateRes.ok) {
        console.log(`✅ Updated password for ${doc} to ${newPassword}`);

        // Also update the public.users table just in case
        await fetch(`${supabaseUrl}/rest/v1/users?auth_user_id=eq.${user.auth_user_id}`, {
          method: 'PATCH',
          headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_password: newPassword })
        });

        success++;
      } else {
        const errorText = await updateRes.text();
        console.error(`❌ Failed to update ${doc}:`, errorText);
        errors++;
      }
    }
  }

  console.log(`Finished. Success: ${success}. Errors: ${errors}.`);
}

run().catch(console.error);
