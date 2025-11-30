import { useCallback, useEffect, useMemo } from 'react';
import { getAttribution } from './attribution';
import { getConsent } from './consent';

export type EventName =
  | 'video_started'
  | 'video_completed'
  | 'marker_visible'
  | 'product_click'
  | 'add_to_cart'
  | 'product_impression'
  | 'scroll_depth'
  | 'widget_loaded'
  | 'page_view';

export interface EventPayload {
  event: EventName;
  contentId?: string;
  productId?: string;
  matchedKeyword?: string;
  widgetVersion?: string;
  location?: {
    // For video: seconds; for articles: paragraph index, etc.
    timecodeSeconds?: number;
    scrollDepthPercent?: number;
  };
  viewable?: boolean;
  cta?: string;
  attribution?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
  metadata?: Record<string, string | number | boolean | null>;
}

interface QueuedEvent extends EventPayload {
  sessionId: string;
  occurredAt: string;
}

const inMemoryQueue: QueuedEvent[] = [];

const API_BASE: string | undefined =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || undefined;

const EVENT_ENDPOINT =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_EVENT_ENDPOINT) ||
  (API_BASE ? `${API_BASE}/events` : '/api/events');

const FLUSH_INTERVAL_MS = 15000;

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `sess_${Math.random().toString(36).slice(2, 10)}`;
};

export const logEvent = (sessionId: string, payload: EventPayload): QueuedEvent | null => {
  const consent = getConsent();
  if (consent.tracking !== 'granted') {
    // eslint-disable-next-line no-console
    console.debug('[event:skipped]', payload.event, 'tracking consent not granted');
    return null;
  }

  const attribution = payload.attribution ?? getAttribution();
  const metadata = { consent: consent.tracking, ...(payload.metadata ?? {}) };

  const enriched: QueuedEvent = {
    ...payload,
    metadata,
    attribution,
    sessionId,
    occurredAt: new Date().toISOString(),
  };
  inMemoryQueue.push(enriched);
  // For now, surface in console to aid dev; replace with network call later.
  // eslint-disable-next-line no-console
  console.debug('[event]', enriched);
  return enriched;
};

export const flushEvents = () => {
  const snapshot = [...inMemoryQueue];
  inMemoryQueue.length = 0;
  return snapshot;
};

export const flushEventsToConsole = () => {
  const events = flushEvents();
  if (events.length === 0) return { sent: 0 };
  // eslint-disable-next-line no-console
  console.info('[event:flush]', events.length, 'events', events);
  return { sent: events.length };
};

export const flushEventsToEndpoint = async () => {
  const events = flushEvents();
  if (events.length === 0) return { sent: 0 };

  try {
    await fetch(EVENT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });
    return { sent: events.length };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[event:flush:error]', err);
    // re-queue on failure
    inMemoryQueue.unshift(...events);
    return { sent: 0, error: err instanceof Error ? err.message : 'unknown error' };
  }
};

export const useEventLogger = () => {
  const sessionId = useMemo(() => createSessionId(), []);
  const logFn = useCallback((payload: EventPayload) => logEvent(sessionId, payload), [sessionId]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (EVENT_ENDPOINT === '/api/events' && !API_BASE) {
        flushEventsToConsole();
      } else {
        flushEventsToEndpoint();
      }
    }, FLUSH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return {
    sessionId,
    log: logFn,
  };
};

/**
 * Send a single test event to verify the event endpoint wiring.
 */
export const sendTestEvent = async (payload?: Partial<EventPayload> & { respectConsent?: boolean }) => {
  const consent = getConsent();
  if (payload?.respectConsent !== false && consent.tracking !== 'granted') {
    return { sent: 0, error: 'consent_not_granted' };
  }

  const test: EventPayload = {
    event: 'page_view',
    contentId: payload?.contentId ?? 'test_content',
    widgetVersion: payload?.widgetVersion ?? 'test',
    ...payload,
  };

  const enriched: QueuedEvent = {
    ...test,
    sessionId: createSessionId(),
    occurredAt: new Date().toISOString(),
    attribution: test.attribution ?? getAttribution(),
  };

  try {
    await fetch(EVENT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: [enriched] }),
    });
    return { sent: 1 };
  } catch (err) {
    return { sent: 0, error: err instanceof Error ? err.message : 'unknown_error' };
  }
};
