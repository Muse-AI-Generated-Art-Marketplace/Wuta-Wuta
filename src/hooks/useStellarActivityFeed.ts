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
  const addPriceUpdate = useActivityStore((state) => state.addPriceUpdate);
  const addNewArtwork = useActivityStore((state) => state.addNewArtwork);
  const addBidUpdate = useActivityStore((state) => state.addBidUpdate);
  
  const wsRef = useRef<WebSocket | null>(null);
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

        // Handle different message types
        if (isActivityMessage(payload)) {
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
        } else if (isPriceUpdateMessage(payload)) {
          addPriceUpdate(payload.data);
        } else if (isNewArtworkMessage(payload)) {
          addNewArtwork(payload.data);
        } else if (isBidUpdateMessage(payload)) {
          addBidUpdate(payload.data);
        } else {
          console.warn('[LiveFeed] Unknown message type:', payload);
        }
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
  }, [addActivity, addPriceUpdate, addNewArtwork, addBidUpdate]);
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

interface PriceUpdateMessage {
  type: 'price_update';
  data: {
    tokenId: string;
    currentPrice: number;
    previousPrice: number;
    change: number;
    changePercent: number;
    timestamp: number;
    currency: 'XLM' | 'ETH';
  };
}

function isPriceUpdateMessage(payload: unknown): payload is PriceUpdateMessage {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as any).type === 'price_update' &&
    typeof (payload as any).data === 'object'
  );
}

interface NewArtworkMessage {
  type: 'new_artwork';
  data: {
    id: string;
    title: string;
    creator: string;
    imageUrl: string;
    initialPrice: number;
    timestamp: number;
    currency: 'XLM' | 'ETH';
  };
}

function isNewArtworkMessage(payload: unknown): payload is NewArtworkMessage {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as any).type === 'new_artwork' &&
    typeof (payload as any).data === 'object'
  );
}

interface BidUpdateMessage {
  type: 'bid_update';
  data: {
    artworkId: string;
    bidId: string;
    bidder: string;
    amount: number;
    timestamp: number;
    isHighest: boolean;
    currency: 'XLM' | 'ETH';
  };
}

function isBidUpdateMessage(payload: unknown): payload is BidUpdateMessage {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as any).type === 'bid_update' &&
    typeof (payload as any).data === 'object'
  );
}