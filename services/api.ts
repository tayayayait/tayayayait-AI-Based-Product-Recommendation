import { Match, Product, VideoMarker } from '../types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const API_BASE: string | undefined =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || undefined;
const OPENAI_API_KEY: string | undefined =
  typeof process !== 'undefined'
    ? (process as any).env?.API_KEY || (process as any).env?.OPENAI_API_KEY
    : undefined;
const OPENAI_MODEL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_OPENAI_MODEL) || 'gpt-4o-mini';

const hasApi = () => typeof API_BASE === 'string' && API_BASE.length > 0;

const productSeeds: Product[] = [
  {
    id: 'p-seed-1',
    name: '울 블렌드 더블 코트',
    brand: 'Contextual Studio',
    description: '가벼운 울 혼방으로 만든 더블브레스티드 코트',
    price: 189000,
    margin: 42000,
    imageUrl: 'https://picsum.photos/seed/coat/400/400',
    linkUrl: '#',
    category: '아우터',
    tags: ['겨울', '코트'],
    updatedAt: '2024-12-15',
    source: 'seed',
    shortformMatches: 6,
    articleMatches: 4,
    aiScore: 92,
    status: 'active',
    badges: ['주력']
  },
  {
    id: 'p-seed-2',
    name: '캐시미어 블렌드 니트',
    brand: 'Naver Select',
    description: '부드러운 촉감의 크루넥 니트웨어',
    price: 129000,
    margin: 32000,
    imageUrl: 'https://picsum.photos/seed/knit/400/400',
    linkUrl: '#',
    category: '니트',
    tags: ['베이직', '레이어드'],
    updatedAt: '2024-12-10',
    source: 'csv',
    shortformMatches: 3,
    articleMatches: 5,
    aiScore: 88,
    status: 'active'
  },
  {
    id: 'p-seed-3',
    name: '클래식 첼시 부츠',
    brand: 'Handmade Seoul',
    description: '천연 가죽으로 제작된 첼시 부츠',
    price: 259000,
    margin: 61000,
    imageUrl: 'https://picsum.photos/seed/boots/400/400',
    linkUrl: '#',
    category: '신발',
    tags: ['가죽', '포멀'],
    updatedAt: '2024-12-05',
    source: 'manual',
    shortformMatches: 2,
    articleMatches: 2,
    aiScore: 81,
    status: 'paused'
  },
  {
    id: 'p-seed-4',
    name: '테크 플리스 후디',
    brand: 'Contextual Studio',
    description: '가벼운 보온성의 플리스 후드 집업',
    price: 89000,
    margin: 18000,
    imageUrl: 'https://picsum.photos/seed/hoodie/400/400',
    linkUrl: '#',
    category: '캐주얼',
    tags: ['보온', '운동'],
    updatedAt: '2024-12-18',
    source: 'api',
    shortformMatches: 5,
    articleMatches: 3,
    aiScore: 86,
    status: 'active',
    rating: 4.5
  },
  {
    id: 'p-seed-5',
    name: '프리미엄 슬림 셔츠',
    brand: 'Naver Select',
    description: '스트레치 원단의 슬림 핏 셔츠',
    price: 69000,
    margin: 12000,
    imageUrl: 'https://picsum.photos/seed/shirt/400/400',
    linkUrl: '#',
    category: '셔츠',
    tags: ['오피스', '데일리'],
    updatedAt: '2024-12-12',
    source: 'seed',
    shortformMatches: 4,
    articleMatches: 1,
    aiScore: 79,
    status: 'active'
  },
  {
    id: 'p-seed-6',
    name: '라이트 패딩 베스트',
    brand: 'Contextual Studio',
    description: '도심형 레이어드에 맞춘 경량 패딩',
    price: 109000,
    margin: 26000,
    imageUrl: 'https://picsum.photos/seed/vest/400/400',
    linkUrl: '#',
    category: '아우터',
    tags: ['레이어드', '도심'],
    updatedAt: '2024-12-03',
    source: 'csv',
    shortformMatches: 1,
    articleMatches: 2,
    aiScore: 73,
    status: 'draft'
  },
  {
    id: 'p-seed-7',
    name: '러너 스니커즈',
    brand: 'Handmade Seoul',
    description: '레트로 러닝 실루엣의 스니커즈',
    price: 139000,
    margin: 24000,
    imageUrl: 'https://picsum.photos/seed/sneakers/400/400',
    linkUrl: '#',
    category: '신발',
    tags: ['레트로', '러닝'],
    updatedAt: '2024-12-08',
    source: 'manual',
    shortformMatches: 2,
    articleMatches: 3,
    aiScore: 77,
    status: 'active'
  },
  {
    id: 'p-seed-8',
    name: '미니멀 레더 백팩',
    brand: 'Contextual Studio',
    description: '데일리로 쓰기 좋은 미니멀 백팩',
    price: 159000,
    margin: 35000,
    imageUrl: 'https://picsum.photos/seed/backpack/400/400',
    linkUrl: '#',
    category: '가방',
    tags: ['데일리', '미니멀'],
    updatedAt: '2024-12-02',
    source: 'seed',
    shortformMatches: 0,
    articleMatches: 1,
    aiScore: 70,
    status: 'paused'
  }
];

const request = async <T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown } = {},
): Promise<T> => {
  if (!hasApi()) {
    throw new Error('API base URL is not configured');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }

  return (await res.json()) as T;
};

/**
 * Analyze article text via backend (LLM) or fall back to local mock.
 */
export const analyzeArticle = async (params: {
  title: string;
  content: string;
  articleId?: string;
  language?: string;
}): Promise<Match[]> => {
  const articleId = params.articleId ?? 'demo_article';

  if (hasApi()) {
    const data = await request<{ matches: Match[] }>('/analysis/article', {
      method: 'POST',
      body: {
        title: params.title,
        content: params.content,
        articleId,
        language: params.language ?? 'ko',
      },
    });
    return data.matches;
  }

  if (OPENAI_API_KEY) {
    try {
      const aiMatches = await analyzeArticleWithOpenAI({
        title: params.title,
        content: params.content,
        articleId,
      });
      if (aiMatches.length > 0) return aiMatches;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[openai:fallback]', err);
    }
  }

  return [];
};

/**
 * Analyze video timeline for brand/product markers.
 */
export const analyzeVideo = async (params: {
  contentId: string;
  videoUrl: string;
}): Promise<VideoMarker[]> => {
  if (hasApi()) {
    const data = await request<{ markers: VideoMarker[] }>('/analysis/video', {
      method: 'POST',
      body: {
        contentId: params.contentId,
        videoUrl: params.videoUrl,
      },
    });
    return data.markers;
  }

  return [];
};

/**
 * Persist approved matches to backend or log locally.
 */
export const saveApprovedMatches = async (articleId: string, matches: Match[]) => {
  if (hasApi()) {
    return request<{ saved: number }>('/matches', {
      method: 'POST',
      body: { articleId, matches },
    });
  }

  // eslint-disable-next-line no-console
  console.info('[mock] saveApprovedMatches', { articleId, matches });
  return { saved: matches.length };
};

/**
 * Fetch product catalog; falls back to in-memory seed.
 */
export const fetchProducts = async (
  query = '여름 셔츠',
  sort: 'sim' | 'date' | 'asc' | 'dsc' | 'pop' = 'sim',
): Promise<{ products: Product[]; source: 'api' | 'fallback' }> => {
  if (hasApi()) {
    const params = new URLSearchParams({ q: query, sort });
    const data = await request<{ products: Product[] }>(`/products?${params.toString()}`);
    return { products: data.products, source: 'api' };
  }
  const term = query.trim().toLowerCase();
  const filtered = term
    ? productSeeds.filter((p) => {
        const haystack = [p.name, p.description, p.category, p.brand, ...(p.tags ?? [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(term);
      })
    : productSeeds;

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'asc') return (a.price - b.price);
    if (sort === 'dsc') return (b.price - a.price);
    if (sort === 'date') {
      const ad = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const bd = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      return bd - ad;
    }
    // sim/pop: 우선 AI 점수 → 매칭 수 → 이름
    const aiDiff = (b.aiScore ?? 0) - (a.aiScore ?? 0);
    if (aiDiff !== 0) return aiDiff;
    const matchDiff =
      ((b.shortformMatches ?? 0) + (b.articleMatches ?? 0)) -
      ((a.shortformMatches ?? 0) + (a.articleMatches ?? 0));
    if (matchDiff !== 0) return matchDiff;
    return a.name.localeCompare(b.name);
  });

  return { products: sorted, source: 'fallback' };
};

export const createProduct = async (input: Omit<Product, 'id'>): Promise<Product> => {
  if (hasApi()) {
    const data = await request<{ product: Product }>('/products', {
      method: 'POST',
      body: input,
    });
    return data.product;
  }

  throw new Error('API base URL is not configured');
};

export const deleteProduct = async (id: string): Promise<{ deleted: boolean }> => {
  if (hasApi()) {
    await request(`/products/${id}`, { method: 'DELETE' });
    return { deleted: true };
  }
  throw new Error('API base URL is not configured');
};

export const fetchApprovedMatches = async (articleId: string): Promise<Match[]> => {
  if (hasApi()) {
    const data = await request<{ matches: Match[] }>(`/matches?articleId=${encodeURIComponent(articleId)}`);
    return data.matches;
  }
  // No persisted matches in fallback mode
  return [];
};

// Naver DataLab: search trend
export const fetchSearchTrends = async (body: Record<string, unknown>) => {
  const data = await request<unknown>('/datalab/search-trend', {
    method: 'POST',
    body,
  });
  return data as any;
};

// Naver DataLab: shopping insight (category)
export const fetchShoppingInsight = async (body: Record<string, unknown>) => {
  const data = await request<unknown>('/datalab/shopping-insight', {
    method: 'POST',
    body,
  });
  return data as any;
};

// ---- Internal helpers ----

const analyzeArticleWithOpenAI = async (params: { title: string; content: string; articleId: string }) => {
  if (!OPENAI_API_KEY) return [];

  const prompt = [
    'You are a content commerce match engine.',
    'Given an article, extract up to 5 keywords with context sentences and scores (0-100).',
    'Return JSON ONLY with an array field "matches", using this shape:',
    '{ "matches": [ { "id": "m1", "articleId": "<articleId>", "productId": "p1", "matchedKeyword": "string", "contextSentence": "string from the article", "contextScore": 0-100, "isApproved": false } ] }',
    'Do not include explanations.',
    'Article title:',
    params.title,
    'Article content:',
    params.content,
  ].join('\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'Return JSON only. Do not include prose.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? '';
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    const matches: Match[] = Array.isArray(parsed.matches) ? parsed.matches : [];
    return matches.map((m, idx) => ({
      ...m,
      id: m.id ?? `m${idx + 1}`,
      articleId: params.articleId,
      isApproved: false,
    }));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[openai:parse-error]', err);
    return [];
  }
};
