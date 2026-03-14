import { authAdminListUsers, createSupabaseAdminClient } from './scripts/load-supabase-env.mjs';

const supabase = createSupabaseAdminClient('production');

async function checkConsistency() {
  console.log("--- Checking Auth Consistency in PRODUCTION ---");

  // Get all users from public.users (handling pagination)
  let publicUsers = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch, error: pubError } = await supabase
      .from('users')
      .select('user_id, auth_user_id, user_email, user_identification')
      .range(from, from + step - 1);

    if (pubError) {
      console.error("Error fetching public users batch:", pubError.message);
      return;
    }

    publicUsers = publicUsers.concat(batch);
    if (batch.length < step) {
      hasMore = false;
    } else {
      from += step;
    }
  }

  console.log(`Found ${publicUsers.length} users in public.users.`);

  // Get all users from auth.users (requires service role / admin API)
  let authUsers = [];
  try {
    let page = 1;
    const perPage = 1000;

    while (true) {
      const payload = await authAdminListUsers('production', { page, perPage });
      const batch = Array.isArray(payload?.users) ? payload.users : [];
      authUsers = authUsers.concat(batch);
      if (batch.length < perPage) {
        break;
      }
      page += 1;
    }
  } catch (error) {
    console.error('Error fetching auth users:', error instanceof Error ? error.message : String(error));
    return;
  }

  console.log(`Found ${authUsers.length} users in auth.users.`);

  const authUserIdsInPublic = new Set(publicUsers.map(u => u.auth_user_id).filter(id => id));
  const publicEmails = new Map(publicUsers.map(u => [u.user_email?.toLowerCase(), u]));
  const publicIdents = new Map(publicUsers.map(u => [String(u.user_identification || '').trim(), u]));

  const missingInPublicById = authUsers.filter(u => !authUserIdsInPublic.has(u.id));

  console.log(`\nFound ${missingInPublicById.length} auth users missing from public.users by ID:`);
  
  const potentiallyFixable = [];
  const totallyMissing = [];

  missingInPublicById.forEach(u => {
    // Try email match
    let publicRecord = publicEmails.get(u.email?.toLowerCase());

    // Try identification match (extract from email if legacy)
    if (!publicRecord && u.email?.includes('@legacy.elcastillo.local')) {
      const ident = u.email.split('@')[0];
      publicRecord = publicIdents.get(ident);
    }

    if (publicRecord) {
      potentiallyFixable.push({ authUser: u, publicUser: publicRecord });
    } else {
      totallyMissing.push(u);
    }
  });

  console.log(`\nPotentially fixable (Matching identification or email found in public.users but no auth_user_id link): ${potentiallyFixable.length}`);
  potentiallyFixable.forEach(p => {
    console.log(`- ${p.authUser.email}: Auth ID ${p.authUser.id} -> Public User ID ${p.publicUser.user_id} (Identification: ${p.publicUser.user_identification})`);
  });

  console.log(`\nTotally missing from public.users: ${totallyMissing.length}`);
  totallyMissing.forEach(u => {
    console.log(`- ${u.email}`);
  });

  // Check profiles table
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('*');

  if (profError) {
    console.error("Error fetching profiles:", profError.message);
  } else {
    console.log(`\nFound ${profiles.length} profiles in public.profiles:`);
    profiles.forEach(p => console.log(`- [${p.prof_id}] ${p.prof_name}`));
  }

  // Check a sample user from the consistent ones
  const consistent = authUsers.filter(u => authUserIdsInPublic.has(u.id));
  if (consistent.length > 0) {
    console.log(`\nTesting visibility for consistent users (as Service Role):`);
    for (const u of consistent.slice(0, 2)) {
      const { data: profile, error } = await supabase
        .from("users")
        .select("*, profiles(*)")
        .eq("auth_user_id", u.id)
        .single();
      
      if (error) {
        console.log(`- Error fetching profile for ${u.email}: ${error.message}`);
      } else {
        console.log(`- Successfully fetched profile for ${u.email}. Profile ID: ${profile.prof_id}`);
      }
    }
  }
}

checkConsistency();
