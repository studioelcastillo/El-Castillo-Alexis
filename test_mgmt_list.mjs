import fetch from 'node-fetch';
import { loadSupabaseProject } from './scripts/load-supabase-env.mjs';

async function listProjects() {
  const envs = ['staging', 'production'];

  for (const envName of envs) {
    const project = loadSupabaseProject(envName);
    const secret = project.secretKey;

    if (!secret) {
      console.log(`⚠️ Skip ${envName}: SUPABASE_SECRET_KEY no encontrada.`);
      continue;
    }

    console.log(`Checking Management API for ${project.label} secret: ${secret.substring(0, 15)}...`);
    try {
      const response = await fetch('https://api.supabase.com/v1/projects', {
        headers: { 'Authorization': `Bearer ${secret}` }
      });

      if (response.ok) {
        const projects = await response.json();
        console.log(`✅ SUCCESS! Found ${projects.length} projects:`);
        console.log(JSON.stringify(projects, null, 2));
      } else {
        const text = await response.text();
        console.log(`❌ Failed: ${response.status} ${response.statusText} - ${text}`);
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }
}

listProjects();
