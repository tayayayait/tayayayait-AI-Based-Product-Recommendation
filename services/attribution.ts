export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const STORAGE_KEY = 'cc_attribution';

const safeParse = (value: string | null): Attribution | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as Attribution;
  } catch {
    return null;
  }
};

const pickUtm = (searchParams: URLSearchParams): Attribution => {
  const utmSource = searchParams.get('utm_source') ?? undefined;
  const utmMedium = searchParams.get('utm_medium') ?? undefined;
  const utmCampaign = searchParams.get('utm_campaign') ?? undefined;
  const result: Attribution = {};
  if (utmSource) result.utmSource = utmSource;
  if (utmMedium) result.utmMedium = utmMedium;
  if (utmCampaign) result.utmCampaign = utmCampaign;
  return result;
};

export const captureAttributionFromUrl = (): Attribution | null => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const utm = pickUtm(params);
  if (Object.keys(utm).length === 0) return null;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utm));
  return utm;
};

export const getAttribution = (): Attribution => {
  if (typeof window === 'undefined') return {};
  const stored = safeParse(window.sessionStorage.getItem(STORAGE_KEY));
  if (stored) return stored;
  const captured = captureAttributionFromUrl();
  return captured ?? {};
};
