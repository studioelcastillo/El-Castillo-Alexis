import http from 'node:http';
import { URL } from 'node:url';

const apiKey = process.env.GEMINI_API_KEY;
const host = process.env.GEMINI_PROXY_HOST || '127.0.0.1';
const port = Number(process.env.GEMINI_PROXY_PORT || process.env.PORT || 8787);
const maxBodyBytes = 1_000_000;

if (!apiKey) {
  console.error('Missing GEMINI_API_KEY. Set it in the server environment.');
  process.exit(1);
}

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > maxBodyBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { status: 'ok' });
  }

  if (req.method === 'POST' && url.pathname === '/api/gemini') {
    let body;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      const message = error?.message === 'Payload too large'
        ? 'Payload too large'
        : 'Invalid JSON body';
      return sendJson(res, error?.message === 'Payload too large' ? 413 : 400, { error: message });
    }

    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) {
      return sendJson(res, 400, { error: 'Missing prompt' });
    }

    const model = typeof body.model === 'string' && body.model.trim()
      ? body.model.trim()
      : 'gemini-1.5-flash';
    const temperature = Number.isFinite(body.temperature) ? body.temperature : 0.7;
    const maxOutputTokens = Number.isFinite(body.maxOutputTokens) ? body.maxOutputTokens : 1024;

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens,
          },
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        return sendJson(res, response.status, {
          error: 'Gemini API error',
          details: result || await response.text().catch(() => 'Unknown error'),
        });
      }

      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const includeRaw = Boolean(body.includeRaw);
      return sendJson(res, 200, includeRaw ? { text, raw: result } : { text });
    } catch (error) {
      return sendJson(res, 500, { error: 'Failed to reach Gemini API' });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(port, host, () => {
  console.log(`Gemini proxy listening on http://${host}:${port}`);
});
