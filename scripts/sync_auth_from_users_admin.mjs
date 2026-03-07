const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const BATCH_SIZE = Number(process.env.SYNC_BATCH_SIZE || 100);
const MODE = process.env.SYNC_MODE || 'temporary-strong';
const RESET_EXISTING_PASSWORDS = String(process.env.SYNC_RESET_EXISTING_PASSWORDS || 'false').toLowerCase() === 'true';
const START_OFFSET = Math.max(0, Number(process.env.SYNC_START_OFFSET || 0));
const ONLY_USER_IDS = new Set(
  String(process.env.SYNC_ONLY_USER_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
);
const ONLY_IDENTIFICATIONS = new Set(
  String(process.env.SYNC_ONLY_IDENTIFICATIONS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY.');
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
};

const authUsersByEmail = new Map();

const normalizeEmail = (user) => {
  const email = String(user.user_email || '').trim().toLowerCase();
  if (email.includes('@')) return email;
  const ident = String(user.user_identification || '').trim();
  if (ident) return `${ident}@legacy.elcastillo.local`;
  return `user-${user.user_id}@legacy.elcastillo.local`;
};

const buildPassword = (user) => {
  const ident = String(user.user_identification || '').replace(/\D/g, '');
  if (!ident) return `temp${String(user.user_id).padStart(5, '0')}`;
  if (MODE === 'cedula-last5') {
    return ident.slice(-5);
  }
  if (MODE === 'temporary-strong') {
    return `Tmp!${String(user.user_id).padStart(5, '0')}_${ident.slice(-4)}`;
  }
  return ident;
};

const shouldProcessUser = (user) => {
  if (!ONLY_USER_IDS.size && !ONLY_IDENTIFICATIONS.size) {
    return true;
  }

  const userId = Number(user.user_id);
  const identification = String(user.user_identification || '').trim();

  return ONLY_USER_IDS.has(userId) || ONLY_IDENTIFICATIONS.has(identification);
};

async function fetchUsers(offset) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/users`);
  url.searchParams.set('select', 'user_id,user_identification,user_email,auth_user_id');
  url.searchParams.set('order', 'user_id.asc');

  const response = await fetch(url, {
    headers: {
      ...headers,
      Range: `${offset}-${offset + BATCH_SIZE - 1}`,
    },
  });

  if (!response.ok) {
    throw new Error(`fetch users failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function loadExistingAuthUsers() {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`load auth users failed: ${response.status} ${await response.text()}`);
    }

    const payload = await response.json();
    const users = Array.isArray(payload?.users) ? payload.users : [];
    if (!users.length) break;

    for (const user of users) {
      const email = String(user.email || '').trim().toLowerCase();
      if (email) authUsersByEmail.set(email, user.id);
    }

    if (users.length < perPage) break;
    page += 1;
  }
}

async function createAuthUser(user) {
  const payload = {
    email: normalizeEmail(user),
    password: buildPassword(user),
    email_confirm: true,
    user_metadata: {
      legacy_user_id: user.user_id,
      legacy_identification: user.user_identification,
    },
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
  };

  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`create auth user ${user.user_id} failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function updateAuthUser(authUserId, user) {
  const payload = {
    password: buildPassword(user),
    email_confirm: true,
    user_metadata: {
      legacy_user_id: user.user_id,
      legacy_identification: user.user_identification,
    },
  };

  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${authUserId}`, {
    method: 'PUT',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`update auth user ${user.user_id} failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function updatePublicUser(userId, authUserId, email) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/users`);
  url.searchParams.set('user_id', `eq.${userId}`);

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      auth_user_id: authUserId,
      user_email: email,
    }),
  });

  if (!response.ok) {
    throw new Error(`update public user ${userId} failed: ${response.status} ${await response.text()}`);
  }
}

async function run() {
  await loadExistingAuthUsers();

  let offset = START_OFFSET;
  let processed = 0;
  let created = 0;
  let skipped = 0;
  let linkedExisting = 0;
  let resetPasswords = 0;

  while (true) {
    const users = await fetchUsers(offset);
    if (!users.length) break;

    for (const user of users) {
      if (!shouldProcessUser(user)) {
        continue;
      }

      processed += 1;

      if (user.auth_user_id && !RESET_EXISTING_PASSWORDS) {
        skipped += 1;
        continue;
      }

      const email = normalizeEmail(user);
      const existingId = user.auth_user_id || authUsersByEmail.get(email);

      if (existingId) {
        if (RESET_EXISTING_PASSWORDS) {
          await updateAuthUser(existingId, { ...user, user_email: email });
          resetPasswords += 1;
        }
        await updatePublicUser(user.user_id, existingId, email);
        linkedExisting += 1;
      } else {
        const authUser = await createAuthUser({ ...user, user_email: email });
        authUsersByEmail.set(email, authUser.id);
        await updatePublicUser(user.user_id, authUser.id, email);
        created += 1;
      }

      if (processed % 50 === 0) {
        console.log(`created ${created} auth users, processed ${processed}`);
      }
    }

    offset += users.length;
  }

  console.log(JSON.stringify({ processed, created, skipped, linkedExisting, resetPasswords, mode: MODE, resetExisting: RESET_EXISTING_PASSWORDS }, null, 2));
}

run().catch((error) => {
  console.error('Sync failed:', error.message);
  process.exit(1);
});
