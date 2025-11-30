import React, { useEffect, useMemo, useState } from 'react';
import { Home as HomeIcon, Sparkles, PlayCircle, Flame, ArrowRight, Tag } from 'lucide-react';
import { Match, Product, VideoMarker } from '../types';
import { fetchProducts } from '../services/api';

const categories = ['니트', '패션', '시계', '테크', '라이프', '아우터'];

interface HomeProps {
  onCategoryClick?: (category: string) => void;
  onSeeArticle?: () => void;
  onSeeShortform?: () => void;
}

const Home: React.FC<HomeProps> = ({ onCategoryClick, onSeeArticle, onSeeShortform }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('니트');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchProducts(query)
      .then(({ products: list }) => setProducts(list))
      .catch((err) => setError(err instanceof Error ? err.message : '상품을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [query]);

  const recommended = useMemo(() => {
    return products.slice(0, 6).map((product, idx) => {
      const match: Match = {
        id: `naver-${product.id}-${idx}`,
        articleId: 'naver',
        productId: product.id,
        matchedKeyword: product.category || query,
        contextSentence: product.description || '네이버 쇼핑 상품',
        contextScore: Math.max(60, 95 - idx * 5),
        isApproved: true,
        reasonLabel: '네이버 쇼핑',
      };
      return { match, product };
    });
  }, [products, query]);

  const featuredShortform = useMemo(() => {
    const hero = products[0];
    if (!hero) return null;
    const markers: VideoMarker[] = [
      { id: `m-${hero.id}`, productId: hero.id, start: 3, end: 12, position: { x: 62, y: 42 }, keyword: hero.name.slice(0, 12) },
    ];
    return {
      id: `sf-${hero.id}`,
      title: hero.name,
      category: hero.category || '상품',
      brand: '네이버 쇼핑',
          videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      posterUrl: hero.imageUrl,
      summary: hero.description || '네이버 쇼핑 상품',
      markers,
    };
  }, [products]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white h-[320px] lg:h-[380px]">
          {products[0]?.imageUrl && (
            <img src={products[0].imageUrl} alt={products[0].name} className="absolute inset-0 w-full h-full object-cover opacity-80" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-900/65 to-gray-900/15 backdrop-blur-[2px]" />
          <div className="absolute inset-0 p-6 flex flex-col justify-end gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-sm backdrop-blur">
              <HomeIcon className="w-4 h-4" /> 최신 매거진
            </div>
            <div className="bg-black/45 backdrop-blur-sm rounded-xl p-4 md:p-5 w-fit max-w-[560px] shadow-lg shadow-black/40">
              <h2 className="text-2xl md:text-3xl font-extrabold leading-tight drop-shadow-sm">
                {products[0]?.name || '실시간 인기 상품'}
              </h2>
              <p className="text-sm md:text-base text-gray-100/95 mt-2 leading-relaxed line-clamp-3">
                {products[0]?.description || 'AI 분석/추천 엔진과 연결하여 실데이터를 노출하세요.'}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-100/90 mt-3 flex-wrap">
                <span className="px-2 py-1 rounded-full bg-white/15 border border-white/20">
                  {products[0]?.category || '추천'}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                <span>네이버 쇼핑</span>
                <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                <span>실데이터</span>
              </div>
            <button
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold w-fit shadow"
              onClick={onSeeArticle}
            >
              기사 보기 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-gray-100">
            <div>
              <p className="text-xs uppercase font-semibold text-indigo-600">29초 숏폼</p>
              <h3 className="text-lg font-bold text-gray-900">바로 재생하고 구매까지</h3>
              <p className="text-sm text-gray-500">{featuredShortform?.summary || '네이버 쇼핑 실데이터로 오버레이'}</p>
            </div>
            <PlayCircle className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="relative h-[280px] bg-gray-900">
            {featuredShortform?.posterUrl && (
              <img src={featuredShortform.posterUrl} alt={featuredShortform.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-gray-900/10"></div>
            <div className="absolute inset-0 flex flex-col justify-end p-4 gap-2 text-white">
              <div className="flex items-center gap-2 text-xs text-gray-100">
                <span className="px-2 py-1 rounded-full bg-white/15 uppercase">#{featuredShortform?.category || '상품'}</span>
                <span className="flex items-center gap-1 text-amber-300">
                  <Flame className="w-4 h-4" /> 실시간 인기
                </span>
              </div>
              <h4 className="text-xl font-bold">{featuredShortform?.title || '네이버 상품 숏폼'}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-200">
                {featuredShortform?.markers.map((m) => (
                  <span key={m.id} className="px-3 py-1 rounded-full bg-white/15 border border-white/20">
                    #{m.keyword}
                  </span>
                ))}
              </div>
            </div>
            <div className="absolute top-4 right-4">
              <button
                onClick={onSeeShortform}
                className="px-3 py-1.5 bg-white/90 text-gray-900 text-xs font-semibold rounded-full shadow"
              >
                숏폼 보러가기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase font-semibold text-indigo-600">당신을 위한 추천</p>
            <h3 className="text-xl font-bold text-gray-900">콘텐츠·행동 기반 재랭킹</h3>
            <p className="text-sm text-gray-500">AiTEMS 스타일의 추천 이유를 함께 노출합니다.</p>
          </div>
          <Sparkles className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && <div className="text-sm text-gray-500">로딩 중...</div>}
          {error && <div className="text-sm text-red-600">상품을 불러오지 못했습니다: {error}</div>}
          {!loading && !error && recommended.map(({ match, product }, idx) => {
            const isHero = idx === 0;
            return (
              <div
                key={product.id}
                className={`border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-colors bg-white relative ${
                  isHero ? 'lg:col-span-2 lg:grid lg:grid-cols-5 gap-4 lg:items-center shadow-md' : ''
                }`}
              >
                {isHero && (
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold">
                    주력 추천
                  </span>
                )}
                <div className={`aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 mb-3 ${isHero ? 'lg:mb-0 lg:col-span-3' : ''}`}>
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className={`flex flex-col justify-between ${isHero ? 'lg:col-span-2 lg:pl-1' : ''}`}>
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-indigo-700 font-semibold mb-1">
                      <Tag className="w-3 h-3" /> {match.reasonLabel || match.matchedKeyword}
                    </div>
                    <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{match.contextSentence}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-indigo-700 font-bold">${product.price}</span>
                    <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs">{match.contextScore}% 일치</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">카테고리별 탐색</h3>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryClick?.(cat)}
              className="px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium hover:border-indigo-200 hover:text-indigo-700 transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Message banner */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-amber-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800">최근 본 콘텐츠 기반 메시지</p>
          <p className="text-sm text-amber-700">IFDO 스타일 개인화 배너: 지금 본 숏폼과 비슷한 상품을 장바구니에 담아보세요.</p>
        </div>
        <button className="px-3 py-2 bg-amber-700 text-white rounded-lg text-sm font-semibold">지금 보기</button>
      </section>
    </div>
  );
};

export default Home;
