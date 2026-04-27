const { WebSocketServer, OPEN } = require('ws');

/**
 * ActivityBroadcaster
 *
 * Attaches a WebSocket server to the existing Express HTTP server so both
 * REST and WebSocket traffic share a single port. The Stellar listener calls
 * broadcast() when an on-chain event is parsed; every connected frontend
 * client receives it immediately.
 *
 * Enhanced to support:
 * - Real-time price updates
 * - New artwork notifications  
 * - Live bidding functionality
 *
 * Client connection: ws://localhost:3001/live-feed
 *
 * Message shapes sent to clients:
 * 
 * Activity events:
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
 * 
 * Price update events:
 * {
 *   type: 'price_update',
 *   data: {
 *     tokenId: string,
 *     currentPrice: number,
 *     previousPrice: number,
 *     change: number,
 *     changePercent: number,
 *     timestamp: number,
 *     currency: 'XLM' | 'ETH'
 *   }
 * }
 * 
 * New artwork notifications:
 * {
 *   type: 'new_artwork',
 *   data: {
 *     id: string,
 *     title: string,
 *     creator: string,
 *     imageUrl: string,
 *     initialPrice: number,
 *     timestamp: number,
 *     currency: 'XLM' | 'ETH'
 *   }
 * }
 * 
 * Live bidding events:
 * {
 *   type: 'bid_update',
 *   data: {
 *     artworkId: string,
 *     bidId: string,
 *     bidder: string,
 *     amount: number,
 *     timestamp: number,
 *     isHighest: boolean,
 *     currency: 'XLM' | 'ETH'
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

  /**
   * Broadcast real-time price update to all connected clients.
   *
   * @param {object} priceData Price update information
   * @param {string} priceData.tokenId Artwork token ID
   * @param {number} priceData.currentPrice Current price
   * @param {number} priceData.previousPrice Previous price
   * @param {string} priceData.currency Currency ('XLM' | 'ETH')
   */
  broadcastPriceUpdate(priceData) {
    if (!this.wss) return;

    const change = priceData.currentPrice - priceData.previousPrice;
    const changePercent = priceData.previousPrice > 0 
      ? (change / priceData.previousPrice) * 100 
      : 0;

    const priceUpdate = {
      tokenId: priceData.tokenId,
      currentPrice: priceData.currentPrice,
      previousPrice: priceData.previousPrice,
      change,
      changePercent,
      timestamp: Date.now(),
      currency: priceData.currency || 'XLM'
    };

    const message = JSON.stringify({ type: 'price_update', data: priceUpdate });
    this._broadcastMessage(message, 'price_update');
  }

  /**
   * Broadcast new artwork notification to all connected clients.
   *
   * @param {object} artworkData New artwork information
   * @param {string} artworkData.id Artwork ID
   * @param {string} artworkData.title Artwork title
   * @param {string} artworkData.creator Creator address
   * @param {string} artworkData.imageUrl Artwork image URL
   * @param {number} artworkData.initialPrice Initial price
   * @param {string} artworkData.currency Currency ('XLM' | 'ETH')
   */
  broadcastNewArtwork(artworkData) {
    if (!this.wss) return;

    const artwork = {
      id: artworkData.id,
      title: artworkData.title,
      creator: artworkData.creator,
      imageUrl: artworkData.imageUrl,
      initialPrice: artworkData.initialPrice,
      timestamp: Date.now(),
      currency: artworkData.currency || 'XLM'
    };

    const message = JSON.stringify({ type: 'new_artwork', data: artwork });
    this._broadcastMessage(message, 'new_artwork');
  }

  /**
   * Broadcast live bidding update to all connected clients.
   *
   * @param {object} bidData Bid information
   * @param {string} bidData.artworkId Artwork ID
   * @param {string} bidData.bidId Bid ID
   * @param {string} bidData.bidder Bidder address
   * @param {number} bidData.amount Bid amount
   * @param {boolean} bidData.isHighest Whether this is the highest bid
   * @param {string} bidData.currency Currency ('XLM' | 'ETH')
   */
  broadcastBidUpdate(bidData) {
    if (!this.wss) return;

    const bid = {
      artworkId: bidData.artworkId,
      bidId: bidData.bidId,
      bidder: bidData.bidder,
      amount: bidData.amount,
      timestamp: Date.now(),
      isHighest: bidData.isHighest || false,
      currency: bidData.currency || 'XLM'
    };

    const message = JSON.stringify({ type: 'bid_update', data: bid });
    this._broadcastMessage(message, 'bid_update');
  }

  /**
   * Private method to broadcast messages to all connected clients.
   *
   * @param {string} message JSON string message to broadcast
   * @param {string} eventType Event type for logging
   */
  _broadcastMessage(message, eventType) {
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

  async close() {
    if (!this.wss) return;
    await new Promise((resolve) => this.wss.close(resolve));
    console.log('📡 ActivityBroadcaster closed');
  }
}

// Export a singleton — both server/index.js and stellarListener share the same instance
module.exports = new ActivityBroadcaster();