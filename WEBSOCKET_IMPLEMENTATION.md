# WebSocket Real-Time Updates Implementation

This document describes the implementation of real-time WebSocket functionality for the Wuta-Wuta AI art marketplace, providing live price updates, new artwork notifications, and bidding activity.

## Overview

The WebSocket implementation enhances the marketplace with real-time features:
- **Real-time price updates** - Live price changes with percentage calculations
- **New artwork notifications** - Instant alerts when new artworks are minted
- **Live bidding updates** - Real-time bid activity and highest bid tracking
- **Connection status monitoring** - Visual indicators for WebSocket connectivity

## Architecture

### Backend Components

#### 1. Enhanced ActivityBroadcaster (`server/activityBroadcaster.js`)
- Extends existing WebSocket server with new message types
- Supports broadcasting price updates, new artwork notifications, and bid updates
- Maintains connection health with heartbeat mechanism

**New Methods:**
- `broadcastPriceUpdate(priceData)` - Broadcasts price change events
- `broadcastNewArtwork(artworkData)` - Sends new artwork notifications
- `broadcastBidUpdate(bidData)` - Broadcasts live bidding activity

#### 2. WebSocket Routes (`server/routes/websocketRoutes.js`)
- REST API endpoints for triggering WebSocket events
- Useful for testing and integration with external systems
- Endpoints:
  - `POST /api/websocket/price-update`
  - `POST /api/websocket/new-artwork`
  - `POST /api/websocket/bid-update`
  - `GET /api/websocket/status`

#### 3. Test Server (`server/test-websocket.js`)
- Lightweight server for testing WebSocket functionality
- No database dependencies
- Runs on port 3002 for isolated testing

### Frontend Components

#### 1. Enhanced Activity Store (`src/store/useActivityStore.ts`)
- Extended Zustand store with new state management
- Handles price updates, new artworks, and bid updates
- Provides actions for adding and clearing different event types

**New State:**
```typescript
interface ActivityState {
  activities: Activity[];
  priceUpdates: PriceUpdate[];
  newArtworks: NewArtwork[];
  bidUpdates: BidUpdate[];
  
  // Actions for each event type
  addPriceUpdate: (priceUpdate: PriceUpdate) => void;
  addNewArtwork: (artwork: NewArtwork) => void;
  addBidUpdate: (bidUpdate: BidUpdate) => void;
  // ... clear methods
}
```

#### 2. Enhanced WebSocket Hook (`src/hooks/useStellarActivityFeed.ts`)
- Updated to handle all WebSocket message types
- Automatic reconnection with exponential backoff
- Type-safe message parsing with guards

**Message Types:**
- `activity` - Original blockchain activity events
- `price_update` - Real-time price change events
- `new_artwork` - New artwork mint notifications
- `bid_update` - Live bidding activity

#### 3. Real-Time Components

**RealTimePriceUpdates** (`src/components/RealTimePriceUpdates.tsx`)
- Displays live price changes with visual indicators
- Shows percentage changes and price history
- Configurable item limits and styling

**NewArtworkNotifications** (`src/components/NewArtworkNotifications.tsx`)
- Shows newly minted artworks with thumbnails
- Displays creator information and initial pricing
- Visual "NEW" badges for recent items

**LiveBiddingUpdates** (`src/components/LiveBiddingUpdates.tsx`)
- Real-time bid activity display
- Highest bid indicators and bidder information
- Timestamp and bid ID tracking

**WebSocketStatus** (`src/components/WebSocketStatus.tsx`)
- Connection status indicator with visual feedback
- Reconnection attempt tracking
- Error handling and retry functionality

## Message Formats

### Price Update Events
```json
{
  "type": "price_update",
  "data": {
    "tokenId": "art-123",
    "currentPrice": 150,
    "previousPrice": 100,
    "change": 50,
    "changePercent": 50.0,
    "timestamp": 1642694400000,
    "currency": "XLM"
  }
}
```

### New Artwork Notifications
```json
{
  "type": "new_artwork",
  "data": {
    "id": "art-456",
    "title": "Stellar Sunset",
    "creator": "0xABC123DEF456...",
    "imageUrl": "https://example.com/art.jpg",
    "initialPrice": 75,
    "timestamp": 1642694400000,
    "currency": "XLM"
  }
}
```

### Bid Update Events
```json
{
  "type": "bid_update",
  "data": {
    "artworkId": "art-456",
    "bidId": "bid-789",
    "bidder": "0xDEF456ABC123...",
    "amount": 85,
    "timestamp": 1642694400000,
    "isHighest": true,
    "currency": "XLM"
  }
}
```

## Testing

### 1. Start Test Server
```bash
node server/test-websocket.js
```

### 2. Test WebSocket Events

**Price Update:**
```bash
curl -X POST http://localhost:3002/api/test/price-update \
  -H "Content-Type: application/json" \
  -d '{"tokenId": "art-123", "currentPrice": 150, "previousPrice": 100, "currency": "XLM"}'
```

**New Artwork:**
```bash
curl -X POST http://localhost:3002/api/test/new-artwork \
  -H "Content-Type: application/json" \
  -d '{"id": "art-456", "title": "Test Art", "creator": "0x123...", "imageUrl": "https://example.com/art.jpg", "initialPrice": 50, "currency": "XLM"}'
```

**Bid Update:**
```bash
curl -X POST http://localhost:3002/api/test/bid-update \
  -H "Content-Type: application/json" \
  -d '{"artworkId": "art-456", "bidId": "bid-789", "bidder": "0x456...", "amount": 60, "isHighest": true, "currency": "XLM"}'
```

### 3. WebSocket Client Test
Open `test-websocket-client.html` in a browser to test WebSocket message reception in real-time.

## Integration

### 1. In React Application
```tsx
import { useStellarActivityFeed } from '../hooks/useStellarActivityFeed';
import { RealTimePriceUpdates, NewArtworkNotifications, LiveBiddingUpdates } from '../components';

// In your app root or layout component
function App() {
  // Initialize WebSocket connection
  useStellarActivityFeed();

  return (
    <div>
      <RealTimePriceUpdates maxItems={10} />
      <NewArtworkNotifications maxItems={8} />
      <LiveBiddingUpdates maxItems={15} />
    </div>
  );
}
```

### 2. With Existing Components
The new components are designed to work alongside the existing `LiveActivityFeed` component and can be integrated into any page layout.

## Configuration

### Environment Variables
```bash
# WebSocket server URL (optional, defaults to localhost:3001)
REACT_APP_LIVE_FEED_URL=ws://localhost:3001/live-feed

# Server port (optional, defaults to 3001)
PORT=3001
```

### Component Props
All components support common props:
- `maxItems` - Maximum number of items to display
- `className` - Additional CSS classes
- `showText` - (WebSocketStatus only) Show/hide status text

## Performance Considerations

### 1. Connection Management
- Automatic reconnection with exponential backoff
- Connection health monitoring with ping/pong
- Graceful degradation when WebSocket is unavailable

### 2. Memory Management
- Limited item storage (50-100 items per type)
- Automatic cleanup of old items
- Efficient state updates with Zustand

### 3. Error Handling
- Type-safe message parsing
- Graceful fallback for malformed messages
- Connection error recovery

## Security

### 1. CORS Configuration
WebSocket server is configured with appropriate CORS settings for development and production.

### 2. Message Validation
All incoming messages are validated with TypeScript type guards before processing.

### 3. Rate Limiting
API endpoints include rate limiting to prevent abuse.

## Future Enhancements

### 1. Authentication
- User-specific WebSocket channels
- Private bid notifications
- Role-based event filtering

### 2. Persistence
- Historical price data storage
- Bid history tracking
- Event replay functionality

### 3. Analytics
- Real-time marketplace metrics
- User engagement tracking
- Performance monitoring

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if server is running on correct port
   - Verify CORS configuration
   - Check network connectivity

2. **Messages Not Receiving**
   - Ensure WebSocket hook is mounted
   - Check browser console for errors
   - Verify message format matches expected schema

3. **Performance Issues**
   - Reduce `maxItems` on components
   - Check for memory leaks in state management
   - Monitor WebSocket connection count

### Debug Tools
- Browser DevTools Network tab for WebSocket inspection
- Server logs for connection and message tracking
- Test client HTML file for isolated testing

## Dependencies

### Backend
- `ws` - WebSocket server library
- `express` - Web framework
- `cors` - Cross-origin resource sharing

### Frontend
- `zustand` - State management
- `react` - UI framework
- TypeScript for type safety

## Conclusion

This WebSocket implementation provides a robust foundation for real-time features in the Wuta-Wuta marketplace. The modular architecture allows for easy extension and maintenance while providing excellent user experience with live updates and notifications.
