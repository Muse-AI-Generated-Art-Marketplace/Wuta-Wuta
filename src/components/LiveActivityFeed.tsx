import { useActivityStore, type Activity } from '../store/useActivityStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60)  return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

// ── Badge components ──────────────────────────────────────────────────────────

const TYPE_STYLES: Record<Activity['type'], { label: string; className: string }> = {
  MINT:  { label: 'Mint',    className: 'bg-violet-100 text-violet-700' },
  TRADE: { label: 'Trade',   className: 'bg-emerald-100 text-emerald-700' },
  BID:   { label: 'Bid',     className: 'bg-amber-100 text-amber-700' },
  LIST:  { label: 'Listed',  className: 'bg-sky-100 text-sky-700' },
  OTHER: { label: 'Event',   className: 'bg-gray-100 text-gray-600' },
};

const CHAIN_STYLES: Record<Activity['chain'], { label: string; className: string }> = {
  EVM:     { label: 'EVM',     className: 'bg-indigo-50 text-indigo-600' },
  STELLAR: { label: 'Stellar', className: 'bg-blue-50 text-blue-600' },
};

function TypeBadge({ type }: { type: Activity['type'] }) {
  const { label, className } = TYPE_STYLES[type] ?? TYPE_STYLES.OTHER;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function ChainBadge({ chain }: { chain: Activity['chain'] }) {
  const { label, className } = CHAIN_STYLES[chain];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

// ── Activity row ──────────────────────────────────────────────────────────────

function ActivityRow({ activity }: { activity: Activity }) {
  return (
    <li className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
      {/* Type + chain badges */}
      <div className="flex flex-col gap-1 pt-0.5 min-w-[64px]">
        <TypeBadge type={activity.type} />
        <ChainBadge chain={activity.chain} />
      </div>

      {/* Event details */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm text-gray-900 truncate">
          <span className="font-semibold">{formatAddress(activity.from)}</span>
          {activity.to && (
            <>
              {' → '}
              <span className="font-semibold">{formatAddress(activity.to)}</span>
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
          {activity.tokenId && <span>Token #{activity.tokenId}</span>}
          {activity.price !== undefined && (
            <span className="font-medium text-gray-700">
              {activity.price.toLocaleString()} {activity.chain === 'STELLAR' ? 'XLM' : 'ETH'}
            </span>
          )}
          {activity.eventType && (
            <span className="font-mono text-gray-400">{activity.eventType}</span>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <time
        className="text-xs text-gray-400 whitespace-nowrap pt-0.5"
        dateTime={new Date(activity.timestamp).toISOString()}
      >
        {timeAgo(activity.timestamp)}
      </time>
    </li>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface LiveActivityFeedProps {
  /** Maximum rows to display. Defaults to 20. */
  maxItems?: number;
  /** Optional CSS class for the outer container. */
  className?: string;
}

/**
 * LiveActivityFeed
 *
 * Reads from useActivityStore and renders a scrollable list of real-time
 * mint and trade events from both EVM and Stellar chains.
 *
 * Mount useStellarActivityFeed() and useLiveEngine() at the app root to
 * populate the store. This component is purely presentational.
 *
 * @example
 *   <LiveActivityFeed maxItems={25} />
 */
export function LiveActivityFeed({ maxItems = 20, className = '' }: LiveActivityFeedProps) {
  const activities = useActivityStore((state) => state.activities);
  const clear      = useActivityStore((state) => state.clearActivities);

  const visible = activities.slice(0, maxItems);

  return (
    <div className={`flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {/* Live indicator dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <h2 className="text-sm font-semibold text-gray-900">Live Activity Feed</h2>
          {activities.length > 0 && (
            <span className="text-xs text-gray-400">({activities.length})</span>
          )}
        </div>

        {activities.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Feed */}
      <div className="overflow-y-auto max-h-[480px]">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <span className="text-3xl mb-3">📡</span>
            <p className="text-sm font-medium text-gray-700">Waiting for activity</p>
            <p className="text-xs text-gray-400 mt-1">
              Mints and trades will appear here in real time.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100" aria-label="Live activity feed">
            {visible.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </ul>
        )}
      </div>

      {/* Footer — show count if truncated */}
      {activities.length > maxItems && (
        <div className="px-4 py-2 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Showing {maxItems} of {activities.length} events
          </p>
        </div>
      )}
    </div>
  );
}