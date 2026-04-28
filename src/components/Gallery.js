import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Eye, Filter, Search, ShoppingCart, Sparkles, X, Heart } from 'lucide-react';

import { useMuseStore } from '../store/museStore';
import FavoriteButton from './FavoriteButton';

// ── Lazy loading hook ──────────────────────────────────────────────────────────
function useLazyImage({ src, rootMargin = '200px' }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { setInView(true); return; }

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  useEffect(() => {
    if (!inView || !src) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) setIsLoaded(true); };
    img.onerror = () => { if (!cancelled) setIsError(true); };
    img.src = src;
    return () => { cancelled = true; img.onload = null; img.onerror = null; };
  }, [inView, src]);

  return { ref, isLoaded, isError };
}

// ── Lazy image component ───────────────────────────────────────────────────────
function LazyArtworkImage({ src, alt, className = '', eager = false }) {
  const { ref, isLoaded, isError } = useLazyImage({ src, rootMargin: eager ? '9999px' : '200px' });

  return (
    <div ref={ref} className={`relative h-full w-full overflow-hidden bg-gray-100 dark:bg-gray-800 ${className}`}>
      {/* Skeleton shimmer — shown until image loads */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]" />
      )}

      {/* Error fallback */}
      {isError && (
        <div className="flex h-full items-center justify-center text-gray-400">
          <Eye className="h-10 w-10" />
        </div>
      )}

      {/* Image — blurred until fully loaded */}
      {src && !isError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
            isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-105'
          }`}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function formatAddress(address = '') {
  if (!address) return 'Unknown creator';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatRelativeTime(value) {
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

function normalizeArtwork(artwork, listings = []) {
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

const Gallery = () => {
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
  const [page, setPage] = useState(1);
  const [gridColumns, setGridColumns] = useState('grid-cols-1');
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [purchaseArtwork, setPurchaseArtwork] = useState(null);
  const [purchaseState, setPurchaseState] = useState({ loading: false, error: '', success: '' });

  useEffect(() => {
    if (fetchAllArtworks) {
      fetchAllArtworks();
    }
  }, [fetchAllArtworks]);

  useEffect(() => {
    const updateGridColumns = () => {
      if (window.innerWidth < 640) setGridColumns('grid-cols-1');
      else if (window.innerWidth < 1024) setGridColumns('md:grid-cols-2');
      else setGridColumns('xl:grid-cols-3');
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, []);

  const normalizedArtworks = useMemo(
    () => artworks.map((artwork) => normalizeArtwork(artwork, listings)),
    [artworks, listings]
  );

  const availableAIModels = useMemo(() => {
    const models = normalizedArtworks
      .map((artwork) => artwork.aiModel || 'Unknown model')
      .filter(Boolean);

    return Array.from(new Set(models));
  }, [normalizedArtworks]);

  const filteredArtworks = useMemo(() => {
    const search = query.trim().toLowerCase();
    const min = Number(minPrice) || 0;
    const max = Number(maxPrice) || Number.POSITIVE_INFINITY;

    const next = normalizedArtworks.filter((artwork) => {
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

    next.sort((left, right) => {
      if (sortBy === 'price-high') return Number(right.price || 0) - Number(left.price || 0);
      if (sortBy === 'price-low') return Number(left.price || 0) - Number(right.price || 0);
      if (sortBy === 'title') return left.title.localeCompare(right.title);
      if (sortBy === 'oldest') return new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime();
      if (sortBy === 'newest') return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
      return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
    });

    return next;
  }, [normalizedArtworks, query, filter, selectedAIModel, minPrice, maxPrice, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredArtworks.length / 9));

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const paginatedArtworks = useMemo(() => {
    const startIndex = (page - 1) * 9;
    return filteredArtworks.slice(startIndex, startIndex + 9);
  }, [filteredArtworks, page]);

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
        error: error.message || 'Purchase failed',
        success: '',
      });
    }
  };

  return (
    <section className="min-h-[calc(100vh-5rem)] bg-gray-50 dark:bg-gray-950 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-200/80">Marketplace</p>
              <h1 className="text-3xl font-bold">Art Gallery</h1>
              <p className="mt-3 max-w-2xl text-sm text-blue-100/80">
                Explore AI-Human Collaborative Artwork across the latest creations, listed pieces, and evolvable collectibles.
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
                <p className="text-xs uppercase tracking-wider text-white/60">Evolvable</p>
                <p className="mt-1 text-2xl font-bold">{normalizedArtworks.filter((item) => item.canEvolve).length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="relative">
              <label htmlFor="gallery-search" className="sr-only">Search artworks</label>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="gallery-search"
                aria-label="Search artworks..."
                type="text"
                placeholder="Search artworks..."
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(1); }}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="filter-ai-model" className="block text-xs font-medium text-gray-500">Filter by AI Model</label>
              <select
                id="filter-ai-model"
                aria-label="Filter by AI Model"
                value={selectedAIModel}
                onChange={(event) => { setSelectedAIModel(event.target.value); setPage(1); }}
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
                onChange={(event) => { setSortBy(event.target.value); setPage(1); }}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              >
                <option value="recent">Most recent</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="price-high">Price: high to low</option>
                <option value="price-low">Price: low to high</option>
                <option value="title">Title</option>
              </select>
            </div>

            <div>
              <label htmlFor="base-filter" className="block text-xs font-medium text-gray-500">Filter by Status</label>
              <select
                id="base-filter"
                aria-label="Filter by Status"
                value={filter}
                onChange={(event) => { setFilter(event.target.value); setPage(1); }}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              >
                <option value="all">All artworks</option>
                <option value="listed">Listed</option>
                <option value="unlisted">Unlisted</option>
                <option value="evolvable">Evolvable</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="min-price" className="block text-xs font-medium text-gray-500">Min Price</label>
                <input
                  id="min-price"
                  aria-label="Min Price"
                  type="number"
                  value={minPrice}
                  min="0"
                  step="0.01"
                  onChange={(event) => { setMinPrice(event.target.value); setPage(1); }}
                  className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="max-price" className="block text-xs font-medium text-gray-500">Max Price</label>
                <input
                  id="max-price"
                  aria-label="Max Price"
                  type="number"
                  value={maxPrice}
                  min="0"
                  step="0.01"
                  onChange={(event) => { setMaxPrice(event.target.value); setPage(1); }}
                  className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </div>
            </div>
          </div>

          <p role="status" aria-live="polite" className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Showing {paginatedArtworks.length} of {filteredArtworks.length} artwork(s)
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Loading gallery...</p>
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <Sparkles className="mx-auto mb-4 h-10 w-10 text-purple-600" />
            <p className="text-xl font-semibold text-gray-900 dark:text-white">No artworks found</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Be the first to create a collaborative artwork.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {paginatedArtworks.map((artwork) => (
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
                    {/* ── CARD IMAGE (lazy) ── */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {artwork.image ? (
                        <LazyArtworkImage src={artwork.image} alt={artwork.title} />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-800">
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

                    <div className="space-y-4 p-5">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{artwork.title}</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formatRelativeTime(artwork.createdAt)}</p>
                      </div>

                      <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{artwork.prompt}</p>

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="rounded-full bg-purple-50 px-3 py-1 font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          {artwork.humanContribution}% Human / {artwork.aiContribution}% AI
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {artwork.evolutionCount} Evolution{artwork.evolutionCount === 1 ? '' : 's'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm dark:border-gray-800">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-400">Creator</p>
                          <p className="font-mono font-semibold text-gray-900 dark:text-white">{formatAddress(artwork.creator)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wider text-gray-400">Price</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {artwork.price !== null ? `${artwork.price} ETH` : 'Not listed'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>

                  <div className="border-t border-gray-100 p-5 pt-4 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => setPurchaseArtwork(artwork)}
                      disabled={artwork.price === null}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Buy Now
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="text-sm font-medium">Page {page} of {totalPages}</span>

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── DETAIL MODAL IMAGE (lazy, eager-loads since it's above fold) ── */}
      {selectedArtwork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Artwork Details</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedArtwork.title}</h2>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setSelectedArtwork(null)}
                className="rounded-full bg-gray-100 p-2 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr]">
              <div className="overflow-hidden rounded-3xl">
                {selectedArtwork.image ? (
                  <LazyArtworkImage
                    src={selectedArtwork.image}
                    alt={selectedArtwork.title}
                    eager
                  />
                ) : (
                  <div className="flex min-h-[280px] items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-800 rounded-3xl">
                    <Eye className="h-10 w-10" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Prompt</p>
                  <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">{selectedArtwork.prompt}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-950">
                    <p className="text-xs uppercase tracking-wider text-gray-400">Creator</p>
                    <p className="mt-2 font-mono text-sm font-semibold text-gray-900 dark:text-white">{formatAddress(selectedArtwork.creator)}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-950">
                    <p className="text-xs uppercase tracking-wider text-gray-400">Price</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedArtwork.price !== null ? `${selectedArtwork.price} ETH` : 'Not listed'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-950">
                    <p className="text-xs uppercase tracking-wider text-gray-400">Contribution</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedArtwork.humanContribution}% Human / {selectedArtwork.aiContribution}% AI
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-950">
                    <p className="text-xs uppercase tracking-wider text-gray-400">Evolution</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedArtwork.evolutionCount} Evolution{selectedArtwork.evolutionCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {purchaseArtwork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Confirm Purchase</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              You are about to purchase <span className="font-semibold text-gray-900 dark:text-white">{purchaseArtwork.title}</span>.
            </p>

            <div className="mt-5 rounded-2xl bg-gray-50 p-4 dark:bg-gray-950">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Artwork</span>
                <span className="font-semibold text-gray-900 dark:text-white">{purchaseArtwork.title}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Price</span>
                <span className="font-semibold text-gray-900 dark:text-white">{purchaseArtwork.price} ETH</span>
              </div>
            </div>

            {purchaseState.error && (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                {purchaseState.error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setPurchaseArtwork(null);
                  setPurchaseState({ loading: false, error: '' });
                }}
                className="rounded-2xl border border-gray-200 px-4 py-2 font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurchase}
                disabled={purchaseState.loading}
                className="rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-70"
              >
                {purchaseState.loading ? 'Processing...' : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;
