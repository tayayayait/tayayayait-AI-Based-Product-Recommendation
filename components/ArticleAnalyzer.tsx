import React, { useEffect, useMemo, useState } from 'react';
import { Product, Match } from '../types';
import { analyzeArticle, saveApprovedMatches, fetchProducts } from '../services/api';
import { Wand2, Check, X, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface ArticleAnalyzerProps {
  onMatchesApproved: (matches: Match[]) => void;
}

const ArticleAnalyzer: React.FC<ArticleAnalyzerProps> = ({ onMatchesApproved }) => {
  const [step, setStep] = useState<'input' | 'processing' | 'review'>('input');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [insights, setInsights] = useState<{
    brands: string[];
    models: string[];
    features: string[];
    sentiment: { positive: number; negative: number; neutral: number; keywords: string[] };
    summary: string;
    risks: string[];
  }>({
    brands: [],
    models: [],
    features: [],
    sentiment: { positive: 0.33, negative: 0.33, neutral: 0.34, keywords: [] },
    summary: '',
    risks: [],
  });

  useEffect(() => {
    setLoadingProducts(true);
    fetchProducts('패션')
      .then(({ products }) => setProducts(products))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);
  const handleFillSample = () => {
    setTitle('샘플 기사 제목');
    setContent(`샘플 기사: 애플이 공개한 아이폰 16 Pro는 AI 카메라와 밝기 2600nit을 제공한다.
삼성전자 갤럭시 S24 울트라와 비교했을 때 AI 줌 개선과 저전력 모드가 강점으로 언급된다.
리뷰어들은 선명하다, 빠르다 같은 긍정적 피드백을 남겼지만 가격이 비싸다, 배터리가 아쉽다는 의견도 있다.`);
  };

  const buildInsights = (text: string) => {
    const lower = text.toLowerCase();
    const brandDict = ['삼성', '삼성전자', 'lg', '엘지', '애플', 'apple', '현대', 'hyundai', '샤오미'];
    const modelDict = ['아이폰', '갤럭시', '무풍에어컨', '맥북', 's24', 's23', 'airpods', '아이패드'];
    const featureDict = ['ai', '밝기', '배터리', '줌', '저전력', '방수', '카메라', '센서', '칩', '프로세서'];
    const positive = ['좋다', '만족', '선명', '빠르', '향상', '개선', '강점'];
    const negative = ['비싸', '아쉽', '느리', '발열', '불만', '불편', '리스크'];

    const brands = brandDict.filter((b) => text.includes(b));
    const models = modelDict.filter((m) => lower.includes(m.toLowerCase()));
    const features = featureDict.filter((f) => lower.includes(f));

    const posHits = positive.filter((w) => text.includes(w)).length;
    const negHits = negative.filter((w) => text.includes(w)).length;
    const totalHits = Math.max(1, posHits + negHits);
    const sentiment = {
      positive: Number((posHits / totalHits).toFixed(2)),
      negative: Number((negHits / totalHits).toFixed(2)),
      neutral: Number((1 - (posHits + negHits) / (totalHits * 2)).toFixed(2)),
      keywords: [...new Set([...positive.filter((w) => text.includes(w)), ...negative.filter((w) => text.includes(w))])],
    };

    const summary = text.slice(0, 140) + (text.length > 140 ? '...' : '');
    const risks = negHits > 0 ? ['가격 민감도', '배터리/성능 불만 가능성'] : ['리스크 없음'];

    return { brands, models, features, sentiment, summary, risks };
  };

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setStep('processing');
    setError(null);

    try {
      const analyzed = await analyzeArticle({
        title: title || 'Untitled Article',
        content,
        articleId: 'demo_article',
      });
      const nextInsights = buildInsights(content);
      setInsights(nextInsights);

      const keywords = [
        ...nextInsights.brands,
        ...nextInsights.models,
        ...nextInsights.features,
        ...nextInsights.sentiment.keywords,
      ].filter(Boolean);

      const generatedMatches = await generateMatchesFromProducts(keywords);
      const fallbackMatches = analyzed && analyzed.length > 0 ? analyzed : generatedMatches;
      setMatches(fallbackMatches);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
      setStep('input');
    }
  };

  const toggleApproval = (matchId: string) => {
    setMatches(matches.map(m => 
      m.id === matchId ? { ...m, isApproved: !m.isApproved } : m
    ));
  };

  const getProduct = (id: string) => products.find(p => p.id === id);
  const hasInsights = useMemo(() => insights.summary || insights.brands.length > 0 || insights.features.length > 0, [insights]);

  const generateMatchesFromProducts = async (keywords: string[]): Promise<Match[]> => {
    const uniqueKeywords = Array.from(new Set(keywords)).filter((k) => k.trim().length > 1);
    const seed = uniqueKeywords[0] || title || '추천';

    try {
      const { products: fetched } = await fetchProducts(seed);
      const scored = fetched.map((p) => {
        const haystack = `${p.name} ${p.description || ''}`.toLowerCase();
        const hits = uniqueKeywords.filter((kw) => haystack.includes(kw.toLowerCase()));
        const baseScore = hits.length * 20 + (haystack.includes(seed.toLowerCase()) ? 15 : 0);
        const normalized = Math.min(100, Math.max(50, baseScore));
        return { product: p, score: normalized, keyword: hits[0] || seed };
      });
      const top = scored.sort((a, b) => b.score - a.score).slice(0, 5);
      return top.map((item, idx) => ({
        id: `kw-${item.product.id}-${idx}`,
        articleId: 'demo_article',
        productId: item.product.id,
        matchedKeyword: item.keyword,
        contextSentence: content.slice(0, 140) || item.product.description || '추출 키워드 기반 매칭',
        contextScore: item.score,
        isApproved: true,
        reasonLabel: '키워드 매칭',
      }));
    } catch (e) {
      return [];
    }
  };

  // Helper to render text with highlights
  const renderHighlightedContent = () => {
    // Simplified visual rendering for MVP:
    return (
      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
        {content.split('\n').map((line, i) => (
           <p key={i} className="mb-4">
             {line.split(' ').map((word, wI) => {
               const cleanWord = word.replace(/[.,]/g, '');
               const match = matches.find(m => m.matchedKeyword.toLowerCase().includes(cleanWord.toLowerCase()) && cleanWord.length > 2);
               
               if (match) {
                 const isSelected = match.isApproved;
                 return (
                   <span 
                    key={wI} 
                    className={`inline-block px-1 rounded mx-0.5 cursor-pointer transition-colors border-b-2 ${
                        isSelected 
                            ? 'bg-indigo-100 border-indigo-500 text-indigo-900 font-medium' 
                            : 'bg-yellow-50 border-yellow-300 text-gray-900'
                    }`}
                   >
                     {word}
                   </span>
                 );
               }
               return <span key={wI} className="mx-0.5">{word}</span>;
             })}
           </p>
        ))}
      </div>
    );
  };

  const handleApproveAndGenerate = async () => {
    const approved = matches.filter((m) => m.isApproved);
    if (approved.length === 0) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const articleId = approved[0].articleId ?? 'demo_article';
      await saveApprovedMatches(articleId, approved);
      onMatchesApproved(approved);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '승인된 매칭을 저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (step === 'input') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">기사 분석</h2>
          <p className="text-gray-500 mt-1">기사 텍스트를 붙여넣어 커머스 기회를 자동으로 식별하세요.</p>
          <button
            type="button"
            onClick={handleFillSample}
            className="mt-3 inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700"
          >
            샘플 문구 채우기
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">기사 제목</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="예: 2024 여름 필수 아이템 가이드"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">본문 내용</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder="여기에 본문 전체를 붙여넣으세요..."
            />
             <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                <span>{content.length} 글자</span>
                <button 
                  onClick={() => {
                    setTitle('여름 패션: 이번 주말에 입을 옷');
                    setContent(`드디어 해가 떴습니다. 이제 옷장을 업데이트할 때입니다. \n\n캐주얼한 룩에는 클래식 블루 린넨 셔츠만한 것이 없습니다. 통기성이 좋고 스타일리시해서 해변이나 카페 점심 식사에 제격입니다. \n\n여행을 계획 중이라면 내구성이 좋은 여행 가방을 꼭 챙기세요. 가죽 제품은 세월이 흐를수록 멋스러워지기 때문에 좋은 선택입니다. \n\n액세서리도 잊지 마세요. 미니멀리스트 손목시계는 너무 튀지 않으면서도 전체적인 코디를 완성해줍니다.`);
                  }}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  샘플 데이터 채우기
                </button>
             </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleAnalyze}
            disabled={!content}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
          >
            <Wand2 className="w-4 h-4" />
            문맥 분석
          </button>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="relative">
            <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-white p-4 rounded-full shadow-lg border border-indigo-100">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        </div>
        <h3 className="mt-6 text-xl font-bold text-gray-900">문맥 분석 중...</h3>
        <p className="text-gray-500 mt-2 max-w-md">AI가 기사를 읽고 의도를 파악하여 카탈로그에서 적합한 상품을 매칭하고 있습니다.</p>
      </div>
    );
  }

  const approvedCount = matches.filter(m => m.isApproved).length;
  const totalMatches = matches.length;
  const avgContextScore = totalMatches
    ? Math.round(matches.reduce((acc, curr) => acc + curr.contextScore, 0) / totalMatches)
    : 0;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">매칭 검토</h2>
          <p className="text-gray-500 text-sm">AI가 제안한 상품 배치를 검토하고 승인하세요.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
             {totalMatches}개 중 {approvedCount}개 승인됨
           </div>
           <button 
             onClick={handleApproveAndGenerate}
             disabled={approvedCount === 0 || isSaving}
             className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md"
           >
             {isSaving ? (
               <>
                 <Loader2 className="w-4 h-4 animate-spin" /> 저장 중...
               </>
             ) : (
               <>
                 위젯 생성 <ArrowRight className="w-4 h-4" />
               </>
             )}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">총 매칭</p>
          <p className="text-2xl font-bold text-gray-900">{totalMatches}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">승인 수</p>
          <p className="text-2xl font-bold text-indigo-700">{approvedCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">평균 컨텍스트 점수</p>
          <p className="text-2xl font-bold text-gray-900">{avgContextScore}%</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">예상 CTR (샘플)</p>
          <p className="text-2xl font-bold text-emerald-600">~{Math.max(2, Math.round(approvedCount * 1.2))}%</p>
          <p className="text-[11px] text-gray-400 mt-1">데이터 연결 시 자동 업데이트</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-indigo-700 font-semibold">결과 요약</p>
          <p className="text-sm text-gray-800">매칭 {approvedCount}건 승인, 컨텍스트 {avgContextScore}%</p>
          <p className="text-xs text-gray-500 mt-1">추출된 키워드로 위젯 생성 준비</p>
        </div>
      </div>

      {hasInsights && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2">
          <p className="text-xs uppercase font-semibold text-indigo-600">추출 엔터티</p>
          <p className="text-sm text-gray-700">브랜드: <span className="font-semibold text-gray-900">{insights.brands.join(', ') || '없음'}</span></p>
          <p className="text-sm text-gray-700">모델: <span className="font-semibold text-gray-900">{insights.models.join(', ') || '없음'}</span></p>
          <p className="text-sm text-gray-700">특징: <span className="font-semibold text-gray-900">{insights.features.slice(0, 5).join(', ') || '없음'}</span></p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2">
          <p className="text-xs uppercase font-semibold text-indigo-600">감정 분석</p>
          <p className="text-sm text-gray-700">긍정 {Math.round(insights.sentiment.positive * 100)}% · 부정 {Math.round(insights.sentiment.negative * 100)}% · 중립 {Math.round(insights.sentiment.neutral * 100)}%</p>
          <p className="text-sm text-gray-600">키워드: {insights.sentiment.keywords.slice(0, 5).join(', ') || '없음'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2">
          <p className="text-xs uppercase font-semibold text-indigo-600">요약/리스크</p>
          <p className="text-sm text-gray-700 line-clamp-3">{insights.summary || '요약 없음'}</p>
          <p className="text-xs text-gray-500">리스크: {insights.risks.join(', ') || '없음'}</p>
        </div>
      </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">키워드별 매칭 차트</p>
          <span className="text-xs text-gray-400">샘플 데이터</span>
        </div>
        <div className="mt-3 h-40 rounded-lg bg-white border border-dashed border-gray-200 p-3">
          <div className="grid grid-cols-4 gap-3 h-full">
            {matches.slice(0, 4).map((m) => (
              <div key={m.id} className="flex flex-col justify-end gap-2">
                <div className="flex items-center justify-between text-[11px] text-gray-600">
                  <span className="truncate max-w-[80px]">#{m.matchedKeyword}</span>
                  <span className="font-semibold text-indigo-700">{m.contextScore}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full text-[10px] text-white flex items-center justify-center"
                    style={{ width: `${Math.min(m.contextScore, 100)}%` }}
                    title={`${m.contextScore}%`}
                  >
                    {m.contextScore}%
                  </div>
                </div>
              </div>
            ))}
            {matches.length === 0 && (
              <div className="col-span-4 flex items-center justify-center text-xs text-gray-400">
                매칭 결과가 없습니다. 분석을 먼저 실행하세요.
              </div>
            )}
          </div>
        </div>
      </div>

      {saveError && (
        <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        {/* Left: Article View */}
        {showPreview && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">기사 미리보기</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-xs text-gray-500 hover:text-gray-800"
              >
                접기
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
               <h1 className="text-2xl font-bold mb-4 text-gray-900">{title || '제목 없음'}</h1>
               <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap space-y-3">
                 {content.split('\\n').map((line, idx) => (
                   <p key={idx} className="mb-1">{line || '\\u00A0'}</p>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* Right: Matches */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
          {matches.map((match) => {
            const product = getProduct(match.productId);
            if (!product) return null;

            return (
              <div 
                key={match.id}
                className={`group relative bg-white p-5 rounded-xl border transition-all duration-200 ${
                  match.isApproved 
                    ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' 
                    : 'border-gray-200 hover:border-indigo-300 shadow-sm'
                }`}
              >
                <div className="flex gap-4">
                    <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
                                <p className="text-indigo-600 font-medium mt-0.5">${product.price}</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                <Wand2 className="w-3 h-3" />
                                {match.contextScore}% 일치
                            </div>
                        </div>
                        
                        <div className="mt-3 flex items-start gap-2 bg-yellow-50 p-2 rounded-md border border-yellow-100">
                             <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                             <p className="text-sm text-yellow-800 italic">"{match.contextSentence}"</p>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                            매칭된 키워드: <span className="font-medium text-gray-700">{match.matchedKeyword}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex gap-3 pt-4 border-t border-gray-100">
                    {match.isApproved ? (
                        <button 
                            onClick={() => toggleApproval(match.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" /> 승인 취소
                        </button>
                    ) : (
                        <>
                            <button className="flex-1 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                문맥 수정
                            </button>
                            <button 
                                onClick={() => toggleApproval(match.id)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <Check className="w-4 h-4" /> 매칭 승인
                            </button>
                        </>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ArticleAnalyzer;
