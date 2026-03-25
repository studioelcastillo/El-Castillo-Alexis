const PROJECT_REF = 'pnnrsqocukixusmzrlhy';
const SECRET = process.env.SUPABASE_ACCESS_TOKEN || 'TU_SUPABASE_ACCESS_TOKEN';

async function getProjectConfig() {
  console.log(`Getting project config for Staging (${PROJECT_REF})...`);
  
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/database`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Config:", JSON.stringify(data, null, 2));
    
  } catch (e) {
    console.error("Error:", e.message);
  }
}

getProjectConfig();
