import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Filter, Search, ShoppingCart, Sparkles, X, Heart } from 'lucide-react';
import { useMuseStore } from '../store/museStore';
import { useAnalytics, useInteractionTracker, useFormTracker } from '../hooks/useAnalytics';
import FavoriteButton from './FavoriteButton';

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

/**
 * Enhanced Gallery component with comprehensive analytics tracking
 * 
 * Features:
 * - Artwork view tracking
 * - Search and filter analytics
 * - Purchase intent tracking
 * - User interaction monitoring
 * - Performance metrics
 */
const GalleryAnalytics = () => {
  const { 
    isConnected, 
    isLoading, 
    error, 
    artworks, 
    listings, 
    fetchArtworks, 
    createArtworkAction,
    aiModels 
  } = useMuseStore();

  // Analytics hooks
  const { 
    trackArtworkView, 
    trackArtworkFavorite, 
    trackArtworkPurchase,
    trackSearch,
    trackFilter,
    trackError 
  } = useAnalytics();

  const { trackClick, trackHover } = useInteractionTracker('gallery');
  const { trackFieldFocus, trackFieldBlur, trackFieldChange, trackFormSubmit } = useFormTracker('gallery_search');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [purchaseArtwork, setPurchaseArtwork] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [purchaseState, setPurchaseState] = useState({ loading: false, error: null });

  // Track page view
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Page view tracking is handled by the useAnalytics hook
    }
  }, []);

  // Track search queries
  const handleSearch = (query) => {
    setSearchQuery(query);
    trackSearch(query, filteredArtworks.length, { category: selectedCategory, sortBy });
  };

  // Track filter changes
  const handleFilterChange = (filterType, value) => {
    if (filterType === 'category') {
      setSelectedCategory(value);
    } else if (filterType === 'sort') {
      setSortBy(value);
    }
    trackFilter(filterType, value, filteredArtworks.length);
  };

  // Track artwork interactions
  const handleArtworkClick = (artwork) => {
    trackArtworkView(artwork.id, artwork.title, 'gallery');
    trackClick('artwork_card', { artworkId: artwork.id, title: artwork.title });
    setSelectedArtwork(artwork);
  };

  const handleFavoriteToggle = (artworkId, isFavorited) => {
    const artwork = artworks.find(a => a.id === artworkId);
    if (artwork) {
      trackArtworkFavorite(artworkId, artwork.title, isFavorited);
      trackClick(isFavorited ? 'favorite_button' : 'unfavorite_button', { artworkId });
    }
  };

  const handlePurchaseIntent = (artwork) => {
    trackClick('purchase_button', { artworkId: artwork.id, price: artwork.price });
    setPurchaseArtwork(artwork);
  };

  const handlePurchase = async () => {
    if (!purchaseArtwork) return;

    setPurchaseState({ loading: true, error: null });
    
    try {
      await createArtworkAction({
        artworkId: purchaseArtwork.id,
        price: purchaseArtwork.price,
      });

      // Track successful purchase
      trackArtworkPurchase(purchaseArtwork.id, purchaseArtwork.title, purchaseArtwork.price);
      trackFormSubmit(true);
      
      setPurchaseState({ loading: false, error: null });
      setPurchaseArtwork(null);
      setSelectedArtwork(null);
    } catch (error) {
      trackError(error, 'artwork_purchase');
      trackFormSubmit(false, { purchase: error.message });
      setPurchaseState({ loading: false, error: error.message });
    }
  };

  // Track errors
  useEffect(() => {
    if (error) {
      trackError(new Error(error), 'gallery_load');
    }
  }, [error]);

  // Memoized filtered and sorted artworks
  const filteredArtworks = useMemo(() => {
    let filtered = artworks.map(artwork => normalizeArtwork(artwork, listings));

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(artwork =>
        artwork.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artwork.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artwork.creator.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(artwork => {
        const category = artwork.aiModel.toLowerCase();
        return category === selectedCategory.toLowerCase();
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'price_low':
          return (a.price || 0) - (b.price || 0);
        case 'price_high':
          return (b.price || 0) - (a.price || 0);
        case 'popular':
          return (b.evolutionCount || 0) - (a.evolutionCount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [artworks, listings, searchQuery, selectedCategory, sortBy]);

  const categories = [
    { id: 'all', name: 'All Models', icon: Sparkles },
    { id: 'stable-diffusion', name: 'Stable Diffusion', icon: Sparkles },
    { id: 'dall-e-3', name: 'DALL-E 3', icon: Sparkles },
    { id: 'midjourney', name: 'Midjourney', icon: Sparkles },
  ];

  const renderArtworkCard = (artwork) => {
    const isFavorited = false; // This would come from favorites store

    return (
      <div
        key={artwork.id}
        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:border-purple-300 dark:border-gray-800 dark:bg-gray-900"
        onMouseEnter={() => trackHover('artwork_card', { artworkId: artwork.id })}
        onClick={() => handleArtworkClick(artwork)}
      >
        <div className="aspect-square overflow-hidden">
          <img
            src={artwork.image}
            alt={artwork.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {artwork.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            by {formatAddress(artwork.creator)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 line-clamp-2">
            {artwork.prompt}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full dark:bg-purple-900/30 dark:text-purple-300">
                {artwork.aiModel}
              </span>
              {artwork.canEvolve && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-300">
                  Evolvable
                </span>
              )}
            </div>

            <FavoriteButton
              artworkId={artwork.id}
              artworkTitle={artwork.title}
              isFavorited={isFavorited}
              onToggle={() => handleFavoriteToggle(artwork.id, !isFavorited)}
              size="sm"
            />
          </div>

          {artwork.price && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {artwork.price} ETH
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePurchaseIntent(artwork);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ShoppingCart className="w-3 h-3" />
                Buy
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isConnected) {
    return (
      <section className="min-h-[calc(100vh-5rem)] bg-gray-50 dark:bg-gray-950 p-6 md:p-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-dashed border-purple-200 bg-white p-10 text-center shadow-sm dark:border-purple-900/40 dark:bg-gray-900">
          <Sparkles className="mx-auto mb-4 h-10 w-10 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Art Gallery</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Please connect your wallet to browse the gallery.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-5rem)] bg-gray-50 dark:bg-gray-950 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Art Gallery
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover and collect unique AI-generated artworks
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search artworks, artists, or prompts..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => trackFieldFocus('search_query')}
                onBlur={() => trackFieldBlur('search_query', searchQuery)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleFilterChange('category', category.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {category.name}
                  </button>
                );
              })}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600 dark:text-gray-400">
            Showing {filteredArtworks.length} of {artworks.length} artworks
          </p>
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No artworks found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredArtworks.map(renderArtworkCard)}
          </div>
        )}

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

              <div className="aspect-square overflow-hidden rounded-2xl mb-6">
                <img
                  src={selectedArtwork.image}
                  alt={selectedArtwork.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedArtwork.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    by {formatAddress(selectedArtwork.creator)}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Prompt</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedArtwork.prompt}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI Model</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedArtwork.aiModel}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Contributions</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Human: {selectedArtwork.humanContribution}% | AI: {selectedArtwork.aiContribution}%
                    </p>
                  </div>
                </div>

                {selectedArtwork.price && (
                  <div className="pt-4">
                    <button
                      onClick={() => setPurchaseArtwork(selectedArtwork)}
                      className="w-full rounded-2xl bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700 transition"
                    >
                      Purchase Artwork - {selectedArtwork.price} ETH
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Purchase Modal */}
        {purchaseArtwork && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative max-w-md w-full rounded-3xl bg-white p-6 shadow-xl dark:bg-gray-900">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Confirm Purchase
              </h3>

              <div className="space-y-4">
                <div className="aspect-square overflow-hidden rounded-2xl">
                  <img
                    src={purchaseArtwork.image}
                    alt={purchaseArtwork.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {purchaseArtwork.title}
                  </h4>
                  <p className="text-2xl font-bold text-purple-600">
                    {purchaseArtwork.price} ETH
                  </p>
                </div>

                {purchaseState.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                    {purchaseState.error}
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
          </div>
        )}
      </div>
    </section>
  );
};

export default GalleryAnalytics;
