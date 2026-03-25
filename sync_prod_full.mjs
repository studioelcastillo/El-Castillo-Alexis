import { authAdminUpdateUserById, createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

// --- CONFIGURATION ---
const BATCH_SIZE = 500; // Faster sync

const supabase = createSupabaseAdminClient('production');

async function syncPasswords() {
  console.log("\n--- Syncing Passwords in PRODUCTION ---");
  let offset = 0;
  let totalProcessed = 0;
  let updatedCount = 0;

  while (true) {
    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, user_identification, auth_user_id')
      .range(offset, offset + BATCH_SIZE - 1)
      .order('user_id', { ascending: true });

    if (error) {
      console.error("Error fetching users:", error.message);
      break;
    }

    if (!users || users.length === 0) break;

    for (const user of users) {
      totalProcessed++;
      if (!user.auth_user_id) continue;

      const ident = String(user.user_identification || '').replace(/\D/g, '');
      if (!ident || ident.length < 6) continue;

      const newPassword = ident.slice(-6);

      // Update password via Auth Admin API
      try {
        await authAdminUpdateUserById('production', user.auth_user_id, { password: newPassword });
        updatedCount++;
      } catch (error) {
        console.error(`Error updating user ${user.user_id}:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.log(`Processed ${totalProcessed} users... (Updated ${updatedCount})`);
    offset += BATCH_SIZE;
  }

  console.log(`✅ Password sync complete! Total updated: ${updatedCount}`);
}

async function syncTerceros() {
  console.log("\n--- Syncing Terceros in PRODUCTION ---");
  
  // 1. Get bank accounts
  const { data: bankAccounts, error: baccErr } = await supabase
    .from('bank_accounts')
    .select('*');

  if (baccErr) {
    console.error("Error fetching bank accounts:", baccErr.message);
    return;
  }

  console.log(`Found ${bankAccounts.length} bank accounts. Processing...`);

  let addedCount = 0;
  for (const bacc of bankAccounts) {
    if (!bacc.bacc_owner_id || !bacc.bacc_owner_name) continue;

    const document = String(bacc.bacc_owner_id).trim();
    const name = String(bacc.bacc_owner_name).trim();

    // Upsert into terceros
    const { error: upsertErr } = await supabase
      .from('terceros')
      .upsert({
        tercero_identification: document,
        tercero_name: name,
        std_id: bacc.std_id || 1,
        // We could add more fields if needed
      }, { onConflict: 'tercero_identification' });

    if (upsertErr) {
      console.error(`Error upserting tercero ${document}:`, upsertErr.message);
    } else {
      addedCount++;
    }
  }

  console.log(`✅ Terceros sync complete! Total processed: ${addedCount}`);
}

async function main() {
  console.log("🚀 Starting Full Production Sync...");
  await syncPasswords();
  await syncTerceros();
  console.log("\n🎉 PRODUCTION SYNC FINISHED!");
}

main().catch(err => {
  console.error("Fatal error:", err.message);
});
