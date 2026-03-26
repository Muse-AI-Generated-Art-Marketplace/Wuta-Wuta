const { Server } = require('@stellar/stellar-sdk');
const prisma = require('./prisma.js');
const broadcaster = require('./activityBroadcaster.js');

class StellarListener {
  constructor(config = {}) {
    this.horizonUrl = config.horizonUrl || process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
    this.contractId = config.contractId || process.env.STELLAR_CONTRACT_ID;
    this.server = new Server(this.horizonUrl);
    this.isRunning = false;
    this.lastCursor = '*'; // Start from latest
  }

  async start() {
    if (!this.contractId) {
      console.warn('No STELLAR_CONTRACT_ID provided. Monitoring all transactions (set env var for filtering).');
    }

    console.log(`🌌 Starting Stellar listener on ${this.horizonUrl}`);
    console.log(`📄 Monitoring contract: ${this.contractId || 'ALL'}`);

    this.isRunning = true;

    try {
      const es = this.server.transactions()
        .cursor(this.lastCursor)
        .order('desc')
        .limit(100)
        .stream({
          onmessage: async (tx) => {
            await this.processTransaction(tx);
          },
          onerror: (err) => {
            console.error('Stream error:', err);
            this.restart();
          },
          onend: () => {
            console.log('Stream ended, restarting...');
            this.restart();
          }
        });

      this.stream = es;
    } catch (error) {
      console.error('Failed to start listener:', error);
      setTimeout(() => this.start(), 5000);
    }
  }

  async processTransaction(tx) {
    if (!tx.successful) return;
    if (tx.results?.length === 0) return;

    const contractResults = tx.results.filter(r => r.type === 'invokeContract');
    for (const result of contractResults) {
      const contract = result.contract;
      if (this.contractId && contract !== this.contractId) continue;

      const events = this.parseEvents(tx, result);
      for (const event of events) {
        await this.handleEvent(tx, event);
      }
    }
  }

  parseEvents(tx, result) {
    const events = [];
    if (result.events) {
      for (const [topic, evs] of Object.entries(result.events)) {
        evs.forEach(ev => {
          events.push({ topic, ...ev });
        });
      }
    }
    return events.filter(e => e.topic?.startsWith('contract') || e.attributes?.some(a => a.name === 'topic'));
  }

  async handleEvent(tx, event) {
    const eventType = this.mapEventType(event);
    if (!eventType) return;

    try {
      // Persist to DB
      await prisma.transaction.create({
        data: {
          txHash: tx.id,
          contractId: tx.results.find(r => r === event.result)?.contract || '',
          eventType,
          parsedData: { event, tx },
          blockTimestamp: new Date(tx.created_at),
        }
      });

      console.log(`📝 Recorded event: ${eventType} in tx ${tx.id.slice(0, 8)}`);

      // Broadcast to all connected WebSocket clients immediately after persisting.
      // This is the bridge between the server-side Stellar listener and the frontend.
      broadcaster.broadcast(event, tx.id, eventType);

      // Business logic updates
      await this.updateBusinessLogic(eventType, event, tx);

    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️ Duplicate tx ${tx.id} skipped`);
      } else {
        console.error('Event processing error:', error);
      }
    }
  }

  mapEventType(event) {
    const topic = event.topic || '';

    if (topic.includes('artwork_minted'))          return 'ARTWORK_MINTED';
    if (topic.includes('artwork_listed'))           return 'ARTWORK_LISTED';
    if (topic.includes('artwork_sold'))             return 'ARTWORK_SOLD';
    if (topic.includes('bid_made'))                 return 'BID_MADE';
    if (topic.includes('auction_ended'))            return 'AUCTION_ENDED';
    if (topic.includes('artwork_evolved'))          return 'ARTWORK_EVOLVED';
    if (topic.includes('listing_cancelled'))        return 'LISTING_CANCELLED';
    if (topic.includes('marketplace_initialized'))  return 'MARKETPLACE_INITIALIZED';

    return null;
  }

  async updateBusinessLogic(eventType, event, tx) {
    switch (eventType) {
      case 'ARTWORK_SOLD':
      case 'AUCTION_ENDED': {
        const parsed = event.parsedData || {};
        await prisma.tradeHistory.create({
          data: {
            transactionHash: tx.id,
            price:     parsed.price   || 0,
            artAssetId: parsed.token_id ? `asset_${parsed.token_id}` : null,
            sellerId:  parsed.seller  || null,
            buyerId:   parsed.buyer   || null,
          }
        });
        break;
      }
      case 'ARTWORK_EVOLVED':
        break;
    }
  }

  restart() {
    if (this.isRunning) {
      console.log('🔄 Restarting listener...');
      setTimeout(() => this.start(), 2000);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.stream) {
      this.stream.close();
    }
  }
}

module.exports = StellarListener;