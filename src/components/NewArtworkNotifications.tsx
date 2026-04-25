import React from 'react';
import { useActivityStore, type NewArtwork } from '../store/useActivityStore';

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

// ── New Artwork Row ────────────────────────────────────────────────────────────

function NewArtworkRow({ artwork }: { artwork: NewArtwork }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100">
      {/* Artwork Image */}
      <div className="flex-shrink-0">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="w-12 h-12 rounded-lg object-cover bg-gray-100"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzMkMxOS41ODE3IDMyIDE2IDI4LjQxODMgMTYgMjRDMTYgMTkuNTgxNyAxOS41ODE3IDE2IDI0IDE2QzI4LjQxODMgMTYgMzIgMTkuNTgxNyAzMiAyNEMzMiAyOC40MTgzIDI4LjQxODMgMzIgMjQgMzJaIiBmaWxsPSIjOUI5QkEwIi8+Cjwvc3ZnPgo=';
          }}
        />
      </div>

      {/* Artwork Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900 truncate">{artwork.title}</span>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-violet-100 text-violet-700">
            NEW
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
          <span>by {formatAddress(artwork.creator)}</span>
          <span>•</span>
          <span className="font-medium text-gray-700">{formatPrice(artwork.initialPrice, artwork.currency)}</span>
        </div>
        <div className="text-xs text-gray-400">
          {timeAgo(artwork.timestamp)}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface NewArtworkNotificationsProps {
  /** Maximum notifications to display. Defaults to 10. */
  maxItems?: number;
  /** Optional CSS class for the outer container. */
  className?: string;
}

/**
 * NewArtworkNotifications
 *
 * Displays real-time notifications for newly minted artworks.
 * Shows artwork details, creator info, and initial pricing.
 *
 * @example
 *   <NewArtworkNotifications maxItems={15} />
 */
export function NewArtworkNotifications({ maxItems = 10, className = '' }: NewArtworkNotificationsProps) {
  const newArtworks = useActivityStore((state) => state.newArtworks);
  const clearArtworks = useActivityStore((state) => state.clearNewArtworks);

  const visibleArtworks = newArtworks.slice(0, maxItems);

  return (
    <div className={`flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {/* Live indicator dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
          </span>
          <h2 className="text-sm font-semibold text-gray-900">New Artworks</h2>
          {newArtworks.length > 0 && (
            <span className="text-xs text-gray-400">({newArtworks.length})</span>
          )}
        </div>

        {newArtworks.length > 0 && (
          <button
            type="button"
            onClick={clearArtworks}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* New Artworks List */}
      <div className="overflow-y-auto max-h-[400px]">
        {visibleArtworks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <span className="text-3xl mb-3">🎨</span>
            <p className="text-sm font-medium text-gray-700">No new artworks</p>
            <p className="text-xs text-gray-400 mt-1">
              Newly minted artworks will appear here.
            </p>
          </div>
        ) : (
          <div>
            {visibleArtworks.map((artwork) => (
              <NewArtworkRow key={`${artwork.id}-${artwork.timestamp}`} artwork={artwork} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {newArtworks.length > maxItems && (
        <div className="px-4 py-2 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Showing {maxItems} of {newArtworks.length} artworks
          </p>
        </div>
      )}
    </div>
  );
}
