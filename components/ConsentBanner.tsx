import React, { useEffect, useState } from 'react';
import { getConsent, setConsent, ConsentStatus } from '../services/consent';
import { ShieldCheck } from 'lucide-react';

const ConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const { tracking } = getConsent();
    setVisible(tracking === 'unknown');
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { tracking?: ConsentStatus } | undefined;
      const next = detail?.tracking ?? getConsent().tracking;
      setVisible(next === 'unknown');
    };
    window.addEventListener('consent:changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('consent:changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const handleChoice = (choice: ConsentStatus) => {
    setConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:max-w-4xl px-2">
      <div className="bg-white/95 backdrop-blur border border-gray-200 shadow-lg shadow-gray-200 rounded-full px-4 py-3 sm:px-6 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">쿠키/트래킹 동의</p>
          <p className="text-xs sm:text-sm text-gray-600 leading-snug truncate">
            추천 품질과 퍼널 측정을 위해 최소 이벤트만 수집합니다. 한 번 선택하면 다시 묻지 않습니다.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleChoice('denied')}
            className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            거부
          </button>
          <button
            onClick={() => handleChoice('granted')}
            className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            허용
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;
