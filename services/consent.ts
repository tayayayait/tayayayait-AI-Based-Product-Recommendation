export type ConsentStatus = 'granted' | 'denied' | 'unknown';

export interface ConsentState {
  tracking: ConsentStatus;
  updatedAt?: string;
}

const STORAGE_KEY = 'cc_consent';

const safeParse = (value: string | null): ConsentState | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as ConsentState;
  } catch {
    return null;
  }
};

export const getConsent = (): ConsentState => {
  if (typeof window === 'undefined') return { tracking: 'unknown' };
  const parsed = safeParse(window.localStorage.getItem(STORAGE_KEY));
  return parsed ?? { tracking: 'unknown' };
};

export const setConsent = (status: ConsentStatus) => {
  if (typeof window === 'undefined') return;
  const state: ConsentState = { tracking: status, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Dispatch a custom event so UI elements (e.g., consent banner) can react without reload.
  window.dispatchEvent(new CustomEvent('consent:changed', { detail: state }));
  return state;
};
