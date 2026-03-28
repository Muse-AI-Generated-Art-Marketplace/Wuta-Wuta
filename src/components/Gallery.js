import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Filter, Search, ShoppingCart, Sparkles, X } from 'lucide-react';

import { useMuseStore } from '../store/museStore';

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
  const [sortBy, setSortBy] = useState('recent');
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [purchaseArtwork, setPurchaseArtwork] = useState(null);
  const [purchaseState, setPurchaseState] = useState({ loading: false, error: '' });

  useEffect(() => {
    if (fetchAllArtworks) {
      fetchAllArtworks();
    }
  }, [fetchAllArtworks]);

  const normalizedArtworks = useMemo(
    () => artworks.map((artwork) => normalizeArtwork(artwork, listings)),
    [artworks, listings]
  );

  const filteredArtworks = useMemo(() => {
    const search = query.trim().toLowerCase();
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

      return matchesSearch && matchesFilter;
    });

    next.sort((left, right) => {
      if (sortBy === 'price-high') return Number(right.price || 0) - Number(left.price || 0);
      if (sortBy === 'price-low') return Number(left.price || 0) - Number(right.price || 0);
      if (sortBy === 'title') return left.title.localeCompare(right.title);
      return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
    });

    return next;
  }, [normalizedArtworks, query, filter, sortBy]);

  const handlePurchase = async () => {
    if (!purchaseArtwork || !buyArtwork) return;

    setPurchaseState({ loading: true, error: '' });

    try {
      await buyArtwork(purchaseArtwork.id, purchaseArtwork.price);
      setPurchaseArtwork(null);
      setPurchaseState({ loading: false, error: '' });
    } catch (error) {
      setPurchaseState({
        loading: false,
        error: error.message || 'Purchase failed',
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
          <div className="grid gap-4 lg:grid-cols-[1.6fr_0.7fr_0.7fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search artworks, prompts, or models..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>

            <div className="relative">
              <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              >
                <option value="all">All artworks</option>
                <option value="listed">Listed</option>
                <option value="unlisted">Unlisted</option>
                <option value="evolvable">Evolvable</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              <option value="recent">Most recent</option>
              <option value="price-high">Price: high to low</option>
              <option value="price-low">Price: low to high</option>
              <option value="title">Title</option>
            </select>
          </div>
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
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredArtworks.map((artwork) => (
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
        )}
      </div>

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
              <div className="overflow-hidden rounded-3xl bg-gray-100 dark:bg-gray-800">
                {selectedArtwork.image ? (
                  <img src={selectedArtwork.image} alt={selectedArtwork.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex min-h-[280px] items-center justify-center text-gray-400">
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
