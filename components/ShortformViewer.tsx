import React, { useEffect, useMemo, useRef, useState } from 'react';
import { VideoMarker, Shortform, Product } from '../types';
import { fetchProducts } from '../services/api';
import { Play, Pause, ArrowUpCircle, ArrowDownCircle, ShoppingBag, MousePointer2, Sparkles, Clock3 } from 'lucide-react';

const findActiveMarker = (markers: VideoMarker[], time: number) =>
  markers.find((m) => time >= m.start && time <= m.end) ?? null;

const formatTime = (value: number) => {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const ShortformViewer: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [feed, setFeed] = useState<Shortform[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchProducts('패션')
      .then(({ products: list }) => {
        setProducts(list);
        const generated: Shortform[] = list.slice(0, 4).map((p, idx) => ({
          id: `sf-${p.id}`,
          title: p.name,
          category: p.category || '상품',
          brand: '네이버 쇼핑',
          videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
          posterUrl: p.imageUrl,
          summary: p.description || '네이버 쇼핑 상품',
          markers: [
            { id: `m-${p.id}-1`, productId: p.id, start: 3 + idx * 2, end: 12 + idx * 2, position: { x: 65, y: 42 }, keyword: p.name.slice(0, 10) },
          ],
        }));
        setFeed(generated);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '상품을 불러오지 못했습니다.'));
  }, []);

  const current = feed[currentIndex] || feed[0];
  const activeMarker = useMemo(() => findActiveMarker(current?.markers || [], currentTime), [current, currentTime]);
  const activeProduct = activeMarker
    ? products.find((p) => p.id === activeMarker.productId) ?? null
    : null;

  const handlePlayToggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 0);
    setIsVideoLoading(false);
  };

  const handleChange = (dir: 'next' | 'prev') => {
    setCurrentTime(0);
    setIsPlaying(false);
    setDuration(0);
    setIsVideoLoading(true);
    setCurrentIndex((prev) => {
      if (feed.length === 0) return 0;
      if (dir === 'next') return (prev + 1) % feed.length;
      return prev === 0 ? feed.length - 1 : prev - 1;
    });
  };

  const handleJumpToMarker = (marker: VideoMarker) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = marker.start;
    video.play();
    setIsPlaying(true);
    setCurrentTime(marker.start);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY === null) return;
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - touchStartY;
    const threshold = 40;
    if (deltaY > threshold) {
      handleChange('prev');
    } else if (deltaY < -threshold) {
      handleChange('next');
    }
    setTouchStartY(null);
  };

  if (!current) {
    return <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-sm text-gray-500">상품을 불러오는 중이거나 표시할 데이터가 없습니다.</div>;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <div>
          <p className="text-xs uppercase font-semibold text-indigo-600">숏폼 29TV 스타일</p>
          <h3 className="text-lg font-bold text-gray-900">타임라인 기반 자동 상품 오버레이</h3>
          <p className="text-sm text-gray-500">스와이프(상/하)를 버튼으로 시뮬레이션했습니다.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleChange('prev')} className="p-2 rounded-full border border-gray-200 hover:border-indigo-200" aria-label="이전 영상">
            <ArrowUpCircle className="w-5 h-5 text-gray-700" />
          </button>
          <button onClick={() => handleChange('next')} className="p-2 rounded-full border border-gray-200 hover:border-indigo-200" aria-label="다음 영상">
            <ArrowDownCircle className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      <div
        className="relative bg-black h-[420px]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <video
          ref={videoRef}
          src={current.videoUrl}
          poster={current.posterUrl}
          className="w-full h-full object-cover"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onLoadedData={() => setIsVideoLoading(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls={false}
        />

        {isVideoLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm text-white text-sm">
            로딩 중...
          </div>
        )}

        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-white/80 text-gray-900 text-xs font-semibold shadow">
            #{current.category}
          </span>
          {current.brand && (
            <span className="px-3 py-1 rounded-full bg-indigo-600/90 text-white text-xs font-semibold shadow">
              {current.brand}
            </span>
          )}
        </div>

        <div className="absolute top-4 right-4 bg-black/55 text-white text-[11px] px-3 py-2 rounded-lg border border-white/10 max-w-[220px]">
          <p className="font-semibold mb-1">인식 결과 타임코드</p>
          <div className="space-y-1 max-w-[180px]">
            {(current.markers || []).map((marker) => {
              const isActive = activeMarker?.id === marker.id;
              const markerProduct = products.find((p) => p.id === marker.productId);
              return (
                <button
                  key={marker.id}
                  onClick={() => handleJumpToMarker(marker)}
                  className={`w-full text-left flex items-center justify-between px-2 py-1 rounded transition ${
                    isActive ? 'bg-indigo-600/60 ring-1 ring-white/30' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="truncate block font-semibold">
                      #{marker.keyword}
                    </span>
                    {markerProduct && (
                      <span className="truncate block text-[10px] text-white/80">{markerProduct.name}</span>
                    )}
                  </div>
                  <span className="font-mono ml-2">{formatTime(marker.start)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handlePlayToggle}
          className="absolute bottom-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 text-gray-900 shadow-md text-sm font-semibold"
          disabled={isVideoLoading}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? '일시정지' : '재생'}
        </button>

        <div className="absolute left-4 top-16 bg-black/40 text-white text-[11px] px-3 py-2 rounded-lg border border-white/10 hidden sm:flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/20">Swipe</span>
          <span>상/하 스와이프 → 다음/이전</span>
        </div>

        {(current.markers || []).map((marker) => {
          const visible = currentTime >= marker.start && currentTime <= marker.end;
          return (
            <span
              key={marker.id}
              className={`absolute w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                visible ? 'bg-indigo-600 border-white shadow-lg' : 'bg-white/70 border-indigo-200'
              }`}
              style={{ left: `${marker.position.x}%`, top: `${marker.position.y}%`, transform: 'translate(-50%, -50%)' }}
              title={marker.keyword}
            >
              <MousePointer2 className={`w-4 h-4 ${visible ? 'text-white' : 'text-indigo-500'}`} />
            </span>
          );
        })}

        {/* Overlay card */}
        {activeProduct && activeMarker && (
          <div className="absolute right-3 bottom-3 bg-white/95 backdrop-blur border border-gray-200 rounded-xl shadow-lg w-64 p-3">
            <div className="flex items-center gap-2 text-[11px] text-indigo-700 font-semibold mb-1">
              <Sparkles className="w-3 h-3" /> #{activeMarker.keyword}
            </div>
            <div className="flex gap-3">
              <img src={activeProduct.imageUrl} alt={activeProduct.name} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{activeProduct.name}</p>
                <p className="text-xs text-gray-600 line-clamp-2">{current.summary}</p>
                <div className="text-indigo-700 font-bold mt-1">${activeProduct.price}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock3 className="w-3 h-3" /> {formatTime(activeMarker.start)} - {formatTime(activeMarker.end)}
                <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">
                  구매 가능
                </span>
              </div>
              <button
                onClick={() => handleJumpToMarker(activeMarker)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg"
              >
                <ShoppingBag className="w-4 h-4" /> 구매하기
              </button>
            </div>
          </div>
        )}

        {duration > 0 && (
          <div className="absolute left-4 right-4 bottom-16 h-1.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500/80"
              style={{ width: `${Math.min((currentTime / duration) * 100, 100)}%` }}
            />
            <div className="absolute inset-x-0 -top-1 flex justify-between text-[10px] text-white/80 px-1">
              <span>00:00</span>
              <span>{formatTime(duration)}</span>
            </div>
            {(current.markers || []).map((marker) => {
              const left = duration ? `${(marker.start / duration) * 100}%` : '0%';
              const isActive = activeMarker?.id === marker.id;
              return (
                <div
                  key={marker.id}
                  className={`absolute top-0 h-1.5 w-2 rounded-full ${isActive ? 'bg-amber-300 shadow-md shadow-amber-300' : 'bg-white/70'}`}
                  style={{ left }}
                  title={`#${marker.keyword} ${formatTime(marker.start)}`}
                />
              );
            })}
          </div>
        )}
      </div>

        <div className="p-4 flex items-center justify-between border-t border-gray-100">
          <div className="text-sm text-gray-700 font-semibold">
            {current.title} · #{current.category}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-2">
          <span>마커 {current.markers?.length ?? 0}개</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <span>스와이프(버튼)로 다음 콘텐츠</span>
        </div>
      </div>
    </div>
  );
};

export default ShortformViewer;
