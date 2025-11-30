import React from 'react';
import { AppView } from '../types';
import { ShoppingBag, Wand2, LogOut, Home, FileText, PlaySquare, Search } from 'lucide-react';
import ConsentBanner from './ConsentBanner';

interface LayoutProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, setCurrentView, children }) => {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const navItems = [
    { view: AppView.HOME, label: '홈', icon: Home },
    { view: AppView.ARTICLE, label: '기사 뷰', icon: FileText },
    { view: AppView.SEARCH, label: '검색', icon: Search },
    { view: AppView.ANALYZER, label: '영상·기사 분석', icon: Wand2 },
    { view: AppView.PRODUCTS, label: '상품 카탈로그', icon: ShoppingBag },
    // 위젯 & 임베드 메뉴는 요구사항 범위를 벗어나 제거
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[60] px-3 py-2 bg-white text-indigo-700 border border-indigo-200 rounded shadow focus:outline-none focus:ring-2 focus:ring-indigo-400 -translate-y-16 focus:translate-y-0 transition-transform"
      >
        본문 바로가기
      </a>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <Wand2 className="w-6 h-6" />
            <span>Contextual AI</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">커머스 인텔리전스</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 w-full rounded-lg hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative" id="main-content">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between md:hidden">
          <span className="font-bold text-indigo-600">Contextual AI</span>
          <button
            className="p-2 text-gray-600 rounded-lg border border-gray-200"
            aria-label="모바일 메뉴 열기"
            onClick={() => setMobileNavOpen(true)}
          >
            메뉴
          </button>
        </header>
        <div className="p-6 max-w-screen-2xl mx-auto min-h-full">
          {children}
        </div>
        <ConsentBanner />
      </main>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
            aria-label="메뉴 닫기"
          ></div>
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl border-r border-gray-200 flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-indigo-600">Contextual AI</p>
                <p className="text-xs text-gray-400">커머스 인텔리전스</p>
              </div>
              <button
                className="text-gray-500 hover:text-gray-800"
                onClick={() => setMobileNavOpen(false)}
                aria-label="모바일 메뉴 닫기"
              >
                닫기
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => {
                      setCurrentView(item.view);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
