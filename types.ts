export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  linkUrl: string;
  brand?: string;
  source?: 'api' | 'csv' | 'manual' | 'seed';
  updatedAt?: string;
  margin?: number | null;
  category?: string;
  rating?: number;
  badges?: string[];
  shortformMatches?: number;
  articleMatches?: number;
  aiScore?: number;
  tags?: string[];
  status?: 'active' | 'paused' | 'draft';
}

export interface Match {
  id: string;
  articleId: string;
  productId: string;
  matchedKeyword: string;
  contextSentence: string;
  contextScore: number;
  isApproved: boolean;
  reasonLabel?: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  category?: string;
  author?: string;
  heroImage?: string;
  videoLoopUrl?: string;
  readTimeMinutes?: number;
  tags?: string[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  PRODUCTS = 'PRODUCTS',
  ANALYZER = 'ANALYZER',
  HOME = 'HOME',
  ARTICLE = 'ARTICLE',
  SHORTFORM = 'SHORTFORM',
  SEARCH = 'SEARCH',
  PRODUCT_DETAIL = 'PRODUCT_DETAIL',
  ADMIN = 'ADMIN'
}

export interface AnalyticsData {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface VideoMarker {
  id: string;
  productId: string;
  start: number;
  end: number;
  position: { x: number; y: number };
  keyword: string;
}

export interface Shortform {
  id: string;
  title: string;
  category: string;
  brand?: string;
  videoUrl: string;
  posterUrl: string;
  markers: VideoMarker[];
  summary?: string;
}

export interface ReviewInsight {
  keyword: string;
  sentiment: 'positive' | 'negative' | 'mixed';
  score: number; // 0-100
  volume?: number;
  description?: string;
}

export type SearchResultType = 'article' | 'product' | 'video';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  snippet: string;
  imageUrl: string;
  tags?: string[];
  score: number;
  linkUrl?: string;
}
