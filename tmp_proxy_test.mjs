import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import axios from 'axios';

const app = express();
const target = 'https://terminado.livstre.com/api';

app.use('/api', createProxyMiddleware({
  target,
  changeOrigin: true,
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Proxy request for ${req.url} -> ${proxyRes.statusCode}`);
  }
}));

app.listen(3999, async () => {
  console.log('Test proxy listening on 3999');
  
  // Test 1: /api/api/v1/scraping/streamate/run
  try {
    const res = await axios.post('http://localhost:3999/api/api/v1/scraping/streamate/run', {});
    console.log('Test 1 (/api/api/v1):', res.status);
  } catch (e) {
    console.log('Test 1 failed:', e.response?.status || e.message);
  }

  // Test 2: /api/v1/scraping/streamate/run
  try {
    const res = await axios.post('http://localhost:3999/api/v1/scraping/streamate/run', {});
    console.log('Test 2 (/api/v1):', res.status);
  } catch (e) {
    console.log('Test 2 failed:', e.response?.status || e.message);
  }

  process.exit();
});
