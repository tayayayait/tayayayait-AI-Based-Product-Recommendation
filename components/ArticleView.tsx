import React, { useEffect, useMemo, useState } from 'react';
import { Match, Product } from '../types';
import { Clock3, Sparkles, ShoppingCart, Star, AlertCircle, ArrowRight } from 'lucide-react';
import { fetchProducts } from '../services/api';

const DEFAULT_ARTICLE = {
  id: 'demo-article',
  title: 'AI 분석/추천을 위한 기사 예시',
  category: '패션',
  author: '에디터',
  heroImage: '',
  readTimeMinutes: 4,
  content: '실제 CMS 연동 시 기사 본문을 불러와 인라인 위젯/추천을 삽입합니다.',
};

const ArticleView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts('패션')
      .then(({ products }) => setProducts(products.slice(0, 6)))
      .catch((err) => setError(err instanceof Error ? err.message : '상품을 불러오지 못했습니다.'));
  }, []);

  const inlineMatches = useMemo(() => {
    return products.slice(0, 4).map((p, idx) => ({
      match: {
        id: `m-${p.id}-${idx}`,
        articleId: DEFAULT_ARTICLE.id,
        productId: p.id,
        matchedKeyword: p.category || '추천',
        contextSentence: p.description || DEFAULT_ARTICLE.content,
        contextScore: Math.max(60, 95 - idx * 5),
        isApproved: true,
        reasonLabel: '네이버 쇼핑',
      } as Match,
      product: p,
    }));
  }, [products]);

  const renderInlineWidget = (label: string, hint: string) => (
    <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase font-semibold text-indigo-600">{label}</p>
          <h3 className="text-xl font-bold text-gray-900">콘텐츠 흐름을 끊지 않는 인라인 위젯</h3>
          <p className="text-sm text-gray-500">{hint}</p>
          <div className="mt-2 inline-flex items-center gap-2 text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            <span>좌우 스크롤</span>
            <ArrowRight className="w-3 h-3 animate-pulse" />
          </div>
        </div>
        <Sparkles className="w-6 h-6 text-indigo-600" />
      </div>
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
          {inlineMatches.map(({ match, product }) => (
            <div
              key={product.id}
              className="border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-transform duration-200 min-w-[260px] bg-white snap-start hover:-translate-y-1"
            >
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 mb-3">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-indigo-700 font-semibold mb-1">
                <Sparkles className="w-3 h-3" /> {match.reasonLabel || match.matchedKeyword}
              </div>
              <p className="font-semibold text-gray-900 truncate">{product.name}</p>
              <div className="text-sm text-gray-600 line-clamp-2 mb-2">“{match.contextSentence}”</div>
              <div className="flex items-center justify-between">
                <span className="text-indigo-700 font-bold">${product.price}</span>
                <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold">
                  <ShoppingCart className="w-4 h-4" /> 장바구니
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white via-white/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent" />
      </div>
      <div className="text-xs text-gray-500 flex items-center gap-2 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
        <AlertCircle className="w-4 h-4 text-amber-600" />
        AiTEMS CTR 최적화 규칙에 맞춰 노출 위치/빈도를 실험적으로 조정하는 섹션입니다.
      </div>
    </section>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 text-sm text-indigo-700 font-semibold">
            <span className="px-3 py-1 rounded-full bg-indigo-50">{DEFAULT_ARTICLE.category}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-700">{DEFAULT_ARTICLE.author}</span>
            <span className="text-gray-400">·</span>
            <span className="flex items-center gap-1 text-gray-600">
              <Clock3 className="w-4 h-4" /> {DEFAULT_ARTICLE.readTimeMinutes}분 읽기
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-3">{DEFAULT_ARTICLE.title}</h1>
          <p className="text-gray-600 mt-2">{DEFAULT_ARTICLE.content}</p>
        </div>
        {DEFAULT_ARTICLE.heroImage && (
          <div className="h-[280px] bg-gray-900 overflow-hidden">
            <img src={DEFAULT_ARTICLE.heroImage} alt={DEFAULT_ARTICLE.title} className="w-full h-full object-cover" />
          </div>
        )}
      </header>

      {renderInlineWidget('이 기사와 관련된 상품', '스크롤 40% 지점, 체류 10초 후 노출 트리거 예시')}

      {/* Review insights */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-gray-900">리뷰 하이라이트</h3>
        </div>
        <div className="text-sm text-gray-500">리뷰 인사이트 API 연동 후 여기에서 하이라이트를 보여줍니다.</div>
      </section>

      {renderInlineWidget('말미 리인게이지', '본문을 다 읽은 사용자를 위한 추가 CTA/추천 배치')}

      {/* Bottom recommendations */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">함께 보면 좋은 콘텐츠 / 상품</h3>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </div>
        {error && <div className="text-sm text-red-600">상품을 불러오지 못했습니다: {error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product, idx) => (
            <div key={product.id} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-200 transition-colors shadow-[0_6px_18px_-12px_rgba(0,0,0,0.12)] bg-white">
              <p className="text-[11px] text-indigo-700 font-semibold mb-1">네이버 쇼핑 · 추천 {idx + 1}</p>
              <p className="font-semibold text-gray-900">{product.name}</p>
              <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
              <div className="mt-2 text-indigo-700 font-bold">${product.price}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ArticleView;
