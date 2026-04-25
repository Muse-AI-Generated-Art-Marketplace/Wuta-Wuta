import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = '/api';

const useFavoritesStore = create(
  persist(
    (set, get) => ({
      // Favorites State
      favorites: [],
      favoriteIds: new Set(), // For O(1) lookup
      favoritesLoading: false,
      favoritesError: null,

      // Collections State
      collections: [],
      collectionsLoading: false,
      collectionsError: null,

      // Current collection being viewed
      currentCollection: null,
      currentCollectionLoading: false,

      // ============ FAVORITES ACTIONS ============

      /**
       * Fetch all favorites from API
       */
      fetchFavorites: async () => {
        set({ favoritesLoading: true, favoritesError: null });
        try {
          const response = await fetch(`${API_URL}/favorites`, {
            headers: {
              'Content-Type': 'application/json',
              // TODO: Add auth token from wallet store
              'x-user-id': localStorage.getItem('userId') || '',
            },
          });
          const result = await response.json();

          if (result.success) {
            const favoriteIds = new Set(result.data.map((f: any) => f.artwork.id));
            set({
              favorites: result.data,
              favoriteIds,
              favoritesLoading: false,
            });
          } else {
            throw new Error(result.error || 'Failed to fetch favorites');
          }
        } catch (error: any) {
          set({
            favoritesError: error.message,
            favoritesLoading: false,
          });
        }
      },

      /**
       * Add artwork to favorites
       */
      addFavorite: async (artworkId: string) => {
        const { favoriteIds, favorites } = get();
        if (favoriteIds.has(artworkId)) return; // Already favorited

        try {
          const response = await fetch(`${API_URL}/favorites/${artworkId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': localStorage.getItem('userId') || '',
            },
          });
          const result = await response.json();

          if (result.success) {
            // Optimistic update
            const newFavoriteIds = new Set(favoriteIds);
            newFavoriteIds.add(artworkId);
            set({
              favoriteIds: newFavoriteIds,
              favorites: [result.data, ...favorites],
            });
          }
        } catch (error) {
          console.error('Failed to add favorite:', error);
        }
      },

      /**
       * Remove artwork from favorites
       */
      removeFavorite: async (artworkId: string) => {
        const { favoriteIds, favorites } = get();
        if (!favoriteIds.has(artworkId)) return; // Not favorited

        try {
          const response = await fetch(`${API_URL}/favorites/${artworkId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': localStorage.getItem('userId') || '',
            },
          });
          const result = await response.json();

          if (result.success) {
            const newFavoriteIds = new Set(favoriteIds);
            newFavoriteIds.delete(artworkId);
            set({
              favoriteIds: newFavoriteIds,
              favorites: favorites.filter((f: any) => f.artwork.id !== artworkId),
            });
          }
        } catch (error) {
          console.error('Failed to remove favorite:', error);
        }
      },

      /**
       * Toggle favorite status
       */
      toggleFavorite: async (artworkId: string) => {
        const { favoriteIds, addFavorite, removeFavorite } = get();
        if (favoriteIds.has(artworkId)) {
          await removeFavorite(artworkId);
        } else {
          await addFavorite(artworkId);
        }
      },

      /**
       * Check if artwork is favorited
       */
      isFavorited: (artworkId: string) => {
        return get().favoriteIds.has(artworkId);
      },

      // ============ COLLECTIONS ACTIONS ============

      /**
       * Fetch all collections from API
       */
      fetchCollections: async () => {
        set({ collectionsLoading: true, collectionsError: null });
        try {
          const response = await fetch(`${API_URL}/favorites/collections`, {
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': localStorage.getItem('userId') || '',
            },
          });
          const result = await response.json();

          if (result.success) {
            set({
              collections: result.data,
              collectionsLoading: false,
            });
          } else {
            throw new Error(result.error || 'Failed to fetch collections');
          }
        } catch (error: any) {
          set({
            collectionsError: error.message,
            collectionsLoading: false,
          });
        }
      },

      /**
       * Fetch single collection with artworks
       */
      fetchCollection: async (collectionId: string) => {
        set({ currentCollectionLoading: true });
        try {
          const response = await fetch(`${API_URL}/favorites/collections/${collectionId}`, {
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': localStorage.getItem('userId') || '',
            },
          });
          const result = await response.json();

          if (result.success) {
            set({
              currentCollection: result.data,
              currentCollectionLoading: false,
            });
          } else {
            throw new Error(result.error || 'Failed to fetch collection');
          }
        } catch (error: any) {
          set({ currentCollectionLoading: false });
          console.error('Failed to fetch collection:', error);
        }
      },

      /**
       * Create a new collection
       */
      createCollection: async (data: { name: string; description?: string; coverImage?: string; isPublic?: boolean }) => {
        try {
          const response = await fetch(`${API_URL}/favorites/collections`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': localStorage.getItem('userId') || '',
            },
            body: JSON.stringify(data),
          });
          const result = await response.json();

          if (result.success) {
            set((state) => ({
              collections: [result.data, ...state.collections],
            }));
            return result.data;
          }
        } catch (error) {
          console.error('Failed to create collection:', error);
        }
        return null;
      },

      /**
       * Update collection
       */
      updateCollection: async (collectionId: string, data: Partial<{ name: string; description: string; coverImage: string; isPublic: boolean }>) => {
        try {
          const response = await fetch(`${API_URL}/favorites/collections/${collectionId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': localStorage.getItem('userId') || '',
            },
            body: JSON.stringify(data),
          });
          const result = await response.json();

          if (result.success) {
            set((state) => ({
              collections: state.collections.map((c: any) =>
                c.id === collectionId ? { ...c, ...result.data } : c
              ),
            }));
          }
        } catch (error) {
          console.error('Failed to update collection:', error);
        }
      },

      /**
       * Delete collection
       */
      deleteCollection: async (collectionId: string) => {
        try {
          const response = await fetch(`${API_URL}/favorites/collections/${collectionId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': localStorage.getItem('userId') || '',
            },
          });
          const result = await response.json();

          if (result.success) {
            set((state) => ({
              collections: state.collections.filter((c: any) => c.id !== collectionId),
            }));
          }
        } catch (error) {
          console.error('Failed to delete collection:', error);
        }
      },

      /**
       * Add artwork to collection
       */
      addToCollection: async (collectionId: string, artworkId: string) => {
        try {
          const response = await fetch(`${API_URL}/favorites/collections/${collectionId}/artworks/${artworkId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': localStorage.getItem('userId') || '',
            },
          });
          const result = await response.json();
          return result.success;
        } catch (error) {
          console.error('Failed to add to collection:', error);
          return false;
        }
      },

      /**
       * Remove artwork from collection
       */
      removeFromCollection: async (collectionId: string, artworkId: string) => {
        try {
          const response = await fetch(`${API_URL}/favorites/collections/${collectionId}/artworks/${artworkId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': localStorage.getItem('userId') || '',
            },
          });
          const result = await response.json();
          return result.success;
        } catch (error) {
          console.error('Failed to remove from collection:', error);
          return false;
        }
      },

      /**
       * Clear current collection
       */
      clearCurrentCollection: () => {
        set({ currentCollection: null });
      },
    }),
    {
      name: 'wuta-favorites-storage',
      partialize: (state) => ({
        // Only persist these fields
        favorites: state.favorites,
        favoriteIds: Array.from(state.favoriteIds),
      }),
      merge: (persisted: any, current) => ({
        ...current,
        ...persisted,
        favoriteIds: new Set(persisted?.favoriteIds || []),
      }),
    }
  )
);

export default useFavoritesStore;