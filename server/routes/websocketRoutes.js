const express = require('express');
const router = express.Router();
const broadcaster = require('../activityBroadcaster.js');

/**
 * WebSocket Routes
 * 
 * These routes allow triggering real-time WebSocket events for testing and demonstration.
 * In production, these would be triggered by actual blockchain events and business logic.
 */

// Trigger a price update
router.post('/price-update', (req, res) => {
  try {
    const { tokenId, currentPrice, previousPrice, currency } = req.body;

    if (!tokenId || currentPrice === undefined || previousPrice === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: tokenId, currentPrice, previousPrice'
      });
    }

    broadcaster.broadcastPriceUpdate({
      tokenId,
      currentPrice: parseFloat(currentPrice),
      previousPrice: parseFloat(previousPrice),
      currency: currency || 'XLM'
    });

    res.json({ success: true, message: 'Price update broadcasted' });
  } catch (error) {
    console.error('Price update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trigger a new artwork notification
router.post('/new-artwork', (req, res) => {
  try {
    const { id, title, creator, imageUrl, initialPrice, currency } = req.body;

    if (!id || !title || !creator || !imageUrl || initialPrice === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: id, title, creator, imageUrl, initialPrice'
      });
    }

    broadcaster.broadcastNewArtwork({
      id,
      title,
      creator,
      imageUrl,
      initialPrice: parseFloat(initialPrice),
      currency: currency || 'XLM'
    });

    res.json({ success: true, message: 'New artwork notification broadcasted' });
  } catch (error) {
    console.error('New artwork notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trigger a bid update
router.post('/bid-update', (req, res) => {
  try {
    const { artworkId, bidId, bidder, amount, isHighest, currency } = req.body;

    if (!artworkId || !bidId || !bidder || amount === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: artworkId, bidId, bidder, amount'
      });
    }

    broadcaster.broadcastBidUpdate({
      artworkId,
      bidId,
      bidder,
      amount: parseFloat(amount),
      isHighest: Boolean(isHighest),
      currency: currency || 'XLM'
    });

    res.json({ success: true, message: 'Bid update broadcasted' });
  } catch (error) {
    console.error('Bid update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get WebSocket server status
router.get('/status', (req, res) => {
  try {
    const status = {
      connected: broadcaster.wss ? broadcaster.wss.clients.size : 0,
      serverActive: !!broadcaster.wss,
      timestamp: new Date().toISOString()
    };

    res.json(status);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Broadcast test message to all clients
router.post('/test', (req, res) => {
  try {
    const { message } = req.body;
    const testMessage = message || 'Test message from WebSocket API';

    if (broadcaster.wss) {
      let delivered = 0;
      broadcaster.wss.clients.forEach((ws) => {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.send(JSON.stringify({
            type: 'test',
            message: testMessage,
            timestamp: Date.now()
          }));
          delivered++;
        }
      });

      res.json({ 
        success: true, 
        message: 'Test message broadcasted',
        delivered
      });
    } else {
      res.status(503).json({ error: 'WebSocket server not active' });
    }
  } catch (error) {
    console.error('Test broadcast error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
