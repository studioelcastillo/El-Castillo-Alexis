const PROJECT_REF = 'pnnrsqocukixusmzrlhy';
const SECRET = process.env.SUPABASE_ACCESS_TOKEN || 'TU_SUPABASE_ACCESS_TOKEN';

async function testStagingManagement() {
  console.log(`Testing Management API SQL for Staging (${PROJECT_REF}) with found sbp_ token...`);
  
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'SELECT 1 as test' })
    });

    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
    
    if (res.ok) {
      console.log("✅ Management API access working for Staging!");
    } else {
      console.log("❌ Management API access failed.");
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

testStagingManagement();
