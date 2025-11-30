import React, { useEffect, useMemo, useState } from 'react';
import { Product } from '../types';
import { Plus, Upload, Search, ExternalLink, Trash2, SortAsc, SortDesc, AlertCircle, RefreshCcw, Filter } from 'lucide-react';
import { fetchProducts } from '../services/api';

const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'price' | 'aiScore' | 'updatedAt'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [source, setSource] = useState<'api' | 'fallback'>('fallback');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadCatalog = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const search = searchTerm.trim() || '패션';
      const { products: fetched, source: src } = await fetchProducts(search);
      setProducts(fetched);
      setSource(src);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '상품을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
    return ['all', ...unique];
  }, [products]);

  const sources = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.source).filter(Boolean))) as string[];
    return ['all', ...unique];
  }, [products]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // Simulate parsing delay
    setTimeout(() => {
      const newProduct: Product = {
        id: `p${products.length + 1}`,
        name: '새로 업로드된 상품',
        description: 'CSV에서 가져옴',
        price: 99.99,
        imageUrl: 'https://picsum.photos/400/400?random=10',
        linkUrl: '#'
      };
      setProducts([...products, newProduct]);
      setIsUploading(false);
    }, 1500);
  };

  const handleAddProduct = async () => {
    setActionError('현재 데모 환경에서는 상품 추가 API가 없습니다.');
  };

  const handleDelete = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!window.confirm(`'${product?.name ?? id}' 상품을 삭제하시겠습니까?`)) {
      return;
    }
    setActionError('현재 데모 환경에서는 삭제 API가 없습니다.');
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const numericMin = minPrice ? parseFloat(minPrice) : null;
    const numericMax = maxPrice ? parseFloat(maxPrice) : null;
    const base = term
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term) ||
            p.id.toLowerCase().includes(term) ||
            (p.brand ?? '').toLowerCase().includes(term) ||
            (p.tags ?? []).some((t) => t.toLowerCase().includes(term)),
        )
      : products;

    const filteredByMeta = base.filter((p) => {
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchesSource = sourceFilter === 'all' || p.source === sourceFilter;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesMin = numericMin === null || p.price >= numericMin;
      const matchesMax = numericMax === null || p.price <= numericMax;
      return matchesCategory && matchesSource && matchesStatus && matchesMin && matchesMax;
    });

    return [...filteredByMeta].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'price') {
        return (a.price - b.price) * dir;
      }
      if (sortKey === 'aiScore') {
        return ((a.aiScore ?? -1) - (b.aiScore ?? -1)) * dir;
      }
      if (sortKey === 'updatedAt') {
        const ad = a.updatedAt ? Date.parse(a.updatedAt) : 0;
        const bd = b.updatedAt ? Date.parse(b.updatedAt) : 0;
        return (ad - bd) * dir;
      }
      return a.name.localeCompare(b.name) * dir;
    });
  }, [products, searchTerm, sortDir, sortKey, categoryFilter, minPrice, maxPrice, sourceFilter, statusFilter]);

  const toggleSortDir = () => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  const formatCurrency = (value: number) => new Intl.NumberFormat('ko-KR').format(value);
  const formatDate = (value?: string) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toISOString().slice(0, 10);
  };
  const sourceLabel = (src?: Product['source']) => {
    if (src === 'api') return 'API';
    if (src === 'csv') return 'CSV';
    if (src === 'manual') return '수동';
    if (src === 'seed') return '시드';
    return '미지정';
  };
  const aiScoreColor = (score?: number) => {
    if (score === undefined || score === null) return 'bg-gray-200';
    if (score >= 90) return 'bg-emerald-200';
    if (score >= 75) return 'bg-indigo-200';
    if (score >= 60) return 'bg-amber-200';
    return 'bg-gray-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">상품 카탈로그</h2>
          <p className="text-gray-500 mt-1">문맥 매칭을 위한 재고를 관리하세요.</p>
          {loading && <p className="text-xs text-indigo-600 mt-1">불러오는 중...</p>}
          {!loading && (
            <p className="text-xs text-gray-400 mt-1">
              소스: {source === 'api' ? 'API' : '로컬 시드'}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm">
            {isUploading ? (
              <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Upload className="w-4 h-4" />
            )}
            CSV 가져오기
            <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} disabled={isUploading} />
          </label>
          <button
            onClick={handleAddProduct}
            disabled={loading || isAdding}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {isAdding ? '추가 중...' : '상품 추가'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col gap-3 md:flex-row md:items-center md:gap-4 bg-gray-50/60">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Filter className="w-4 h-4 text-gray-500" />
            필터 · 정렬
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="상품명, 설명, ID로 검색..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              disabled={loading}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
              disabled={loading}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? '카테고리 전체' : cat}
                </option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
              disabled={loading}
            >
              {sources.map((src) => (
                <option key={src} value={src}>
                  {src === 'all' ? '소스 전체' : sourceLabel(src as Product['source'])}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
              disabled={loading}
            >
              {['all', 'active', 'paused', 'draft'].map((st) => (
                <option key={st} value={st}>
                  {st === 'all' ? '상태 전체' : st}
                </option>
              ))}
            </select>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="최소 가격"
              className="w-28 px-3 py-2 border border-gray-300 rounded-lg bg-white"
              disabled={loading}
            />
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="최대 가격"
              className="w-28 px-3 py-2 border border-gray-300 rounded-lg bg-white"
              disabled={loading}
            />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as 'name' | 'price' | 'aiScore' | 'updatedAt')}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
              disabled={loading}
            >
              <option value="name">이름</option>
              <option value="price">가격</option>
              <option value="aiScore">AI 점수</option>
              <option value="updatedAt">업데이트일</option>
            </select>
            <button
              onClick={toggleSortDir}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white flex items-center gap-1 hover:border-indigo-300"
              aria-label="정렬 방향 변경"
              disabled={loading}
            >
              {sortDir === 'asc' ? (
                <>
                  <SortAsc className="w-4 h-4" /> 오름차순
                </>
              ) : (
                <>
                  <SortDesc className="w-4 h-4" /> 내림차순
                </>
              )}
            </button>
          </div>
        </div>
        
        {loadError && (
          <div className="px-6 py-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border-b border-red-100">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">불러오기 실패</p>
              <p>{loadError}</p>
              <button
                onClick={loadCatalog}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg"
              >
                <RefreshCcw className="w-3 h-3" /> 다시 시도
              </button>
            </div>
          </div>
        )}
        {actionError && (
          <div className="px-6 py-3 flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border-b border-amber-100">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">작업 오류</p>
              <p>{actionError}</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1100px]">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">상품</th>
                <th className="px-6 py-3">카테고리 · 키워드</th>
                <th className="px-6 py-3">가격 / 마진</th>
                <th className="px-6 py-3 hidden md:table-cell">업데이트</th>
                <th className="px-6 py-3">소스</th>
                <th className="px-6 py-3 hidden lg:table-cell">노출 지표</th>
                <th className="px-6 py-3">숏폼 매칭</th>
                <th className="px-6 py-3">기사 매칭</th>
                <th className="px-6 py-3">AI 점수</th>
                <th className="px-6 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const totalMatches = (product.shortformMatches ?? 0) + (product.articleMatches ?? 0);
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-md object-cover bg-gray-100" />
                        <div>
                          <span className="font-medium text-gray-900">{product.name}</span>
                          <div className="text-[11px] text-gray-500">{product.brand ?? '브랜드 미지정'}</div>
                          <div className="text-[11px] text-gray-400">ID: {product.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2 items-center">
                        {product.category && (
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">{product.category}</span>
                        )}
                        {(product.tags ?? []).map((tag) => (
                          <span key={tag} className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs">
                            #{tag}
                          </span>
                        ))}
                        {!product.category && (product.tags ?? []).length === 0 && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">₩{formatCurrency(product.price)}</div>
                      <div className="text-xs text-gray-500">
                        {product.margin !== undefined && product.margin !== null ? `마진 ₩${formatCurrency(product.margin)}` : '마진 정보 없음'}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-gray-600">{formatDate(product.updatedAt)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700">
                        {sourceLabel(product.source)}
                      </span>
                      {product.status && (
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-[11px] font-semibold ${
                            product.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : product.status === 'paused'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {product.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-gray-700">
                      {totalMatches > 0 ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold">총 {totalMatches}</span>
                          {product.badges?.map((b) => (
                            <span key={b} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                              {b}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">노출 지표 없음</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-semibold">{product.shortformMatches ?? 0}회</div>
                      <div className="text-[11px] text-gray-500">숏폼 태그</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-semibold">{product.articleMatches ?? 0}회</div>
                      <div className="text-[11px] text-gray-500">기사 매칭</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-gray-900">{product.aiScore ?? '—'}</div>
                        <div className="w-16 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`${aiScoreColor(product.aiScore)} h-full`}
                            style={{ width: `${Math.min(Math.max(product.aiScore ?? 0, 0), 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <a
                          href={product.linkUrl}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100"
                          target="_blank"
                          rel="noreferrer"
                        >
                          미리보기 <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={loading || mutatingId === product.id}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" /> {mutatingId === product.id ? '삭제 중...' : '삭제'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {products.length === 0 && !loading && (
          <div className="p-12 text-center text-gray-500">
            상품이 없습니다. CSV를 가져오거나 새 상품을 추가해 보세요.
          </div>
        )}
        {products.length > 0 && filteredProducts.length === 0 && !loading && (
          <div className="p-12 text-center text-gray-500">
            검색 결과가 없습니다. 검색어를 지우거나 다른 키워드를 입력해 보세요.
          </div>
        )}
        {loading && (
          <div className="p-12 text-center text-gray-500">로딩 중...</div>
        )}
      </div>
    </div>
  );
};

export default ProductCatalog;
