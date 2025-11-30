import React, { useEffect, useMemo, useState } from 'react';
import { SearchResult } from '../types';
import { Search, Flame, Sparkles, ListFilter, AlertCircle } from 'lucide-react';
import { fetchProducts, fetchSearchTrends, fetchShoppingInsight } from '../services/api';

const sortOptions = [
  { key: 'relevance', label: '관련도' },
  { key: 'popular', label: '인기' },
  { key: 'ai', label: 'AI 추천' },
] as const;

interface SearchResultsProps {
  initialQuery?: string;
  onQueryChange?: (q: string) => void;
  onProductClick?: (url?: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ initialQuery, onQueryChange, onProductClick }) => {
  const [query, setQuery] = useState(initialQuery ?? '여름 셔츠');
  const [sort, setSort] = useState<typeof sortOptions[number]['key']>('relevance');
  const [isLoading, setIsLoading] = useState(false);
  const [displayed, setDisplayed] = useState<SearchResult[]>([]);
  const [productResults, setProductResults] = useState<SearchResult[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [trendKeywords, setTrendKeywords] = useState<string[]>([]);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [shoppingInsight, setShoppingInsight] = useState<{ label: string; value: number }[]>([]);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const filtered = useMemo(() => [], [query, sort]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setDisplayed(filtered);
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [filtered]);

  useEffect(() => {
    setProductLoading(true);
    setProductError(null);
    const sortParam =
      sort === 'relevance' ? 'sim' : sort === 'popular' ? 'date' : 'sim';
    fetchProducts(query, sortParam as any)
      .then(({ products, source }) => {
        const mapped = products.map((p, idx) => ({
          id: p.id,
          type: 'product' as const,
          title: p.name,
          snippet: p.description || '네이버 쇼핑 상품',
          imageUrl: p.imageUrl,
          linkUrl: p.linkUrl,
          tags: [source === 'api' ? '네이버 쇼핑' : '로컬 상품'],
          score: Math.max(50, 100 - idx * 2),
        }));
        const sorted =
          sort === 'ai'
            ? [...mapped].sort((a, b) => (b.score || 0) - (a.score || 0))
            : mapped;
        setProductResults(sorted);
      })
      .catch((err) => {
        setProductError(err instanceof Error ? err.message : '상품을 불러오지 못했습니다.');
        setProductResults([]);
      })
      .finally(() => setProductLoading(false));
  }, [query, sort]);

  const contentResults = useMemo(() => displayed.filter((item) => item.type !== 'product'), [displayed]);
  const mockProductFallback = useMemo(() => displayed.filter((item) => item.type === 'product'), [displayed]);
  const effectiveProducts = productResults.length > 0 ? productResults : mockProductFallback;
  const typeCounts = useMemo(
    () => ({
      article: contentResults.filter((i) => i.type === 'article').length,
      video: contentResults.filter((i) => i.type === 'video').length,
      product: effectiveProducts.length,
      total: contentResults.length + effectiveProducts.length,
    }),
    [contentResults, effectiveProducts],
  );

  useEffect(() => {
    fetchSearchTrends({
      startDate: '2024-11-01',
      endDate: '2024-11-30',
      timeUnit: 'date',
      keywordGroups: [{ groupName: '패션', keywords: ['니트', '자켓', '셔츠'] }],
    })
      .then((res: any) => {
        const items = res.results?.[0]?.keywords || res.results?.[0]?.data?.map((d: any) => d.keyword) || [];
        const picked = Array.isArray(items) ? items.slice(0, 5) : [];
        setTrendKeywords(picked);
      })
      .catch((err) => setTrendError(err instanceof Error ? err.message : '트렌드 키워드를 불러오지 못했습니다.'));
  }, []);

  useEffect(() => {
    setInsightLoading(true);
    setInsightError(null);
    fetchShoppingInsight({
      startDate: '2024-11-01',
      endDate: '2024-12-01',
      timeUnit: 'month',
      category: '50000000',
      device: '',
      gender: '',
      ages: ['20', '30', '40'],
    })
      .then((res: any) => {
        const data = res.results?.[0]?.data || [];
        const mapped = data
          .slice(0, 4)
          .map((d: any) => ({ label: d.period || d.group || '기타', value: d.ratio || d.value || 0 }));
        setShoppingInsight(mapped);
      })
      .catch((err) => setInsightError(err instanceof Error ? err.message : '쇼핑 인사이트를 불러오지 못했습니다.'))
      .finally(() => setInsightLoading(false));
  }, []);

  const badgeColor = (type: SearchResult['type']) => {
    if (type === 'article') return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    if (type === 'video') return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-indigo-600">통합 검색</p>
            <h2 className="text-2xl font-bold text-gray-900">콘텐츠 + 상품 피드</h2>
            <p className="text-sm text-gray-500">기사·숏폼·상품이 한 번에 노출됩니다.</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 flex-wrap">
              <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold">콘텐츠 {typeCounts.article + typeCounts.video}건</span>
              <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">상품 {typeCounts.product}건</span>
              <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">총 {typeCounts.total}건</span>
            </div>
          </div>
          <ListFilter className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                onQueryChange?.(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="검색어를 입력하세요"
            />
          </div>
          <div className="flex gap-2">
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                  sort === opt.key ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700 hover:border-indigo-200'
                }`}
              >
                {opt.label} ({typeCounts.total})
              </button>
            ))}
          </div>
        </div>
        {(trendKeywords.length > 0 || shoppingInsight.length > 0) && (
          <div className="flex flex-col gap-2 text-xs text-gray-600">
            {trendKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold">트렌드</span>
                {trendKeywords.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => {
                      setQuery(kw);
                      onQueryChange?.(kw);
                    }}
                    className="px-2.5 py-1 rounded-full border border-gray-200 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                  >
                    #{kw}
                  </button>
                ))}
                {trendError && <span className="text-red-600">{trendError}</span>}
              </div>
            )}
            {shoppingInsight.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">쇼핑 인사이트</span>
                {insightLoading && <span className="text-gray-500">불러오는 중...</span>}
                {insightError && <span className="text-red-600">{insightError}</span>}
                {shoppingInsight.map((item) => (
                  <span
                    key={item.label}
                    className="px-2.5 py-1 rounded-full border border-gray-200 bg-white text-gray-800"
                  >
                    {item.label}: {item.value}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">콘텐츠(기사·숏폼)</h3>
            <span className="text-xs text-gray-500">총 {contentResults.length}건 · 기사 {typeCounts.article} · 숏폼 {typeCounts.video}</span>
          </div>
          {isLoading && (
            <div className="space-y-3">
              {[1, 2].map((key) => (
                <div key={key} className="bg-white border border-gray-200 rounded-2xl p-4 h-28 animate-pulse" />
              ))}
            </div>
          )}
          {!isLoading && contentResults.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-500">검색 결과가 없습니다.</div>
          )}
          {!isLoading &&
            contentResults.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-4 hover:border-indigo-200 transition-colors">
                <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-100">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={`px-2 py-1 rounded-full border ${badgeColor(item.type)}`}>
                    {item.type === 'article' ? '기사' : '숏폼'}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-100 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI {sort === 'ai' ? '추천' : '랭킹'}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mt-1 truncate">{item.title}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{item.snippet}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <Flame className="w-3 h-3 text-amber-500" />
                  관련도 {item.score} · {item.tags?.slice(0, 3).join(' · ')}
                </div>
                {sort === 'ai' && (
                  <div className="mt-1 text-[11px] text-indigo-700">
                    AI 추천 이유: 시청 지속시간 + 키워드 매칭 기반 재랭킹
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">상품 결과</h3>
            <span className="text-xs text-gray-500">총 {effectiveProducts.length}건</span>
          </div>
          {productLoading && (
            <div className="space-y-3">
              {[1, 2].map((key) => (
                <div key={key} className="bg-white border border-gray-200 rounded-2xl p-4 h-28 animate-pulse" />
              ))}
            </div>
          )}
          {!productLoading && productError && (
            <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm flex gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" /> {productError}
            </div>
          )}
          {!productLoading && !productError && effectiveProducts.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-500">검색 결과가 없습니다.</div>
          )}
          {!productLoading &&
            !productError &&
            effectiveProducts.map((item) => (
              <button
                key={item.id}
                onClick={() => onProductClick?.(item.linkUrl)}
                className="w-full text-left bg-white border border-gray-200 rounded-2xl p-4 flex gap-4 hover:border-indigo-200 transition-colors"
              >
                <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-100">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={`px-2 py-1 rounded-full border ${badgeColor(item.type)}`}>상품</span>
                  <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-100 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI {sort === 'ai' ? '추천' : '랭킹'}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mt-1 truncate">{item.title}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{item.snippet}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <Flame className="w-3 h-3 text-amber-500" />
                    관련도 {item.score} · {item.tags?.slice(0, 3).join(' · ')}
                  </div>
                  {sort === 'ai' && (
                  <div className="mt-1 text-[11px] text-indigo-700">
                    AI 추천 이유: {item.tags?.find((t) => t.includes('추천 이유')) || '유사 시청·클릭 행동 기반'}
                  </div>
                )}
              </div>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
};

export default SearchResults;
