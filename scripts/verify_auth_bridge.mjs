import { createSupabaseAdminClient, createSupabaseAnonClient } from './load-supabase-env.mjs';
import axios from 'axios';

const TEST_EMAIL = '1108563423@legacy.elcastillo.local';
const TEMP_PASSWORD = process.env.TEMP_PASSWORD || 'TU_PASSWORD_TEMPORAL';
const TEST_AUTH_USER_ID = 'd9364779-a6c7-4d89-a1bc-a0fda318386a';

async function testBridge() {
  try {
    const admin = createSupabaseAdminClient('staging');
    const anon = createSupabaseAnonClient('staging');

    console.log(`[Test] Setting temp password for ${TEST_EMAIL}...`);
    const { data: userData, error: updateError } = await admin.auth.admin.updateUserById(
      TEST_AUTH_USER_ID, 
      { password: TEMP_PASSWORD }
    );

    if (updateError) throw updateError;

    console.log('[Test] Logging in to get JWT...');
    const { data: sessionData, error: loginError } = await anon.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEMP_PASSWORD,
    });

    if (loginError) throw loginError;

    const jwt = sessionData.session.access_token;
    console.log('[Test] JWT obtained.');

    console.log('[Test] Calling local backend (port 4106) with Supabase JWT...');
    // We use a route that is protected by auth:api
    const url = 'http://localhost:4106/api/user/permissions';
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/json'
      },
      validateStatus: () => true // Don't throw on 401
    });

    console.log('[Test] Response Status:', response.status);
    
    if (response.status === 200) {
      console.log('[Test] SUCCESS: Auth bridge is working! Backend recognized Supabase user.');
      // console.log('[Test] Data:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('[Test] FAILURE: Backend returned', response.status);
      console.log('[Test] Response Data:', JSON.stringify(response.data, null, 2));
    }
  } catch (e) {
    console.error('[Test] ERROR:', e.message);
    if (e.response) {
       console.error('[Test] API Response:', e.response.status, e.response.data);
    }
  } finally {
    process.exit(0);
  }
}

testBridge();
