import https from 'https';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const apikey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !apikey) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const url = new URL('/rest/v1/', supabaseUrl);

const options = {
  hostname: url.hostname,
  port: Number(url.port || 443),
  path: url.pathname,
  method: 'GET',
  headers: {
    apikey,
  }
};

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  res.on('data', (d) => {
    // process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error(e);
});
req.end();
