import { createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

// --- CONFIGURATION ---
const supabase = createSupabaseAdminClient('production');

async function syncTerceros() {
  console.log("\n--- Syncing Terceros in PRODUCTION (Corrected) ---");
  
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

    // Upsert into terceros using the correct field names
    const { error: upsertErr } = await supabase
      .from('terceros')
      .upsert({
        ter_identification: document,
        ter_name: name,
        ter_active: true
      }, { onConflict: 'ter_identification' });

    if (upsertErr) {
      console.error(`Error upserting tercero ${document}:`, upsertErr.message);
    } else {
      addedCount++;
    }
  }

  console.log(`✅ Terceros sync complete! Total processed: ${addedCount}`);
}

async function main() {
  await syncTerceros();
  console.log("\n🎉 PRODUCTION SYNC FINISHED!");
}

main().catch(err => {
  console.error("Fatal error:", err.message);
});
