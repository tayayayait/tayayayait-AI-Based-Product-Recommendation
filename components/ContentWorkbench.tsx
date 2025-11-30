import React from 'react';
import ArticleAnalyzer from './ArticleAnalyzer';
import ShortformViewer from './ShortformViewer';

const ContentWorkbench: React.FC = () => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <div className="xl:col-span-3 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-indigo-600">영상 인식</p>
            <h2 className="text-xl font-bold text-gray-900">숏폼 뷰어 · 타임코드 매칭</h2>
            <p className="text-sm text-gray-500">영상에서 상품을 찾고, 바로 오른쪽에서 기사 매칭을 검수하세요.</p>
          </div>
        </div>
        <ShortformViewer />
      </div>

      <div className="xl:col-span-2 space-y-4">
        <div>
          <p className="text-xs uppercase font-semibold text-indigo-600">기사 분석</p>
          <h2 className="text-xl font-bold text-gray-900">텍스트 키워드 추출 · 상품 매칭 검수</h2>
          <p className="text-sm text-gray-500">기사 본문을 넣고 키워드/매칭 결과를 바로 승인하세요.</p>
        </div>
        <ArticleAnalyzer onMatchesApproved={() => undefined} />
      </div>
    </div>
  );
};

export default ContentWorkbench;
