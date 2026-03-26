const { WebSocketServer, OPEN } = require('ws');

/**
 * ActivityBroadcaster
 *
 * Attaches a WebSocket server to the existing Express HTTP server so both
 * REST and WebSocket traffic share a single port. The Stellar listener calls
 * broadcast() when an on-chain event is parsed; every connected frontend
 * client receives it immediately.
 *
 * Client connection: ws://localhost:3001/live-feed
 *
 * Message shape sent to clients:
 * {
 *   type: 'activity',
 *   data: {
 *     id:        string,   // tx hash
 *     chain:     'STELLAR' | 'EVM',
 *     type:      'MINT' | 'TRADE' | 'BID' | 'AUCTION' | 'LIST' | 'OTHER',
 *     from:      string,
 *     to?:       string,
 *     tokenId?:  string,
 *     price?:    number,
 *     timestamp: number,
 *     eventType: string,   // raw Stellar event type e.g. 'ARTWORK_SOLD'
 *   }
 * }
 */
class ActivityBroadcaster {
  constructor() {
    this.wss = null;
  }

  /**
   * Attach the WebSocket server to an existing http.Server instance.
   * Must be called after app.listen() returns the server.
   *
   * @param {import('http').Server} httpServer
   */
  attach(httpServer) {
    this.wss = new WebSocketServer({ server: httpServer, path: '/live-feed' });

    this.wss.on('connection', (ws, req) => {
      const ip = req.socket.remoteAddress;
      console.log(`🔌 Live feed client connected from ${ip}`);

      // Send a welcome ping so the client knows the connection is live
      this._send(ws, { type: 'connected', message: 'Live feed connected' });

      ws.on('close', () => console.log(`🔌 Live feed client disconnected from ${ip}`));
      ws.on('error', (err) => console.error(`Live feed WS error from ${ip}:`, err.message));
    });

    // Heartbeat — ping every 30s, drop dead connections
    this._startHeartbeat();

    console.log('📡 ActivityBroadcaster attached on path /live-feed');
  }

  /**
   * Broadcast a normalised activity event to all connected clients.
   *
   * @param {object} rawEvent  Parsed Stellar event from stellarListener
   * @param {string} txHash    Stellar transaction ID
   * @param {string} eventType Mapped event type e.g. 'ARTWORK_MINTED'
   */
  broadcast(rawEvent, txHash, eventType) {
    if (!this.wss) return;

    const activity = this._normalise(rawEvent, txHash, eventType);
    const message  = JSON.stringify({ type: 'activity', data: activity });

    let delivered = 0;
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === OPEN) {
        ws.send(message);
        delivered++;
      }
    });

    if (delivered > 0) {
      console.log(`📡 Broadcast [${eventType}] → ${delivered} client(s)`);
    }
  }

  /** Map a Stellar event to the unified Activity shape the frontend stores. */
  _normalise(event, txHash, eventType) {
    const parsed = event.parsedData || {};

    // Map Stellar event types to the frontend's simpler type labels
    const typeMap = {
      ARTWORK_MINTED:           'MINT',
      ARTWORK_SOLD:             'TRADE',
      AUCTION_ENDED:            'TRADE',
      BID_MADE:                 'BID',
      ARTWORK_LISTED:           'LIST',
      LISTING_CANCELLED:        'LIST',
      ARTWORK_EVOLVED:          'OTHER',
      MARKETPLACE_INITIALIZED:  'OTHER',
    };

    return {
      id:        txHash,
      chain:     'STELLAR',
      type:      typeMap[eventType] || 'OTHER',
      from:      parsed.seller || parsed.creator || parsed.owner || 'unknown',
      to:        parsed.buyer  || undefined,
      tokenId:   parsed.token_id ? String(parsed.token_id) : undefined,
      price:     parsed.price    || undefined,
      timestamp: Date.now(),
      eventType,
    };
  }

  /** @private */
  _send(ws, payload) {
    if (ws.readyState === OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  /** @private Ping/pong heartbeat to detect and clean up dead connections. */
  _startHeartbeat() {
    const interval = setInterval(() => {
      if (!this.wss) return clearInterval(interval);
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      });
    }, 30_000);

    this.wss.on('connection', (ws) => {
      ws.isAlive = true;
      ws.on('pong', () => { ws.isAlive = true; });
    });

    this.wss.on('close', () => clearInterval(interval));
  }

  async close() {
    if (!this.wss) return;
    await new Promise((resolve) => this.wss.close(resolve));
    console.log('📡 ActivityBroadcaster closed');
  }
}

// Export a singleton — both server/index.js and stellarListener share the same instance
module.exports = new ActivityBroadcaster();