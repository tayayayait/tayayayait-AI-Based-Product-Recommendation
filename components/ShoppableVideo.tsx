import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEventLogger } from '../services/events';
import { analyzeVideo } from '../services/api';
import { VideoMarker, Product } from '../types';
import { fetchProducts } from '../services/api';
import { Play, Pause, PanelRight, Sparkles, MousePointer2, Clock3, AlertCircle } from 'lucide-react';

type Mode = 'sidebar' | 'hotspot';

const VIDEO_SRC = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

const findCurrentMarker = (markers: VideoMarker[], time: number) =>
  markers.find((m) => time >= m.start && time <= m.end);

const formatTime = (value: number) => {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const ShoppableVideo: React.FC = () => {
  const { log, sessionId } = useEventLogger();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<Mode>('sidebar');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [markers, setMarkers] = useState<VideoMarker[]>([]);
  const [markersLoading, setMarkersLoading] = useState(true);
  const [markerError, setMarkerError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productError, setProductError] = useState<string | null>(null);

  const activeMarker = useMemo(
    () => findCurrentMarker(markers, currentTime) ?? null,
    [markers, currentTime],
  );
  const activeProduct = useMemo(
    () => products.find((p) => p.id === activeMarker?.productId) ?? null,
    [activeMarker, products],
  );
  const duration = videoRef.current?.duration ?? 0;

  useEffect(() => {
    fetchProducts('패션')
      .then(({ products: list }) => {
        setProducts(list);
        if (list.length > 0) {
          const generatedMarkers: VideoMarker[] = list.slice(0, 3).map((p, idx) => ({
            id: `m-${p.id}`,
            productId: p.id,
            start: 2 + idx * 5,
            end: 10 + idx * 5,
            position: { x: 60 - idx * 8, y: 40 + idx * 8 },
            keyword: p.name.slice(0, 10),
          }));
          setMarkers(generatedMarkers);
        }
      })
      .catch((err) => setProductError(err instanceof Error ? err.message : '상품을 불러오지 못했습니다.'));
  }, []);

  useEffect(() => {
    let isMounted = true;
    setMarkersLoading(true);
    analyzeVideo({ contentId: 'demo_video', videoUrl: VIDEO_SRC })
      .then((data) => {
        if (!isMounted) return;
        if (data.length > 0) {
          setMarkers((prev) => (prev.length > 0 ? prev : data));
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setMarkerError(err instanceof Error ? err.message : '마커 불러오기 실패');
      })
      .finally(() => {
        if (isMounted) setMarkersLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeMarker || !activeProduct) return;
    log({
      event: 'marker_visible',
      contentId: 'demo_video',
      productId: activeProduct.id,
      matchedKeyword: activeMarker.keyword,
      location: { timecodeSeconds: currentTime },
      viewable: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMarker?.id]);

  const handlePlayToggle = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      log({ event: 'video_started', contentId: 'demo_video' });
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

  const handleSelectMarker = (marker: VideoMarker) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = marker.start;
      video.play();
      setIsPlaying(true);
    }

    const product = products.find((p) => p.id === marker.productId);
    if (product) {
      log({
        event: 'product_click',
        contentId: 'demo_video',
        productId: product.id,
        matchedKeyword: marker.keyword,
        location: { timecodeSeconds: marker.start },
      });
    }
  };

  const handleBuy = (productId: string, source: string) => {
    log({
      event: 'add_to_cart',
      contentId: 'demo_video',
      productId,
      cta: source,
      location: { timecodeSeconds: currentTime },
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex flex-col gap-4 p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              쇼퍼블 비디오 프리뷰
            </h3>
            <p className="text-sm text-gray-500">
              {mode === 'sidebar'
                ? '타임라인 기반 마커 + 사이드바'
                : '핫스팟 + 바텀시트 오버레이'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('sidebar')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                mode === 'sidebar'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              사이드바
            </button>
            <button
              onClick={() => setMode('hotspot')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                mode === 'hotspot'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              핫스팟
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100">
            <PanelRight className="w-4 h-4" />
            <span>세션: {sessionId}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100">
            <Clock3 className="w-4 h-4" />
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </div>
          <span className="text-gray-500 px-2 py-1 rounded bg-gray-50">마커 {markers.length}개</span>
          <span className="text-gray-500 px-2 py-1 rounded bg-gray-50">채널: 숏폼</span>
          <span className="text-gray-500 px-2 py-1 rounded bg-gray-50">위치: 핫스팟 / 사이드바</span>
          {markersLoading && <span className="text-indigo-600 font-semibold">불러오는 중...</span>}
          {markerError && (
            <span className="flex items-center gap-1 text-red-600">
              <AlertCircle className="w-3 h-3" />
              {markerError}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        <div className={`relative bg-black lg:col-span-2`}>
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            className="w-full h-[320px] lg:h-[420px] object-cover"
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            controls={false}
          />
          {duration > 0 && (
            <div className="absolute left-4 right-4 bottom-16 h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500/80"
                style={{ width: `${Math.min((currentTime / duration) * 100, 100)}%` }}
              />
              {markers.map((marker) => {
                const left = duration ? `${(marker.start / duration) * 100}%` : '0%';
                const isActive = activeMarker?.id === marker.id;
                return (
                  <div
                    key={marker.id}
                    className={`absolute top-0 h-1.5 w-2 rounded-full ${isActive ? 'bg-amber-300 shadow-md shadow-amber-300' : 'bg-white/70'}`}
                    style={{ left }}
                    title={`#${marker.keyword}`}
                  />
                );
              })}
            </div>
          )}

          <button
            onClick={handlePlayToggle}
            className="absolute bottom-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 text-gray-900 shadow-md text-sm font-semibold"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? '일시정지' : '재생'}
          </button>

          {/* Marker pins */}
          {markers.map((marker) => {
            const visible = currentTime >= marker.start && currentTime <= marker.end;
            const product = products.find((p) => p.id === marker.productId);
            if (!product) return null;
            return (
              <button
                key={marker.id}
                className={`absolute w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                  visible
                    ? 'bg-indigo-600 border-white shadow-lg scale-100'
                    : 'bg-white/70 border-indigo-200 scale-90'
                }`}
                style={{ left: `${marker.position.x}%`, top: `${marker.position.y}%`, transform: 'translate(-50%, -50%)' }}
                onClick={() => handleSelectMarker(marker)}
              >
                <MousePointer2 className={`w-4 h-4 ${visible ? 'text-white' : 'text-indigo-500'}`} />
              </button>
            );
          })}

          {/* Bottom sheet for hotspot mode */}
          {mode === 'hotspot' && activeProduct && activeMarker && (
            <div className="absolute left-0 right-0 bottom-0 bg-white/95 backdrop-blur border-t border-gray-200 p-4 lg:hidden">
              <div className="flex gap-3 items-center">
                <img
                  src={activeProduct.imageUrl}
                  alt={activeProduct.name}
                  className="w-16 h-16 rounded-lg object-cover bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">#{activeMarker.keyword}</p>
                  <h4 className="font-semibold text-gray-900 truncate">{activeProduct.name}</h4>
                  <p className="text-indigo-600 font-medium text-sm">${activeProduct.price}</p>
                </div>
                <button
                  onClick={() => handleBuy(activeProduct.id, 'hotspot_bottom_sheet')}
                  className="px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
                >
                  바로 구매
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar list */}
        {mode === 'sidebar' && (
          <div className="border-l border-gray-200 bg-white max-h-[420px] overflow-y-auto">
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-500">타임라인 매칭 {markers.length}개</p>
              {markersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((key) => (
                    <div key={key} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 animate-pulse h-20" />
                  ))}
                </div>
              ) : (
                markers.map((marker) => {
                  const product = products.find((p) => p.id === marker.productId);
                  if (!product) return null;
                  const isActive = activeMarker?.id === marker.id;
                  return (
                    <button
                      key={marker.id}
                      onClick={() => handleSelectMarker(marker)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors flex gap-3 ${
                        isActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'
                      }`}
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover bg-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          <Clock3 className="w-3 h-3" />
                          {formatTime(marker.start)} - {formatTime(marker.end)}
                        </div>
                        <p className="text-xs text-indigo-600 font-medium">#{marker.keyword}</p>
                        <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                        <p className="text-sm text-gray-700">${product.price}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-100 overflow-x-auto text-[11px] text-gray-700">
        <span className="font-semibold text-gray-900 flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-indigo-600" /> 상품 태그 편집
        </span>
        {markers.map((marker) => {
          const product = products.find((p) => p.id === marker.productId);
          if (!product) return null;
          return (
            <span
              key={`rail-${marker.id}`}
              draggable
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-dashed border-gray-300 bg-white shadow-sm hover:border-indigo-200 cursor-grab"
              title="드래그로 위치를 조정하는 데모"
            >
              <span className="font-mono text-[10px] text-gray-500">{formatTime(marker.start)}</span>
              <span className="text-gray-900 font-semibold truncate max-w-[120px]">{product.name}</span>
            </span>
          );
        })}
        <span className="text-gray-500">드래그&드롭으로 태그 위치를 조정하는 UI 데모</span>
      </div>

      {/* Desktop inline purchase CTA when hotspot mode is on */}
      {mode === 'hotspot' && activeProduct && activeMarker && (
        <div className="hidden lg:flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
              {formatTime(activeMarker.start)} - {formatTime(activeMarker.end)}
            </span>
            <span className="text-gray-900 font-semibold truncate">{activeProduct.name}</span>
            <span className="text-indigo-700 font-semibold">${activeProduct.price}</span>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg"
              onClick={() => handleSelectMarker(activeMarker)}
            >
              위치로 이동
            </button>
            <button
              className="px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg"
              onClick={() => handleBuy(activeProduct.id, 'hotspot_desktop')}
            >
              장바구니 담기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppableVideo;
