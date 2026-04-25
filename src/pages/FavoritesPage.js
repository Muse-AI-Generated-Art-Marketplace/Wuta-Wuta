import React, { useEffect, useState } from 'react';
import { Heart, Folder, Trash2, Edit2, Globe, Lock, Image, X, ShoppingCart } from 'lucide-react';
import { useMuseStore } from '../store/museStore';
import useFavoritesStore from '../store/favoritesStore';
import FavoriteButton from '../components/FavoriteButton';
import CollectionsManager from '../components/CollectionsManager';

/**
 * FavoritesPage - Dedicated page for viewing and managing favorites and collections
 */
const FavoritesPage = () => {
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
  const [selectedCollection, setSelectedCollection] = useState(null);

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
  }).filter(Boolean);

  const handleBuyArtwork = async (artworkId, price) => {
    if (buyArtwork) {
      await buyArtwork(artworkId, price);
    }
  };

  const formatAddress = (address = '') => {
    if (!address) return 'Unknown';
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <section className="min-h-[calc(100vh-5rem)] bg-gray-50 dark:bg-gray-950 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-br from-red-900 via-pink-900 to-rose-900 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-pink-200/80">Your Collection</p>
              <h1 className="text-3xl font-bold">Favorites & Collections</h1>
              <p className="mt-3 max-w-2xl text-sm text-pink-100/80">
                Manage your favorite artworks and organize them into custom collections.
              </p>
            </div>

            <div className="grid gap-3 rounded-3xl bg-white/10 p-4 backdrop-blur-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/60">Favorites</p>
                <p className="mt-1 text-2xl font-bold">{favorites.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/60">Collections</p>
                <p className="mt-1 text-2xl font-bold">{collections.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-2xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900 inline-flex">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium transition-all ${
              activeTab === 'favorites'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            <Heart className="w-4 h-4" />
            Favorites
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium transition-all ${
              activeTab === 'collections'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            <Folder className="w-4 h-4" />
            Collections
          </button>
        </div>

        {/* Content */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {activeTab === 'favorites' ? (
            favoritesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : favoriteArtworks.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-lg font-semibold text-gray-900 dark:text-white">No favorites yet</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Browse the gallery and click the heart icon to save your favorite artworks
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {favoriteArtworks.map((artwork) => (
                  <div
                    key={artwork.id}
                    className="group overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      {artwork.imageUrl ? (
                        <img
                          src={artwork.imageUrl}
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
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{artwork.title}</h3>
                        <p className="text-xs text-gray-500">
                          Favorited {new Date(artwork.favoritedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {artwork.listing?.price ? `${artwork.listing.price} XLM` : 'Not listed'}
                        </span>
                        {artwork.listing?.price && (
                          <button
                            onClick={() => handleBuyArtwork(artwork.id, artwork.listing.price)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Buy
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Organize your favorite artworks into collections
                </p>
                <button
                  onClick={() => setShowCollectionsManager(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors"
                >
                  <Folder className="w-4 h-4" />
                  Manage Collections
                </button>
              </div>

              {collections.length === 0 ? (
                <div className="text-center py-12">
                  <Folder className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">No collections yet</p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Create a collection to organize your favorite artworks
                  </p>
                  <button
                    onClick={() => setShowCollectionsManager(true)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700"
                  >
                    <Folder className="w-4 h-4" />
                    Create Collection
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {collections.map((collection) => (
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
                  ))}
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
            onSelectCollection={(collection) => {
              setSelectedCollection(collection);
            }}
            mode="manage"
          />
        </div>
      )}
    </section>
  );
};

export default FavoritesPage;