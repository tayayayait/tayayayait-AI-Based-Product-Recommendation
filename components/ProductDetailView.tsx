import React, { useEffect, useMemo, useState } from 'react';
import { Star, ShoppingBag, ArrowRight, Sparkles, X } from 'lucide-react';
import { Product } from '../types';
import { fetchProducts } from '../services/api';

const ProductDetailView: React.FC = () => {
  const [showFullReviews, setShowFullReviews] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query] = useState('니트');

  const handleAddToCart = () => {
    setAddedToCart(true);
    setShowCartDrawer(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchProducts(query)
      .then(({ products }) => {
        if (products.length > 0) {
          setProduct(products[0]);
          setRecommended(products.slice(1, 7));
        } else {
          setProduct(null);
          setRecommended([]);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : '상품을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [query]);

  const [behaviorBased, bundleBased] = useMemo(() => {
    const half = Math.ceil(recommended.length / 2);
    return [recommended.slice(0, half), recommended.slice(half)];
  }, [recommended]);

  return (
    <div className="space-y-8">
      {loading && <div className="text-sm text-gray-500">상품을 불러오는 중...</div>}
      {error && <div className="text-sm text-red-600">상품을 불러오지 못했습니다: {error}</div>}
      {!product && !loading && !error && <div className="text-sm text-gray-500">표시할 상품이 없습니다. 검색어를 바꿔보세요.</div>}

      {product && (
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="bg-gray-100 p-6">
            <div className="aspect-[4/3] bg-white rounded-xl overflow-hidden shadow">
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold">
              #{product.category || '상품'} · 네이버 쇼핑
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600">{product.description}</p>
            <div className="text-2xl font-bold text-indigo-700">${product.price}</div>
            <div className="flex gap-3">
              <button type="button" className="px-5 py-3 bg-gray-900 text-white rounded-lg font-semibold inline-flex items-center gap-2 hover:bg-gray-800 transition-colors">
                <ShoppingBag className="w-5 h-5" /> 구매하기
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                className="px-5 py-3 border border-gray-200 rounded-lg font-semibold text-gray-800 hover:border-indigo-200 hover:text-indigo-700"
              >
                장바구니
              </button>
            </div>
            {addedToCart && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg inline-flex items-center gap-2">
                장바구니에 담았습니다. 상단으로 이동하지 않아요.
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Star className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-gray-900 flex-1">리뷰 분석 인사이트</h3>
          <button
            type="button"
            onClick={() => setShowFullReviews((prev) => !prev)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:border-indigo-200 hover:text-indigo-700"
          >
            후기 더보기
          </button>
        </div>
        <div className="text-sm text-gray-500">리뷰 인사이트 API 연동 후 하이라이트를 표시합니다.</div>
        {showFullReviews && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-3xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">리뷰 전문 영역 (API 연동 필요)</p>
                  <h4 className="font-semibold text-gray-900">전체 리뷰 보기</h4>
                </div>
                <button
                  onClick={() => setShowFullReviews(false)}
                  className="p-2 rounded-lg hover:bg-gray-50 text-gray-500"
                  aria-label="리뷰 닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-3 overflow-y-auto max-h-[70vh] text-sm text-gray-600">
                리뷰 데이터 연동 후 내용이 표시됩니다.
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-indigo-600">추천 상품</p>
            <h3 className="text-lg font-bold text-gray-900">Item2Item + 행동 기반</h3>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {behaviorBased.map((p) => (
            <div key={p.id} className="border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-colors">
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 mb-3">
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-[11px] text-indigo-700 font-semibold mb-1">비슷한 사용자가 본 상품</p>
              <p className="font-semibold text-gray-900 truncate">{p.name}</p>
              <p className="text-sm text-gray-600 line-clamp-2">{p.description}</p>
              <p className="text-[11px] text-gray-500 mt-1">추천 근거: 네이버 쇼핑</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-indigo-700 font-bold">${p.price}</span>
                <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs">실데이터</span>
              </div>
            </div>
          ))}
          {bundleBased.map((p) => (
            <div key={`bundle-${p.id}`} className="border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-colors">
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 mb-3">
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-[11px] text-amber-700 font-semibold mb-1">함께 보면 좋은 상품</p>
              <p className="font-semibold text-gray-900 truncate">{p.name}</p>
              <p className="text-sm text-gray-600 line-clamp-2">{p.description}</p>
              <p className="text-[11px] text-gray-500 mt-1">추천 근거: 네이버 쇼핑</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-indigo-700 font-bold">${p.price}</span>
                <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs">실데이터</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-indigo-600">설명형 추천</p>
            <h3 className="text-lg font-bold text-gray-900">추천 이유가 보이는 카드</h3>
          </div>
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recommended.slice(0, 2).map((p, idx) => (
            <div key={`exp-${p.id}-${idx}`} className="border border-indigo-200 bg-indigo-50 rounded-xl p-4">
              <p className="text-[11px] text-indigo-800 font-semibold mb-1">추천</p>
              <p className="font-semibold text-indigo-900 truncate">{p.name}</p>
              <p className="text-sm text-indigo-800 line-clamp-2">{p.description}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-indigo-800">
                <span className="px-2 py-1 rounded-full bg-white text-indigo-800 border border-indigo-100">이유</span>
                <span>네이버 쇼핑 실데이터</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showCartDrawer && product && (
        <div className="fixed bottom-4 right-4 z-40 w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">장바구니에 추가됨</p>
              <p className="font-semibold text-gray-900">{product.name}</p>
            </div>
            <button
              onClick={() => setShowCartDrawer(false)}
              className="p-2 rounded-lg hover:bg-gray-50 text-gray-500"
              aria-label="장바구니 알림 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <img src={product.imageUrl} alt={product.name} className="w-14 h-14 rounded-lg object-cover bg-gray-100" />
            <div className="flex-1">
              <p className="text-sm text-gray-600">총액</p>
              <p className="font-semibold text-indigo-700">${product.price}</p>
            </div>
            <button className="px-3 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg">장바구니 바로가기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailView;
