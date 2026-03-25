const PROJECT_REF = 'pnnrsqocukixusmzrlhy';
const SECRET = process.env.SUPABASE_ACCESS_TOKEN || 'TU_SUPABASE_ACCESS_TOKEN';
const NEW_PASSWORD = process.env.NEW_PASSWORD || 'TU_PASSWORD_NUEVA';

async function resetPassword() {
  console.log(`Resetting PostgreSQL password for Staging (${PROJECT_REF}) via Management API (dedicated endpoint)...`);
  
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: NEW_PASSWORD })
    });

    console.log("Status:", res.status);
    const text = await res.text();
    
    if (res.ok) {
      console.log(`✅ SUCCESS: Staging Database Password has been reset to: ${NEW_PASSWORD}`);
    } else {
      console.log(`❌ FAILED:`, text);
    }
  } catch (e) {
    console.error("Error calling Management API:", e.message);
  }
}

resetPassword();
