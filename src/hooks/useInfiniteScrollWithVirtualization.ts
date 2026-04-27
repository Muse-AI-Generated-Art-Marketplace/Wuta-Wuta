import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface UseInfiniteScrollWithVirtualizationOptions<T> {
  items: T[];
  itemsPerPage?: number;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
  estimateSize?: (index: number) => number;
  overscan?: number;
}

interface UseInfiniteScrollWithVirtualizationReturn<T> {
  visibleItems: T[];
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => void;
  reset: () => void;
  sentinelRef: React.RefObject<HTMLDivElement>;
  virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
  totalItems: number;
  loadedItems: number;
}

/**
 * Enhanced infinite scroll hook with virtualization support
 * 
 * Provides:
 * - Infinite scrolling with Intersection Observer
 * - Virtualization for performance with large datasets
 * - Loading states and error handling
 * - Configurable page sizes and thresholds
 * - Memory-efficient rendering
 * 
 * @param options Configuration options
 * @returns Hook return value with controls and state
 */
export function useInfiniteScrollWithVirtualization<T>({
  items,
  itemsPerPage = 12,
  threshold = 0.1,
  rootMargin = '200px',
  enabled = true,
  estimateSize = () => 400, // Default estimated height for grid items
  overscan = 5,
}: UseInfiniteScrollWithVirtualizationOptions<T>): UseInfiniteScrollWithVirtualizationReturn<T> {
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Reset to page 1 whenever the source list changes (filter/sort)
  useEffect(() => {
    setPage(1);
  }, [items]);

  // Calculate visible items based on current page
  const visibleItems = useMemo(() => {
    const endIndex = page * itemsPerPage;
    return items.slice(0, endIndex);
  }, [items, page, itemsPerPage]);

  // Check if there are more items to load
  const hasMore = visibleItems.length < items.length;
  const totalItems = items.length;
  const loadedItems = visibleItems.length;

  // Load more items
  const loadMore = useCallback(() => {
    if (!enabled || isLoading || !hasMore) return;
    
    setIsLoading(true);
    
    // Simulate async loading delay for better UX
    setTimeout(() => {
      setPage(prev => prev + 1);
      setIsLoading(false);
    }, 100);
  }, [enabled, isLoading, hasMore]);

  // Reset pagination
  const reset = useCallback(() => {
    setPage(1);
    setIsLoading(false);
  }, []);

  // Set up Intersection Observer for infinite scroll
  useEffect(() => {
    if (!enabled || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    const sentinel = sentinelRef.current;
    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
      observer.disconnect();
    };
  }, [enabled, hasMore, isLoading, loadMore, threshold, rootMargin]);

  // Set up virtualizer for performance optimization
  const virtualizer = useVirtualizer({
    count: visibleItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan,
  }) as ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;

  return {
    visibleItems,
    hasMore,
    isLoading,
    loadMore,
    reset,
    sentinelRef,
    virtualizer,
    totalItems,
    loadedItems,
  };
}

/**
 * Simplified infinite scroll hook without virtualization
 * For smaller datasets where virtualization isn't necessary
 */
export function useInfiniteScrollSimple<T>({
  items,
  itemsPerPage = 12,
  threshold = 0.1,
  rootMargin = '200px',
  enabled = true,
}: Omit<UseInfiniteScrollWithVirtualizationOptions<T>, 'estimateSize' | 'overscan'>) {
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset to page 1 whenever the source list changes
  useEffect(() => {
    setPage(1);
  }, [items]);

  // Calculate visible items
  const visibleItems = useMemo(() => {
    const endIndex = page * itemsPerPage;
    return items.slice(0, endIndex);
  }, [items, page, itemsPerPage]);

  const hasMore = visibleItems.length < items.length;

  // Load more items
  const loadMore = useCallback(() => {
    if (!enabled || isLoading || !hasMore) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      setPage(prev => prev + 1);
      setIsLoading(false);
    }, 100);
  }, [enabled, isLoading, hasMore]);

  // Reset pagination
  const reset = useCallback(() => {
    setPage(1);
    setIsLoading(false);
  }, []);

  // Set up Intersection Observer
  useEffect(() => {
    if (!enabled || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    const sentinel = sentinelRef.current;
    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
      observer.disconnect();
    };
  }, [enabled, hasMore, isLoading, loadMore, threshold, rootMargin]);

  return {
    visibleItems,
    hasMore,
    isLoading,
    loadMore,
    reset,
    sentinelRef,
  };
}

/**
 * Hook for managing infinite scroll with API fetching
 * Useful for server-side pagination
 */
export function useInfiniteScrollWithFetch<T>({
  fetchFunction,
  itemsPerPage = 12,
  threshold = 0.1,
  rootMargin = '200px',
  enabled = true,
  initialPage = 1,
}: {
  fetchFunction: (page: number, limit: number) => Promise<{ data: T[]; hasMore: boolean; total?: number }>;
  itemsPerPage?: number;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
  initialPage?: number;
}) {
  const [page, setPage] = useState(initialPage);
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;
    
    const fetchInitial = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await fetchFunction(initialPage, itemsPerPage);
        setItems(result.data);
        setHasMore(result.hasMore);
        setTotal(result.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitial();
  }, [enabled, fetchFunction, initialPage, itemsPerPage]);

  // Load more items
  const loadMore = useCallback(async () => {
    if (!enabled || isLoading || !hasMore) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const nextPage = page + 1;
      const result = await fetchFunction(nextPage, itemsPerPage);
      
      setItems(prev => [...prev, ...result.data]);
      setPage(nextPage);
      setHasMore(result.hasMore);
      if (result.total !== undefined) {
        setTotal(result.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch more data');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isLoading, hasMore, page, fetchFunction, itemsPerPage]);

  // Reset pagination
  const reset = useCallback(async () => {
    setPage(initialPage);
    setItems([]);
    setError(null);
    setHasMore(true);
    setTotal(undefined);
    
    if (!enabled) return;
    
    setIsLoading(true);
    try {
      const result = await fetchFunction(initialPage, itemsPerPage);
      setItems(result.data);
      setHasMore(result.hasMore);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, fetchFunction, initialPage, itemsPerPage]);

  // Set up Intersection Observer
  useEffect(() => {
    if (!enabled || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading && !error) {
          loadMore();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    const sentinel = sentinelRef.current;
    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
      observer.disconnect();
    };
  }, [enabled, hasMore, isLoading, error, loadMore, threshold, rootMargin]);

  return {
    items,
    hasMore,
    isLoading,
    error,
    loadMore,
    reset,
    sentinelRef,
    page,
    total,
  };
}
