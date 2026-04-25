import React from 'react';
import { RealTimePriceUpdates } from './RealTimePriceUpdates';
import { NewArtworkNotifications } from './NewArtworkNotifications';
import { LiveBiddingUpdates } from './LiveBiddingUpdates';
import { WebSocketStatus } from './WebSocketStatus';

/**
 * RealTimeDemo
 *
 * Comprehensive demo page showcasing all real-time WebSocket features:
 * - Price updates with change indicators
 * - New artwork notifications
 * - Live bidding updates
 * - Connection status monitoring
 *
 * @example
 *   <RealTimeDemo />
 */
export function RealTimeDemo() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Real-Time WebSocket Demo
          </h1>
          <p className="text-lg text-gray-600">
            Experience live price updates, new artwork notifications, and bidding activity in real-time.
          </p>
          
          {/* Connection Status */}
          <div className="mt-4">
            <WebSocketStatus showText={true} size="md" />
          </div>
        </div>

        {/* Grid Layout for Real-Time Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Price Updates */}
          <div className="lg:col-span-1">
            <RealTimePriceUpdates maxItems={10} />
          </div>

          {/* New Artwork Notifications */}
          <div className="lg:col-span-1">
            <NewArtworkNotifications maxItems={8} />
          </div>

          {/* Live Bidding */}
          <div className="lg:col-span-1 xl:col-span-1">
            <LiveBiddingUpdates maxItems={10} />
          </div>

        </div>

        {/* Instructions Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            How to Test Real-Time Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Using Test Server</h3>
              <p className="text-gray-600 mb-3">
                The WebSocket server is running on port 3002. Use these API endpoints to trigger events:
              </p>
              <div className="space-y-2 text-sm">
                <div className="bg-gray-100 p-3 rounded">
                  <code className="text-blue-600">POST http://localhost:3002/api/test/price-update</code>
                  <p className="text-gray-600 mt-1">Triggers real-time price updates</p>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <code className="text-blue-600">POST http://localhost:3002/api/test/new-artwork</code>
                  <p className="text-gray-600 mt-1">Shows new artwork notifications</p>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <code className="text-blue-600">POST http://localhost:3002/api/test/bid-update</code>
                  <p className="text-gray-600 mt-1">Displays live bidding activity</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Sample Requests</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="font-medium mb-1">Price Update:</p>
                  <pre className="text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
{`{
  "tokenId": "art-123",
  "currentPrice": 150,
  "previousPrice": 100,
  "currency": "XLM"
}`}
                  </pre>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="font-medium mb-1">New Artwork:</p>
                  <pre className="text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
{`{
  "id": "art-456",
  "title": "Stellar Sunset",
  "creator": "0xABC123...",
  "imageUrl": "https://example.com/art.jpg",
  "initialPrice": 75,
  "currency": "XLM"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* WebSocket Client Test */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-medium text-blue-900 mb-2">WebSocket Client Test</h3>
            <p className="text-blue-800 mb-2">
              Open the test client at: <code className="bg-blue-100 px-2 py-1 rounded">test-websocket-client.html</code>
            </p>
            <p className="text-blue-700 text-sm">
              This HTML file provides a simple WebSocket client to test real-time message reception.
            </p>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl mb-3">📈</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Price Updates</h3>
            <p className="text-gray-600 text-sm">
              Live price changes with percentage calculations and historical comparisons.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">New Artwork Notifications</h3>
            <p className="text-gray-600 text-sm">
              Instant notifications when new artworks are minted and listed.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl mb-3">🔨</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Bidding Activity</h3>
            <p className="text-gray-600 text-sm">
              Real-time bid updates with highest bid indicators and bidder information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
