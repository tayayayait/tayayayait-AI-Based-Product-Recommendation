import http from 'node:http';
import { URL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { config as loadEnv } from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  loadEnv({ path: envPath });
} else {
  loadEnv();
}

const CLIENT_ID = process.env.NAVER_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const PORT = Number(process.env.PORT || 4000);
const ALLOW_ORIGIN = process.env.CORS_ALLOW_ORIGIN || '*';

if (!CLIENT_ID || !CLIENT_SECRET) {
  // eslint-disable-next-line no-console
  console.error('[naverProxy] NAVER_CLIENT_ID or NAVER_CLIENT_SECRET is missing in .env.local');
  process.exit(1);
}

const sendJson = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
};

const stripHtml = (text = '') => text.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

const mapToProduct = (item) => ({
  id: String(item.productId),
  name: stripHtml(item.title || ''),
  description: item.mallName || item.maker || '네이버 쇼핑 상품',
  price: Number(item.lprice) || 0,
  imageUrl: item.image,
  linkUrl: item.link,
  category: item.category1 || undefined,
});

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { ok: true, status: 'naver-proxy-ready' });
  }

  if (req.method === 'GET' && url.pathname === '/products') {
    const q = (url.searchParams.get('q') || '').trim();
    const displayRaw = parseInt(url.searchParams.get('display') || '20', 10);
    const startRaw = parseInt(url.searchParams.get('start') || '1', 10);
    const sort = url.searchParams.get('sort') || 'sim'; // sim | date | asc | dsc | pop

    const display = Math.min(Math.max(displayRaw || 20, 1), 40);
    const start = Math.max(startRaw || 1, 1);

    if (!q) {
      return sendJson(res, 400, { error: 'q parameter is required' });
    }

    const naverUrl = new URL('https://openapi.naver.com/v1/search/shop.json');
    naverUrl.searchParams.set('query', q);
    naverUrl.searchParams.set('display', String(display));
    naverUrl.searchParams.set('start', String(start));
    naverUrl.searchParams.set('sort', sort);

    try {
      const response = await fetch(naverUrl, {
        headers: {
          'X-Naver-Client-Id': CLIENT_ID,
          'X-Naver-Client-Secret': CLIENT_SECRET,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        return sendJson(res, response.status, { error: `Naver API error: ${message}` });
      }

      const data = await response.json();
      const products = Array.isArray(data.items) ? data.items.map(mapToProduct) : [];
      return sendJson(res, 200, {
        products,
        source: 'naver',
        total: data.total ?? products.length,
        display,
        start,
      });
    } catch (err) {
      return sendJson(res, 500, { error: err instanceof Error ? err.message : 'Failed to fetch Naver API' });
    }
  }

  // Stub: Article analysis (LLM 대체용 간이 매칭)
  if (req.method === 'POST' && url.pathname === '/analysis/article') {
    try {
      const body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => (data += chunk));
        req.on('end', () => {
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch (err) {
            reject(err);
          }
        });
      });

      const content = typeof body.content === 'string' ? body.content : '';
      const articleId = body.articleId || 'demo_article';
      const tokens = content
        .replace(/<[^>]*>/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1);
      const picks = Array.from(new Set(tokens)).slice(0, 5);
      const matches = picks.map((token, idx) => ({
        id: `m${idx + 1}`,
        articleId,
        productId: `p${idx + 1}`,
        matchedKeyword: token,
        contextSentence: content.slice(0, 120) || '추출된 키워드 기반 매칭',
        contextScore: Math.max(60, 95 - idx * 5),
        isApproved: true,
        reasonLabel: 'LLM stub',
      }));

      return sendJson(res, 200, { matches });
    } catch (err) {
      return sendJson(res, 500, { error: err instanceof Error ? err.message : 'Failed to analyze article' });
    }
  }

  // Proxy: Naver Datalab Search Trend
  if (req.method === 'POST' && url.pathname === '/datalab/search-trend') {
    try {
      const body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => (data += chunk));
        req.on('end', () => {
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch (err) {
            reject(err);
          }
        });
      });

      const response = await fetch('https://openapi.naver.com/v1/datalab/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Naver-Client-Id': CLIENT_ID,
          'X-Naver-Client-Secret': CLIENT_SECRET,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        return sendJson(res, response.status, { error: `Naver Datalab error: ${text}` });
      }

      const data = await response.json();
      return sendJson(res, 200, data);
    } catch (err) {
      return sendJson(res, 500, { error: err instanceof Error ? err.message : 'Failed to proxy datalab search' });
    }
  }

  // Proxy: Naver Datalab Shopping Insight (category)
  if (req.method === 'POST' && url.pathname === '/datalab/shopping-insight') {
    try {
      const body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => (data += chunk));
        req.on('end', () => {
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch (err) {
            reject(err);
          }
        });
      });

      const response = await fetch('https://openapi.naver.com/v1/datalab/shopping/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Naver-Client-Id': CLIENT_ID,
          'X-Naver-Client-Secret': CLIENT_SECRET,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        return sendJson(res, response.status, { error: `Naver Shopping Insight error: ${text}` });
      }

      const data = await response.json();
      return sendJson(res, 200, data);
    } catch (err) {
      return sendJson(res, 500, { error: err instanceof Error ? err.message : 'Failed to proxy shopping insight' });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[naverProxy] running on http://localhost:${PORT} (CORS: ${ALLOW_ORIGIN})`);
});
