import React, { useEffect, useState } from 'react';
import { useEventLogger } from '../services/events';
import { ShoppingBag, ArrowUpRight, Sparkles, Star } from 'lucide-react';
import { Product } from '../types';
import { fetchProducts } from '../services/api';

const ShopTheStory: React.FC = () => {
  const { log } = useEventLogger();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    log({ event: 'widget_loaded', contentId: 'demo_article', widgetVersion: 'v1_shop_the_story' });
  }, [log]);

  useEffect(() => {
    fetchProducts('코디')
      .then(({ products: list }) => setProducts(list.slice(0, 6)))
      .catch((err) => setError(err instanceof Error ? err.message : '상품을 불러오지 못했습니다.'));
  }, []);

  const handleClick = (productId: string) => {
    log({
      event: 'product_click',
      contentId: 'demo_article',
      productId,
      location: { scrollDepthPercent: 60 },
      cta: 'shop_the_story_card',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-indigo-600" />
        <p className="text-xs font-semibold text-indigo-600 uppercase">Shop the Story</p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h3 className="text-xl font-bold text-gray-900">여름 아웃핏 완성템 모음</h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Star className="w-3 h-3 text-amber-500" />
          에디터 추천 세트 | 6개 상품
        </div>
      </div>

      {error && <div className="text-sm text-red-600 mb-2">상품을 불러오지 못했습니다: {error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => handleClick(product.id)}
            className="group text-left border border-gray-200 hover:border-indigo-200 rounded-xl p-3 transition-all"
          >
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 mb-3">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            <p className="text-xs text-indigo-600 font-medium mb-1">#룩북 #여름</p>
            <p className="font-semibold text-gray-900 truncate">{product.name}</p>
            <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-indigo-700 font-semibold">${product.price}</span>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
            </div>
          </button>
        ))}
      </div>

      {/* Sticky mini-bar */}
      <div className="hidden md:flex items-center gap-3 px-4 py-3 rounded-full border border-gray-200 bg-white shadow-lg shadow-indigo-100 sticky bottom-4 mt-6">
        <ShoppingBag className="w-5 h-5 text-indigo-600" />
        <div className="text-sm text-gray-800 font-semibold">이 스토리의 상품 {products.length}개</div>
        <div className="text-xs text-gray-500 flex-1">스크롤 위치와 함께 노출/클릭을 추적하는 섹션</div>
        <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg">
          전체 보기
        </button>
      </div>
    </div>
  );
};

export default ShopTheStory;
