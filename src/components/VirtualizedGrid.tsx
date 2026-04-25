import React, { useRef } from 'react';
import { useInfiniteScrollWithVirtualization } from '../hooks/useInfiniteScrollWithVirtualization';

interface VirtualizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemsPerPage?: number;
  columns?: number;
  gap?: string;
  className?: string;
  estimateHeight?: number;
  overscan?: number;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
  loadingComponent?: React.ReactNode;
  sentinelComponent?: React.ReactNode;
  onItemsChange?: (visibleItems: T[], totalItems: number) => void;
}

/**
 * VirtualizedGrid component for efficient rendering of large datasets
 * 
 * Combines infinite scrolling with virtualization for optimal performance:
 * - Only renders visible items + overscan buffer
 * - Infinite scroll loads more items as needed
 * - Maintains scroll position during data updates
 * - Configurable grid layout and performance settings
 * 
 * @param props Component props
 * @returns Optimized grid component
 */
export function VirtualizedGrid<T>({
  items,
  renderItem,
  itemsPerPage = 12,
  columns = 3,
  gap = '1.5rem',
  className = '',
  estimateHeight = 400,
  overscan = 5,
  threshold = 0.1,
  rootMargin = '200px',
  enabled = true,
  loadingComponent,
  sentinelComponent,
  onItemsChange,
}: VirtualizedGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const {
    visibleItems,
    hasMore,
    isLoading,
    loadMore,
    reset,
    sentinelRef,
    virtualizer,
    totalItems,
    loadedItems,
  } = useInfiniteScrollWithVirtualization({
    items,
    itemsPerPage,
    threshold,
    rootMargin,
    enabled,
    estimateSize: () => estimateHeight,
    overscan,
  });

  // Notify parent of items change
  React.useEffect(() => {
    onItemsChange?.(visibleItems, totalItems);
  }, [visibleItems, totalItems, onItemsChange]);

  // Calculate grid styles
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap,
  };

  // Virtualized items
  const virtualItems = virtualizer.getVirtualItems();
  const containerHeight = `${virtualizer.getTotalSize()}px`;

  return (
    <div className={`virtualized-grid ${className}`}>
      {/* Stats and controls */}
      <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {loadedItems} of {totalItems} items
        </span>
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>

      {/* Virtualized container */}
      <div
        ref={parentRef}
        className="relative overflow-auto"
        style={{ height: '600px' }}
      >
        <div
          style={{
            height: containerHeight,
            width: '100%',
            position: 'relative',
          }}
        >
          {/* Virtualized grid items */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
            }}
          >
            <div style={gridStyle}>
              {virtualItems.map((virtualItem) => {
                const item = visibleItems[virtualItem.index];
                if (!item) return null;

                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: `calc((100% - ${(columns - 1) * parseInt(gap)}) / ${columns})`,
                      transform: `translateX(${(virtualItem.index % columns) * (100 / columns)}%)`,
                    }}
                  >
                    {renderItem(item, virtualItem.index)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && loadingComponent && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            {loadingComponent}
          </div>
        )}

        {/* Sentinel for intersection observer */}
        {hasMore && (
          <div
            ref={sentinelRef}
            className="absolute bottom-0 left-0 right-0 h-4"
            style={{ height: '16px' }}
          >
            {sentinelComponent}
          </div>
        )}
      </div>

      {/* Fallback for non-virtualized rendering */}
      {!enabled && (
        <div style={gridStyle}>
          {visibleItems.map((item, index) => (
            <div key={index}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Simplified VirtualizedList for single-column layouts
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  itemsPerPage = 20,
  className = '',
  estimateHeight = 80,
  overscan = 5,
  threshold = 0.1,
  rootMargin = '200px',
  enabled = true,
  loadingComponent,
  onItemsChange,
}: Omit<VirtualizedGridProps<T>, 'columns' | 'gap'>) {
  return (
    <VirtualizedGrid
      items={items}
      renderItem={renderItem}
      itemsPerPage={itemsPerPage}
      columns={1}
      gap="0"
      className={className}
      estimateHeight={estimateHeight}
      overscan={overscan}
      threshold={threshold}
      rootMargin={rootMargin}
      enabled={enabled}
      loadingComponent={loadingComponent}
      onItemsChange={onItemsChange}
    />
  );
}

/**
 * Loading spinner component for infinite scroll
 */
export function InfiniteScrollLoader({ message = 'Loading more items...' }) {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">{message}</span>
      </div>
    </div>
  );
}

/**
 * End of items indicator
 */
export function EndOfItemsIndicator({ message = 'No more items to load' }) {
  return (
    <div className="flex items-center justify-center py-8 text-gray-500">
      <div className="text-center">
        <div className="text-2xl mb-2">✓</div>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}
