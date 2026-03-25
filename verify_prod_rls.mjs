import { createSupabaseAnonClient } from './scripts/load-supabase-env.mjs';

const identifier = String(process.env.TEST_IDENTIFIER || '').trim();
const supabase = createSupabaseAnonClient('production');

async function verifyRLS() {
  console.log("Verifying Anonymous RLS Lookup in PRODUCTION...");
  if (!identifier) {
    console.error('Define TEST_IDENTIFIER antes de ejecutar este script.');
    return;
  }
  // Try to look up a user by identification
  const { data, error } = await supabase
    .from('users')
    .select('user_email')
    .eq('user_identification', identifier)
    .maybeSingle();

  if (error) {
    console.error("❌ RLS Verification FAILED:", error.message);
  } else if (data) {
    console.log("✅ RLS Verification SUCCESS! Found user email:", data.user_email);
  } else {
    console.log("⚠️ RLS seems open, but no user was found with that ID.");
  }
}

verifyRLS();
