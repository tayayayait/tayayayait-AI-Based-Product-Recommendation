const CLIENT_ID = process.env.NAVER_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const PORT = process.env.PORT || '4000';
const ALLOW_ORIGIN = process.env.CORS_ALLOW_ORIGIN || '*';

const sendJson = (status, body) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  },
  body: JSON.stringify(body),
});

const stripHtml = (text = '') =>
  text.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

const mapToProduct = (item) => ({
  id: String(item.productId),
  name: stripHtml(item.title || ''),
  description: item.mallName || item.maker || '네이버 쇼핑 상품',
  price: Number(item.lprice) || 0,
  imageUrl: item.image,
  linkUrl: item.link,
  category: item.category1 || undefined,
});

const parseJsonBody = (body) => {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch (err) {
    return {};
  }
};

const analyzeArticleStub = (params = {}) => {
  const content = typeof params.content === 'string' ? params.content : '';
  const articleId = params.articleId || 'demo_article';
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
  return { matches };
};

export const handler = async (event) => {
  const basePath = '/.netlify/functions/proxy';
  const rawPath = event?.path || '';
  const route = rawPath.startsWith(basePath) ? rawPath.slice(basePath.length) : rawPath;
  const path = route === '' ? '/' : route;

  if (event?.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': ALLOW_ORIGIN,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      },
      body: '',
    };
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return sendJson(500, {
      error: 'NAVER_CLIENT_ID and NAVER_CLIENT_SECRET must be set in env',
      detail: 'Missing required credentials for proxy',
    });
  }

  if (event.httpMethod === 'GET' && (path === '/' || path === '/health')) {
    return sendJson(200, { ok: true, status: 'naver-proxy-ready', port: PORT });
  }

  if (event.httpMethod === 'GET' && path === '/products') {
    const q = (event.queryStringParameters?.q || '').trim();
    const displayRaw = parseInt(event.queryStringParameters?.display || '20', 10);
    const startRaw = parseInt(event.queryStringParameters?.start || '1', 10);
    const sort = event.queryStringParameters?.sort || 'sim';
    const display = Math.min(Math.max(displayRaw || 20, 1), 40);
    const start = Math.max(startRaw || 1, 1);

    if (!q) {
      return sendJson(400, { error: 'q parameter is required' });
    }

    const naverUrl = new URL('https://openapi.naver.com/v1/search/shop.json');
    naverUrl.searchParams.set('query', q);
    naverUrl.searchParams.set('display', String(display));
    naverUrl.searchParams.set('start', String(start));
    naverUrl.searchParams.set('sort', sort);

    try {
      const response = await fetch(naverUrl.toString(), {
        headers: {
          'X-Naver-Client-Id': CLIENT_ID,
          'X-Naver-Client-Secret': CLIENT_SECRET,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        return sendJson(response.status, {
          error: `Naver API error: ${message}`,
        });
      }

      const data = await response.json();
      const products = Array.isArray(data.items) ? data.items.map(mapToProduct) : [];
      return sendJson(200, {
        products,
        source: 'naver',
        total: data.total ?? products.length,
        display,
        start,
      });
    } catch (err) {
      return sendJson(500, {
        error: err instanceof Error ? err.message : 'Failed to fetch Naver API',
      });
    }
  }

  if (event.httpMethod === 'POST' && path === '/analysis/article') {
    const body = parseJsonBody(event.body);
    const result = analyzeArticleStub(body);
    return sendJson(200, result);
  }

  if (event.httpMethod === 'POST' && path === '/datalab/search-trend') {
    try {
      const response = await fetch('https://openapi.naver.com/v1/datalab/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Naver-Client-Id': CLIENT_ID,
          'X-Naver-Client-Secret': CLIENT_SECRET,
        },
        body: event.body,
      });

      if (!response.ok) {
        const text = await response.text();
        return sendJson(response.status, {
          error: `Naver Datalab error: ${text}`,
        });
      }

      const data = await response.json();
      return sendJson(200, data);
    } catch (err) {
      return sendJson(500, {
        error: err instanceof Error ? err.message : 'Failed to proxy datalab search',
      });
    }
  }

  if (event.httpMethod === 'POST' && path === '/datalab/shopping-insight') {
    try {
      const response = await fetch('https://openapi.naver.com/v1/datalab/shopping/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Naver-Client-Id': CLIENT_ID,
          'X-Naver-Client-Secret': CLIENT_SECRET,
        },
        body: event.body,
      });

      if (!response.ok) {
        const text = await response.text();
        return sendJson(response.status, {
          error: `Naver Shopping Insight error: ${text}`,
        });
      }

      const data = await response.json();
      return sendJson(200, data);
    } catch (err) {
      return sendJson(500, {
        error: err instanceof Error ? err.message : 'Failed to proxy shopping insight',
      });
    }
  }

  return sendJson(404, { error: 'Not found' });
};
