const express = require('express');
const cors = require('cors');
const broadcaster = require('./activityBroadcaster.js');

// Simple test server without database dependencies
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    websocket: broadcaster.wss
      ? `${broadcaster.wss.clients.size} client(s) connected`
      : 'not attached',
  });
});

// Test WebSocket routes
app.post('/api/test/price-update', (req, res) => {
  try {
    const { tokenId, currentPrice, previousPrice, currency } = req.body;
    
    broadcaster.broadcastPriceUpdate({
      tokenId: tokenId || '123',
      currentPrice: currentPrice || 100,
      previousPrice: previousPrice || 90,
      currency: currency || 'XLM'
    });

    res.json({ success: true, message: 'Price update broadcasted' });
  } catch (error) {
    console.error('Price update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/test/new-artwork', (req, res) => {
  try {
    const { id, title, creator, imageUrl, initialPrice, currency } = req.body;
    
    broadcaster.broadcastNewArtwork({
      id: id || 'art-123',
      title: title || 'Test Artwork',
      creator: creator || '0x1234567890123456789012345678901234567890',
      imageUrl: imageUrl || 'https://via.placeholder.com/150',
      initialPrice: initialPrice || 50,
      currency: currency || 'XLM'
    });

    res.json({ success: true, message: 'New artwork notification broadcasted' });
  } catch (error) {
    console.error('New artwork notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/test/bid-update', (req, res) => {
  try {
    const { artworkId, bidId, bidder, amount, isHighest, currency } = req.body;
    
    broadcaster.broadcastBidUpdate({
      artworkId: artworkId || 'art-123',
      bidId: bidId || 'bid-456',
      bidder: bidder || '0x1234567890123456789012345678901234567890',
      amount: amount || 75,
      isHighest: Boolean(isHighest),
      currency: currency || 'XLM'
    });

    res.json({ success: true, message: 'Bid update broadcasted' });
  } catch (error) {
    console.error('Bid update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const httpServer = app.listen(PORT, () => {
  console.log(`🚀 Test WebSocket server running on port ${PORT}`);
  
  // Attach WebSocket broadcaster
  broadcaster.attach(httpServer);
  console.log('📡 WebSocket broadcaster attached on path /live-feed');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down test server...');
  await broadcaster.close();
  process.exit(0);
});

module.exports = app;
