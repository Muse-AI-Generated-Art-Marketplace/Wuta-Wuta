import React, { useEffect, useState } from 'react';
import { Heart, Folder, Trash2, Edit2, Globe, Lock, Image, X, ShoppingCart } from 'lucide-react';
import { useMuseStore } from '../store/museStore';
import useFavoritesStore from '../store/favoritesStore';
import { useInfiniteScrollSimple } from '../hooks/useInfiniteScrollWithVirtualization';
import FavoriteButton from '../components/FavoriteButton';
import CollectionsManager from '../components/CollectionsManager';

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
  listing?: any;
  favoritedAt?: string;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  artworkCount: number;
}

/**
 * Optimized FavoritesPage with infinite scroll
 * 
 * Features:
 * - Infinite scrolling for better performance with large favorite lists
 * - Virtualization support for very large datasets
 * - Enhanced loading states and error handling
 * - Responsive grid layout
 * - Collection management integration
 */
const FavoritesPageOptimized = () => {
  const { artworks, listings, buyArtwork } = useMuseStore();
  const { 
    favorites, 
    favoritesLoading, 
    fetchFavorites,
    collections,
    fetchCollections,
    removeFavorite
  } = useFavoritesStore();

  const [activeTab, setActiveTab] = useState('favorites'); // 'favorites' | 'collections'
  const [showCollectionsManager, setShowCollectionsManager] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [purchaseArtwork, setPurchaseArtwork] = useState<Artwork | null>(null);
  const [purchaseState, setPurchaseState] = useState({ loading: false, error: '', success: '' });

  useEffect(() => {
    fetchFavorites();
    fetchCollections();
  }, []);

  // Get full artwork data for favorites
  const favoriteArtworks = favorites.map(fav => {
    const artwork = artworks.find(a => a.id === fav.artwork?.id || a.id === fav.artworkId);
    const listing = listings.find(l => String(l.tokenId) === String(artwork?.id));
    return {
      ...artwork,
      ...fav.artwork,
      listing,
      favoritedAt: fav.favoritedAt
    };
  }).filter(Boolean) as Artwork[];

  // Sort favorites by favorited date (newest first)
  const sortedFavorites = favoriteArtworks.sort((a, b) => {
    const dateA = a.favoritedAt ? new Date(a.favoritedAt).getTime() : 0;
    const dateB = b.favoritedAt ? new Date(b.favoritedAt).getTime() : 0;
    return dateB - dateA;
  });

  // Use infinite scroll for favorites
  const { 
    visibleItems: visibleFavorites, 
    hasMore: hasMoreFavorites, 
    isLoading: isLoadingFavorites, 
    sentinelRef: favoritesSentinelRef 
  } = useInfiniteScrollSimple({
    items: sortedFavorites,
    itemsPerPage: 12,
    threshold: 0.1,
    rootMargin: '200px',
    enabled: activeTab === 'favorites',
  });

  // Use infinite scroll for collections
  const { 
    visibleItems: visibleCollections, 
    hasMore: hasMoreCollections, 
    isLoading: isLoadingCollections, 
    sentinelRef: collectionsSentinelRef 
  } = useInfiniteScrollSimple({
    items: collections,
    itemsPerPage: 20,
    threshold: 0.1,
    rootMargin: '200px',
    enabled: activeTab === 'collections',
  });

  const handleBuyArtwork = async (artworkId: string, price: number) => {
    if (buyArtwork) {
      await buyArtwork(artworkId, price);
    }
  };

  const handlePurchase = async () => {
    if (!purchaseArtwork || !buyArtwork) return;

    setPurchaseState({ loading: true, error: '', success: '' });

    try {
      await buyArtwork(purchaseArtwork.id, purchaseArtwork.price || 0);
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

  const formatAddress = (address = '') => {
    if (!address) return 'Unknown';
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return 'Not listed';
    return `${price.toLocaleString()} ETH`;
  };

  // Render favorite artwork card
  const renderFavoriteArtwork = (artwork: Artwork, index: number) => (
    <div
      key={artwork.id}
      className="group overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {artwork.image ? (
          <img
            src={artwork.image}
            alt={artwork.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <Image className="h-10 w-10" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <FavoriteButton
            artworkId={artwork.id}
            artworkTitle={artwork.title}
            size="sm"
          />
        </div>
        {artwork.favoritedAt && (
          <div className="absolute top-3 left-3">
            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
              Favorited
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 truncate">
          {artwork.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {artwork.prompt || 'No description available'}
        </p>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {formatAddress(artwork.creator)}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {formatPrice(artwork.price)}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedArtwork(artwork)}
            className="flex-1 rounded-xl bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            View Details
          </button>
          {artwork.price !== null && (
            <button
              onClick={() => handleBuyArtwork(artwork.id, artwork.price)}
              className="flex-1 rounded-xl bg-purple-600 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Buy
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Render collection card
  const renderCollection = (collection: Collection, index: number) => (
    <button
      key={collection.id}
      onClick={() => {
        setSelectedCollection(collection);
        setShowCollectionsManager(true);
      }}
      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-6 text-left hover:border-purple-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950 transition-all"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <Folder className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{collection.name}</h3>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {collection.isPublic ? (
              <Globe className="w-3 h-3" />
            ) : (
              <Lock className="w-3 h-3" />
            )}
            <span>{collection.artworkCount || 0} artworks</span>
          </div>
        </div>
      </div>
      {collection.description && (
        <p className="text-sm text-gray-500 line-clamp-2">{collection.description}</p>
      )}
    </button>
  );

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gray-50 dark:bg-gray-950 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Collection
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Manage your favorite artworks and personal collections
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('favorites')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'favorites'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Favorites
                  {favorites.length > 0 && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      {favorites.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'collections'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  Collections
                  {collections.length > 0 && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      {collections.length}
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {activeTab === 'favorites' ? (
            favoritesLoading && sortedFavorites.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : sortedFavorites.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-lg font-semibold text-gray-900 dark:text-white">No favorites yet</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Browse the gallery and click the heart icon to save your favorite artworks
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Showing {visibleFavorites.length} of {sortedFavorites.length} favorites
                  </span>
                  {!hasMoreFavorites && visibleFavorites.length > 0 && (
                    <span className="text-green-600 font-medium">✓ All favorites loaded</span>
                  )}
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {visibleFavorites.map((artwork, index) => renderFavoriteArtwork(artwork, index))}
                </div>

                {/* Loading indicator */}
                {isLoadingFavorites && (
                  <div className="mt-8 flex items-center justify-center py-4">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">Loading more favorites...</span>
                    </div>
                  </div>
                )}

                {/* Sentinel for intersection observer */}
                {hasMoreFavorites && (
                  <div ref={favoritesSentinelRef} className="py-4 text-center text-sm text-gray-500">
                    Scroll for more favorites...
                  </div>
                )}

                {/* End indicator */}
                {!hasMoreFavorites && visibleFavorites.length > 0 && (
                  <div className="mt-8 py-8 text-center text-gray-500">
                    <div className="text-lg mb-2">💝</div>
                    <p className="text-sm">You've reached the end of your favorites</p>
                  </div>
                )}
              </div>
            )
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {collections.length} collection{collections.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setShowCollectionsManager(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700"
                >
                  <Folder className="w-4 h-4" />
                  Create Collection
                </button>
              </div>

              {collections.length === 0 ? (
                <div className="text-center py-12">
                  <Folder className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">No collections yet</p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Create collections to organize your favorite artworks
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
                    <span>
                      Showing {visibleCollections.length} of {collections.length} collections
                    </span>
                    {!hasMoreCollections && visibleCollections.length > 0 && (
                      <span className="text-green-600 font-medium">✓ All collections loaded</span>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {visibleCollections.map((collection, index) => renderCollection(collection, index))}
                  </div>

                  {/* Loading indicator */}
                  {isLoadingCollections && (
                    <div className="mt-8 flex items-center justify-center py-4">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600">Loading more collections...</span>
                      </div>
                    </div>
                  )}

                  {/* Sentinel for intersection observer */}
                  {hasMoreCollections && (
                    <div ref={collectionsSentinelRef} className="py-4 text-center text-sm text-gray-500">
                      Scroll for more collections...
                    </div>
                  )}

                  {/* End indicator */}
                  {!hasMoreCollections && visibleCollections.length > 0 && (
                    <div className="mt-8 py-8 text-center text-gray-500">
                      <div className="text-lg mb-2">📁</div>
                      <p className="text-sm">You've reached the end of your collections</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Collections Manager Modal */}
      {showCollectionsManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <CollectionsManager
            onClose={() => {
              setShowCollectionsManager(false);
              setSelectedCollection(null);
            }}
            selectedCollection={selectedCollection}
          />
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
                    <Image className="h-16 w-16" />
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
                    <p className="text-sm font-medium text-gray-500">Price</p>
                    <p className="text-gray-900 dark:text-white">{formatPrice(selectedArtwork.price)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Favorited</p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedArtwork.favoritedAt ? new Date(selectedArtwork.favoritedAt).toLocaleDateString() : 'Unknown'}
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(purchaseArtwork.price)}</p>
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
    </div>
  );
};

export default FavoritesPageOptimized;
