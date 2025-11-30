import React, { useEffect, useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts';
import { TrendingUp, MousePointer2, Eye, DollarSign, AlertCircle } from 'lucide-react';
import ShoppableVideo from './ShoppableVideo';
import ShopTheStory from './ShopTheStory';
import { fetchSearchTrends, fetchShoppingInsight } from '../services/api';

const StatCard: React.FC<{ title: string; value: string; trend: string; icon: React.ElementType }> = ({ 
  title, value, trend, icon: Icon 
}) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
      </div>
      <div className="p-2 bg-indigo-50 rounded-lg">
        <Icon className="w-5 h-5 text-indigo-600" />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <span className="text-green-600 font-medium flex items-center">
        <TrendingUp className="w-3 h-3 mr-1" />
        {trend}
      </span>
      <span className="text-gray-400 ml-2">지난주 대비</span>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [channel, setChannel] = useState<'all' | 'article' | 'shortform' | 'widget'>('all');
  const [placement, setPlacement] = useState<'all' | 'inline' | 'banner' | 'sidebar'>('all');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [shoppingData, setShoppingData] = useState<any[]>([]);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [loadingShopping, setLoadingShopping] = useState(false);
  const [errorTrend, setErrorTrend] = useState<string | null>(null);
  const [errorShopping, setErrorShopping] = useState<string | null>(null);

  const filteredAnalytics = useMemo(() => [], [range, channel, placement]);

  useEffect(() => {
    setLoadingTrend(true);
    setErrorTrend(null);
    fetchSearchTrends({
      startDate: '2024-11-01',
      endDate: '2024-11-30',
      timeUnit: 'date',
      keywordGroups: [
        { groupName: '패션', keywords: ['니트', '셔츠', '자켓'] },
        { groupName: '라이프', keywords: ['컵', '머그', '커피'] },
      ],
    })
      .then((res: any) => setTrendData(res.results || []))
      .catch((err) => setErrorTrend(err instanceof Error ? err.message : '트렌드 데이터를 불러오지 못했습니다.'))
      .finally(() => setLoadingTrend(false));
  }, []);

  useEffect(() => {
    setLoadingShopping(true);
    setErrorShopping(null);
    fetchShoppingInsight({
      startDate: '2024-11-01',
      endDate: '2024-12-01',
      timeUnit: 'month',
      category: '50000000',
      device: '',
      gender: '',
      ages: ['20', '30', '40'],
    })
      .then((res: any) => setShoppingData(res.results || []))
      .catch((err) => setErrorShopping(err instanceof Error ? err.message : '쇼핑 인사이트를 불러오지 못했습니다.'))
      .finally(() => setLoadingShopping(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">대시보드</h2>
          <p className="text-gray-500 mt-1">문맥 기반 커머스 성과에 대한 개요입니다.</p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-sm px-3 py-1 rounded-md border ${
                range === r ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-200'
              }`}
            >
              {r === '7d' ? '최근 7일' : r === '30d' ? '최근 30일' : '최근 90일'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="총 노출 수" value="12,450" trend="+12.5%" icon={Eye} />
        <StatCard title="상품 클릭 수" value="842" trend="+8.2%" icon={MousePointer2} />
        <StatCard title="평균 클릭률(CTR)" value="6.7%" trend="+1.4%" icon={TrendingUp} />
        <StatCard title="추정 수익" value="$4,250" trend="+22.1%" icon={DollarSign} />
      </div>

      <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600">
        <span className="font-semibold text-gray-800">필터</span>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as typeof channel)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white"
        >
          <option value="all">채널: 전체</option>
          <option value="article">기사</option>
          <option value="shortform">숏폼</option>
          <option value="widget">위젯</option>
        </select>
        <select
          value={placement}
          onChange={(e) => setPlacement(e.target.value as typeof placement)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white"
        >
          <option value="all">위치: 전체</option>
          <option value="inline">인라인</option>
          <option value="banner">배너</option>
          <option value="sidebar">사이드바</option>
        </select>
        <span className="text-xs text-gray-400">* 샘플 데이터 기준 뷰 (필터는 UI 상태만 반영)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">트래픽 및 클릭</h3>
            <span className="text-xs text-gray-400">실데이터 연동 필요</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredAnalytics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="impressions" name="노출수" fill="#E0E7FF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicks" name="클릭수" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">클릭률 (CTR)</h3>
            <span className="text-xs text-gray-400">실데이터 연동 필요</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredAnalytics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} unit="%" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="ctr" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">검색 트렌드 (데이터랩)</h3>
            {loadingTrend && <span className="text-xs text-gray-500">불러오는 중...</span>}
          </div>
          {errorTrend && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-2">
              <AlertCircle className="w-4 h-4" /> {errorTrend}
            </div>
          )}
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={(trendData[0]?.data ?? []).map((d: any) => ({ date: d.period, value: d.ratio }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} dot={{ r: 3, fill: '#4F46E5' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">쇼핑 인사이트 (데이터랩)</h3>
            {loadingShopping && <span className="text-xs text-gray-500">불러오는 중...</span>}
          </div>
          {errorShopping && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-2">
              <AlertCircle className="w-4 h-4" /> {errorShopping}
            </div>
          )}
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(shoppingData[0]?.data ?? []).map((d: any) => ({ category: d.period || d.group || '기타', value: d.ratio || d.value }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="비율" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">쇼퍼블 비디오 프리뷰 가이드</h4>
            <p className="text-sm text-gray-600">타임라인·상품 태그를 확인하며 운영자가 바로 편집/검수할 수 있는 시뮬레이션입니다.</p>
            <ul className="mt-2 text-xs text-gray-500 space-y-1 list-disc pl-4">
              <li>모드 전환: 사이드바 vs 핫스팟, 타임코드 기반 CTA 테스트</li>
              <li>마커 클릭 시 해당 시간대로 점프, 이벤트 로깅 연동</li>
              <li>타임라인/마커 개수와 시간대를 확인하며 태그 정확도 검수</li>
            </ul>
          </div>
          <ShoppableVideo />
        </div>
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Shop the Story 편집 가이드</h4>
            <p className="text-sm text-gray-600">스토리별 상품 태그와 배치 상태를 검수·수정하기 위한 프리뷰입니다.</p>
            <ul className="mt-2 text-xs text-gray-500 space-y-1 list-disc pl-4">
              <li>상품 썸네일/텍스트 확인 후 태그 교체·순서 조정</li>
              <li>하단 미니바로 전체 상품 수, 노출 상태 확인</li>
              <li>스크롤 노출/클릭 이벤트가 정상 로깅되는지 콘솔에서 확인</li>
            </ul>
          </div>
          <ShopTheStory />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
