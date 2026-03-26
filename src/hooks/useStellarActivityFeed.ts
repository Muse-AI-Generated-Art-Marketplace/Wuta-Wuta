import { useEffect, useRef } from 'react';
import { useActivityStore } from '../store/useActivityStore';

const WS_URL = process.env.REACT_APP_LIVE_FEED_URL || 'ws://localhost:3001/live-feed';
const RECONNECT_DELAY_MS = 3_000;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * useStellarActivityFeed
 *
 * Opens a WebSocket connection to the server's /live-feed endpoint and
 * pushes incoming Stellar activity events into useActivityStore.
 *
 * Reconnects automatically on disconnect (up to MAX_RECONNECT_ATTEMPTS).
 * Safe to mount once at the app root — does nothing if the URL is not set.
 *
 * @example
 *   // Mount once in App.tsx or a top-level layout component
 *   useStellarActivityFeed();
 */
export function useStellarActivityFeed() {
  const addActivity = useActivityStore((state) => state.addActivity);
  const wsRef       = useRef<WebSocket | null>(null);
  const attemptsRef = useRef(0);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;
      if (attemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        console.warn(`[LiveFeed] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
        return;
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        attemptsRef.current = 0;
        console.log('[LiveFeed] Connected to live feed');
      };

      ws.onmessage = (event) => {
        let payload: unknown;
        try {
          payload = JSON.parse(event.data);
        } catch {
          console.warn('[LiveFeed] Received non-JSON message:', event.data);
          return;
        }

        if (!isActivityMessage(payload)) return;

        addActivity({
          id:        payload.data.id,
          chain:     'STELLAR',
          type:      payload.data.type,
          from:      payload.data.from,
          to:        payload.data.to,
          tokenId:   payload.data.tokenId,
          price:     payload.data.price,
          timestamp: payload.data.timestamp ?? Date.now(),
          eventType: payload.data.eventType,
        });
      };

      ws.onerror = (err) => {
        console.error('[LiveFeed] WebSocket error:', err);
      };

      ws.onclose = () => {
        if (unmountedRef.current) return;
        attemptsRef.current += 1;
        console.log(`[LiveFeed] Disconnected. Reconnecting in ${RECONNECT_DELAY_MS}ms (attempt ${attemptsRef.current})`);
        setTimeout(connect, RECONNECT_DELAY_MS);
      };
    }

    connect();

    return () => {
      unmountedRef.current = true;
      wsRef.current?.close();
    };
  }, [addActivity]);
}

// ── Type guard ────────────────────────────────────────────────────────────────

interface ActivityMessage {
  type: 'activity';
  data: {
    id: string;
    type: 'MINT' | 'TRADE' | 'BID' | 'LIST' | 'OTHER';
    from: string;
    to?: string;
    tokenId?: string;
    price?: number;
    timestamp?: number;
    eventType?: string;
  };
}

function isActivityMessage(payload: unknown): payload is ActivityMessage {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as any).type === 'activity' &&
    typeof (payload as any).data === 'object'
  );
}