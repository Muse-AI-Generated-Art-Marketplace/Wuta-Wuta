import React from 'react';
import { useActivityStore, type PriceUpdate } from '../store/useActivityStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(price: number, currency: string): string {
  return `${price.toLocaleString()} ${currency}`;
}

function formatChange(change: number, changePercent: number): { text: string; className: string } {
  const isPositive = change >= 0;
  const sign = isPositive ? '+' : '';
  return {
    text: `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`,
    className: isPositive ? 'text-green-600' : 'text-red-600'
  };
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

// ── Price Update Row ───────────────────────────────────────────────────────────

function PriceUpdateRow({ priceUpdate }: { priceUpdate: PriceUpdate }) {
  const { text: changeText, className: changeClass } = formatChange(
    priceUpdate.change,
    priceUpdate.changePercent
  );

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900">Token #{priceUpdate.tokenId}</span>
          <span className={`text-sm font-medium ${changeClass}`}>{changeText}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>From: {formatPrice(priceUpdate.previousPrice, priceUpdate.currency)}</span>
          <span>→</span>
          <span className="font-medium">To: {formatPrice(priceUpdate.currentPrice, priceUpdate.currency)}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs text-gray-400">{timeAgo(priceUpdate.timestamp)}</div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface RealTimePriceUpdatesProps {
  /** Maximum updates to display. Defaults to 15. */
  maxItems?: number;
  /** Optional CSS class for the outer container. */
  className?: string;
}

/**
 * RealTimePriceUpdates
 *
 * Displays real-time price updates for artworks as they happen.
 * Shows price changes, percentages, and timestamps.
 *
 * @example
 *   <RealTimePriceUpdates maxItems={20} />
 */
export function RealTimePriceUpdates({ maxItems = 15, className = '' }: RealTimePriceUpdatesProps) {
  const priceUpdates = useActivityStore((state) => state.priceUpdates);
  const clearUpdates = useActivityStore((state) => state.clearPriceUpdates);

  const visibleUpdates = priceUpdates.slice(0, maxItems);

  return (
    <div className={`flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {/* Live indicator dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <h2 className="text-sm font-semibold text-gray-900">Real-Time Price Updates</h2>
          {priceUpdates.length > 0 && (
            <span className="text-xs text-gray-400">({priceUpdates.length})</span>
          )}
        </div>

        {priceUpdates.length > 0 && (
          <button
            type="button"
            onClick={clearUpdates}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Price Updates List */}
      <div className="overflow-y-auto max-h-[400px]">
        {visibleUpdates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <span className="text-3xl mb-3">📈</span>
            <p className="text-sm font-medium text-gray-700">Waiting for price updates</p>
            <p className="text-xs text-gray-400 mt-1">
              Real-time price changes will appear here.
            </p>
          </div>
        ) : (
          <div>
            {visibleUpdates.map((update) => (
              <PriceUpdateRow key={`${update.tokenId}-${update.timestamp}`} priceUpdate={update} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {priceUpdates.length > maxItems && (
        <div className="px-4 py-2 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Showing {maxItems} of {priceUpdates.length} updates
          </p>
        </div>
      )}
    </div>
  );
}
