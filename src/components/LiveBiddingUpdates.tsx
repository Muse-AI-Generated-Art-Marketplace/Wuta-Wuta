import React from 'react';
import { useActivityStore, type BidUpdate } from '../store/useActivityStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatPrice(price: number, currency: string): string {
  return `${price.toLocaleString()} ${currency}`;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

// ── Bid Update Row ─────────────────────────────────────────────────────────────

function BidUpdateRow({ bidUpdate }: { bidUpdate: BidUpdate }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900">Artwork #{bidUpdate.artworkId}</span>
          {bidUpdate.isHighest && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700">
              HIGHEST
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
          <span>Bid by {formatAddress(bidUpdate.bidder)}</span>
          <span>•</span>
          <span className="font-medium text-gray-700">{formatPrice(bidUpdate.amount, bidUpdate.currency)}</span>
        </div>
        <div className="text-xs text-gray-400">
          Bid ID: {formatAddress(bidUpdate.bidId)} • {timeAgo(bidUpdate.timestamp)}
        </div>
      </div>
      <div className="text-right">
        {bidUpdate.isHighest && (
          <div className="text-xs font-medium text-amber-600 mb-1">🏆 Leading</div>
        )}
        <div className="text-xs text-gray-400">{timeAgo(bidUpdate.timestamp)}</div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface LiveBiddingUpdatesProps {
  /** Maximum bid updates to display. Defaults to 15. */
  maxItems?: number;
  /** Optional CSS class for the outer container. */
  className?: string;
}

/**
 * LiveBiddingUpdates
 *
 * Displays real-time bidding updates for artworks.
 * Shows bid amounts, bidders, and highest bid indicators.
 *
 * @example
 *   <LiveBiddingUpdates maxItems={20} />
 */
export function LiveBiddingUpdates({ maxItems = 15, className = '' }: LiveBiddingUpdatesProps) {
  const bidUpdates = useActivityStore((state) => state.bidUpdates);
  const clearBids = useActivityStore((state) => state.clearBidUpdates);

  const visibleBids = bidUpdates.slice(0, maxItems);

  return (
    <div className={`flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {/* Live indicator dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <h2 className="text-sm font-semibold text-gray-900">Live Bidding</h2>
          {bidUpdates.length > 0 && (
            <span className="text-xs text-gray-400">({bidUpdates.length})</span>
          )}
        </div>

        {bidUpdates.length > 0 && (
          <button
            type="button"
            onClick={clearBids}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Bid Updates List */}
      <div className="overflow-y-auto max-h-[400px]">
        {visibleBids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <span className="text-3xl mb-3">🔨</span>
            <p className="text-sm font-medium text-gray-700">No bidding activity</p>
            <p className="text-xs text-gray-400 mt-1">
              Live bid updates will appear here.
            </p>
          </div>
        ) : (
          <div>
            {visibleBids.map((bid) => (
              <BidUpdateRow key={`${bid.bidId}-${bid.timestamp}`} bidUpdate={bid} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {bidUpdates.length > maxItems && (
        <div className="px-4 py-2 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Showing {maxItems} of {bidUpdates.length} bids
          </p>
        </div>
      )}
    </div>
  );
}
