import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Filter, Search, ShoppingCart, Sparkles, X, Heart } from 'lucide-react';

import { useMuseStore } from '../store/museStore';
import { VirtualizedGrid, InfiniteScrollLoader, EndOfItemsIndicator } from './VirtualizedGrid';
import FavoriteButton from './FavoriteButton';

// Type definitions
interface Artwork {
  id: string;
  title: string;
  creator: string;
  image: string;
  prompt: string;
  aiModel: string;
  humanContribution: number;
  aiContribution: number;
  canEvolve: boolean;
  evolutionCount: number;
  createdAt: string | number;
  price: number | null;
}

interface Listing {
  tokenId: string;
  price: number;
}

function formatAddress(address = '') {
  if (!address) return 'Unknown creator';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatRelativeTime(value: string | number | undefined | null) {
  if (!value) return 'Unknown date';

  const timestamp = typeof value === 'number' ? value : new Date(value).getTime();
  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));

  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(seconds / 86400);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function normalizeArtwork(artwork: any, listings: Listing[] = []): Artwork {
  const listing = listings.find((item) => String(item.tokenId) === String(artwork.id));
  const metadata = artwork.metadata || {};

  return {
    id: artwork.id,
    title: artwork.title || artwork.name || 'Untitled artwork',
    creator: artwork.creator || artwork.humanCreator || artwork.owner || 'Unknown creator',
    image: artwork.imageUrl || artwork.image || artwork.tokenURI || metadata.image || '',
    prompt: artwork.prompt || metadata.prompt || 'No prompt provided.',
    aiModel: artwork.aiModel || metadata.aiModel || 'Unknown model',
    humanContribution: artwork.humanContribution ?? metadata.humanContribution ?? 50,
    aiContribution: artwork.aiContribution ?? metadata.aiContribution ?? 50,
    canEvolve: artwork.canEvolve ?? metadata.canEvolve ?? false,
    evolutionCount: artwork.evolutionCount ?? 0,
    createdAt: artwork.createdAt,
    price: listing?.price ?? artwork.price ?? null,
  };
}

/**
 * Optimized Gallery component with infinite scroll and virtualization
 * 
 * Features:
 * - Infinite scrolling for better UX
 * - Virtualization for performance with large datasets
 * - Responsive grid layout
 * - Advanced filtering and sorting
 * - Loading states and error handling
 */
const GalleryOptimized = () => {
  const store = useMuseStore();
  const isLoading = store.isLoading;
  const artworks = store.artworks || [];
  const listings = store.listings || [];
  const buyArtwork = store.buyArtwork;
  const fetchAllArtworks = store.fetchAllArtworks || store.loadMarketplaceData;

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedAIModel, setSelectedAIModel] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [gridColumns, setGridColumns] = useState(3);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [purchaseArtwork, setPurchaseArtwork] = useState<Artwork | null>(null);
  const [purchaseState, setPurchaseState] = useState({ loading: false, error: '', success: '' });
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (fetchAllArtworks) {
      fetchAllArtworks();
    }
  }, [fetchAllArtworks]);

  useEffect(() => {
    const updateGridColumns = () => {
      if (window.innerWidth < 640) setGridColumns(1);
      else if (window.innerWidth < 1024) setGridColumns(2);
      else setGridColumns(3);
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, []);

  const normalizedArtworks = useMemo(
    () => artworks.map((artwork: any) => normalizeArtwork(artwork, listings)),
    [artworks, listings]
  );

  const availableAIModels = useMemo(() => {
    const models = normalizedArtworks
      .map((artwork: Artwork) => artwork.aiModel || 'Unknown model')
      .filter(Boolean);

    return Array.from(new Set(models));
  }, [normalizedArtworks]);

  const filteredArtworks = useMemo(() => {
    const search = query.trim().toLowerCase();
    const min = Number(minPrice) || 0;
    const max = Number(maxPrice) || Number.POSITIVE_INFINITY;

    const next = normalizedArtworks.filter((artwork: Artwork) => {
      const matchesSearch =
        !search ||
        artwork.title.toLowerCase().includes(search) ||
        artwork.prompt.toLowerCase().includes(search) ||
        artwork.aiModel.toLowerCase().includes(search);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'evolvable' && artwork.canEvolve) ||
        (filter === 'listed' && artwork.price !== null) ||
        (filter === 'unlisted' && artwork.price === null);

      const matchesAIModel =
        selectedAIModel === 'all' ||
        artwork.aiModel.toLowerCase() === selectedAIModel.toLowerCase();

      const priceValue = Number(artwork.price ?? 0);
      const matchesPrice = priceValue >= min && priceValue <= max;

      return matchesSearch && matchesFilter && matchesAIModel && matchesPrice;
    });

    next.sort((left: Artwork, right: Artwork) => {
      if (sortBy === 'price-high') return Number(right.price || 0) - Number(left.price || 0);
      if (sortBy === 'price-low') return Number(left.price || 0) - Number(right.price || 0);
      if (sortBy === 'title') return left.title.localeCompare(right.title);
      if (sortBy === 'oldest') return new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime();
      if (sortBy === 'newest') return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
      return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
    });

    return next;
  }, [normalizedArtworks, query, filter, selectedAIModel, minPrice, maxPrice, sortBy]);

  const handlePurchase = async () => {
    if (!purchaseArtwork || !buyArtwork) return;

    setPurchaseState({ loading: true, error: '', success: '' });

    try {
      await buyArtwork(purchaseArtwork.id, purchaseArtwork.price);
      setPurchaseArtwork(null);
      setPurchaseState({ loading: false, error: '', success: 'Purchase successful!' });
    } catch (error) {
      setPurchaseState({
        loading: false,
        error: (error as Error).message || 'Purchase failed',
        success: '',
      });
    }
  };

  // Render individual artwork card
  const renderArtworkCard = (artwork: Artwork, index: number) => (
    <article
      key={artwork.id}
      data-testid={`artwork-card-${artwork.id}`}
      className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
    >
      <button
        type="button"
        onClick={() => setSelectedArtwork(artwork)}
        className="block w-full text-left"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
          {artwork.image ? (
            <img
              src={artwork.image}
              alt={artwork.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <Eye className="h-10 w-10" />
            </div>
          )}

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {artwork.aiModel}
            </span>
            {artwork.canEvolve && (
              <span className="rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white">
                Evolvable
              </span>
            )}
          </div>

          <div className="absolute right-4 top-4">
            <FavoriteButton 
              artworkId={artwork.id} 
              artworkTitle={artwork.title}
              size="sm"
            />
          </div>
        </div>

        <div className="p-4">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
              {artwork.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {artwork.prompt}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
              <span className="text-gray-700 dark:text-gray-300">
                {formatAddress(artwork.creator)}
              </span>
            </div>

            {artwork.price !== null ? (
              <div className="text-right">
                <p className="font-bold text-gray-900 dark:text-white">
                  {artwork.price} ETH
                </p>
              </div>
            ) : (
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Not listed
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{formatRelativeTime(artwork.createdAt)}</span>
            <div className="flex items-center gap-2">
              <span>{artwork.humanContribution}% Human</span>
              <span>•</span>
              <span>{artwork.aiContribution}% AI</span>
            </div>
          </div>
        </div>
      </button>
    </article>
  );

  // Handle items change for stats
  const handleItemsChange = (visibleItems: Artwork[], totalItems: number) => {
    setVisibleCount(visibleItems.length);
  };

  return (
    <section className="min-h-[calc(100vh-5rem)] bg-gray-50 dark:bg-gray-950 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-200/80">Marketplace</p>
              <h1 className="text-3xl font-bold">Art Gallery</h1>
              <p className="mt-3 max-w-2xl text-sm text-blue-100/80">
                Explore AI-Human Collaborative Artwork with infinite scroll and virtualization for optimal performance.
              </p>
            </div>

            <div className="grid gap-3 rounded-3xl bg-white/10 p-4 backdrop-blur-sm sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/60">Artworks</p>
                <p className="mt-1 text-2xl font-bold">{normalizedArtworks.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/60">Listed</p>
                <p className="mt-1 text-2xl font-bold">{normalizedArtworks.filter((item) => item.price !== null).length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/60">Visible</p>
                <p className="mt-1 text-2xl font-bold">{visibleCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="relative">
              <label htmlFor="gallery-search" className="sr-only">Search artworks</label>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="gallery-search"
                aria-label="Search artworks..."
                type="text"
                placeholder="Search artworks..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="filter-ai-model" className="block text-xs font-medium text-gray-500">Filter by AI Model</label>
              <select
                id="filter-ai-model"
                aria-label="Filter by AI Model"
                value={selectedAIModel}
                onChange={(event) => setSelectedAIModel(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              >
                <option value="all">All models</option>
                {availableAIModels.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sort-by" className="block text-xs font-medium text-gray-500">Sort by</label>
              <select
                id="sort-by"
                aria-label="Sort by"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="price-high">Price: High to Low</option>
                <option value="price-low">Price: Low to High</option>
                <option value="title">Title: A-Z</option>
              </select>
            </div>

            <div>
              <label htmlFor="filter-status" className="block text-xs font-medium text-gray-500">Filter by Status</label>
              <select
                id="filter-status"
                aria-label="Filter by Status"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              >
                <option value="all">All Artworks</option>
                <option value="listed">Listed for Sale</option>
                <option value="unlisted">Not Listed</option>
                <option value="evolvable">Evolvable</option>
              </select>
            </div>
          </div>

          {/* Price Range */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="min-price" className="block text-xs font-medium text-gray-500">Min Price (ETH)</label>
              <input
                id="min-price"
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="max-price" className="block text-xs font-medium text-gray-500">Max Price (ETH)</label>
              <input
                id="max-price"
                type="number"
                placeholder="1000"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Virtualized Gallery */}
        {isLoading && filteredArtworks.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <Sparkles className="mx-auto mb-4 h-10 w-10 text-purple-600" />
            <p className="text-xl font-semibold text-gray-900 dark:text-white">No artworks found</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your filters or search terms.
            </p>
          </div>
        ) : (
          <VirtualizedGrid<Artwork>
            items={filteredArtworks}
            renderItem={renderArtworkCard}
            itemsPerPage={12}
            columns={gridColumns}
            gap="1.5rem"
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            estimateHeight={500}
            overscan={3}
            threshold={0.1}
            rootMargin="200px"
            enabled={true}
            loadingComponent={<InfiniteScrollLoader message="Loading more artworks..." />}
            sentinelComponent={<div className="py-4 text-center text-sm text-gray-500">Loading more...</div>}
            onItemsChange={handleItemsChange}
          />
        )}
      </div>

      {/* Artwork Detail Modal */}
      {selectedArtwork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-w-2xl w-full max-h-[90vh] overflow-auto rounded-3xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <button
              onClick={() => setSelectedArtwork(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-6">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
                {selectedArtwork.image ? (
                  <img
                    src={selectedArtwork.image}
                    alt={selectedArtwork.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    <Eye className="h-16 w-16" />
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedArtwork.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {selectedArtwork.prompt}
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Creator</p>
                    <p className="text-gray-900 dark:text-white">{formatAddress(selectedArtwork.creator)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">AI Model</p>
                    <p className="text-gray-900 dark:text-white">{selectedArtwork.aiModel}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created</p>
                    <p className="text-gray-900 dark:text-white">{formatRelativeTime(selectedArtwork.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Price</p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedArtwork.price !== null ? `${selectedArtwork.price} ETH` : 'Not listed'}
                    </p>
                  </div>
                </div>

                {selectedArtwork.price !== null && (
                  <div className="pt-4">
                    <button
                      onClick={() => setPurchaseArtwork(selectedArtwork)}
                      className="w-full rounded-2xl bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700 transition"
                    >
                      Purchase Artwork
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {purchaseArtwork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md w-full rounded-3xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirm Purchase
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Artwork</p>
                <p className="font-medium text-gray-900 dark:text-white">{purchaseArtwork.title}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Price</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{purchaseArtwork.price} ETH</p>
              </div>
            </div>

            {purchaseState.error && (
              <div className="rounded-2xl bg-red-50 p-3 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {purchaseState.error}
              </div>
            )}

            {purchaseState.success && (
              <div className="rounded-2xl bg-green-50 p-3 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                {purchaseState.success}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPurchaseArtwork(null)}
                className="flex-1 rounded-2xl border border-gray-200 py-3 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={purchaseState.loading}
                className="flex-1 rounded-2xl bg-purple-600 py-3 font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {purchaseState.loading ? 'Purchasing...' : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GalleryOptimized;
