import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUserProfileStore = create(
  persist(
    (set, get) => ({
      // User Profile State
      profile: {
        username: '',
        bio: '',
        avatar: '',
        banner: '',
        socialLinks: {
          twitter: '',
          instagram: '',
          website: '',
          discord: ''
        },
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: true,
          publicProfile: true
        },
        stats: {
          totalArtworks: 0,
          totalSales: 0,
          totalValue: 0,
          totalEarnings: 0,
          activeListings: 0,
          averagePrice: 0,
          followers: 0,
          following: 0,
          createdAt: null
        },
        achievements: [],
        verification: {
          isVerified: false,
          verificationLevel: 'basic', // basic, verified, premium
          badges: []
        }
      },

      // Collection State
      collection: {
        artworks: [],
        loading: false,
        error: null,
        filters: {
          category: 'all',
          priceRange: [0, 100],
          dateRange: null,
          status: 'all' // owned, listed, sold
        },
        sortBy: 'recent',
        viewMode: 'grid'
      },

      // Trading History State
      tradingHistory: {
        transactions: [],
        loading: false,
        error: null,
        filters: {
          type: 'all', // buy, sell, list, cancel
          dateRange: null,
          priceRange: [0, 100]
        },
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          hasMore: true
        }
      },

      // Analytics State
      analytics: {
        salesData: [],
        viewsData: [],
        engagementData: [],
        loading: false,
        error: null,
        timeRange: '30d' // 7d, 30d, 90d, 1y
      },

      // Actions
      updateProfile: async (profileData) => {
        try {
          set({ loading: true, error: null });
          
          const updatedProfile = {
            ...get().profile,
            ...profileData,
            updatedAt: new Date().toISOString()
          };

          set({
            profile: updatedProfile,
            loading: false
          });

          return updatedProfile;
        } catch (error) {
          console.error('Failed to update profile:', error);
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      uploadAvatar: async (_file) => {
        try {
          set({ loading: true, error: null });
          
          // In real implementation, upload to IPFS or cloud storage
          const avatarUrl = `https://api.muse.art/avatars/${Date.now()}`;
          
          set(state => ({
            profile: {
              ...state.profile,
              avatar: avatarUrl
            },
            loading: false
          }));

          return avatarUrl;
        } catch (error) {
          console.error('Failed to upload avatar:', error);
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      uploadBanner: async (_file) => {
        try {
          set({ loading: true, error: null });
          
          // In real implementation, upload to IPFS or cloud storage
          const bannerUrl = `https://api.muse.art/banners/${Date.now()}`;
          
          set(state => ({
            profile: {
              ...state.profile,
              banner: bannerUrl
            },
            loading: false
          }));

          return bannerUrl;
        } catch (error) {
          console.error('Failed to upload banner:', error);
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      loadUserCollection: async (userAddress) => {
        try {
          set(state => ({
            collection: {
              ...state.collection,
              loading: true,
              error: null
            }
          }));

          // In real implementation, fetch from blockchain/API
          const mockArtworks = [
            {
              id: '1',
              title: 'Cosmic Dreams',
              description: 'An ethereal journey through space and consciousness',
              imageUrl: 'https://api.muse.art/artwork/1.jpg',
              aiModel: 'Stable Diffusion',
              prompt: 'A cosmic dream with floating islands and aurora borealis',
              owner: userAddress,
              creator: userAddress,
              price: 0.5,
              listed: true,
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              views: 1250,
              likes: 89,
              evolutionCount: 2,
              attributes: [
                { trait_type: 'Style', value: 'Abstract' },
                { trait_type: 'Color', value: 'Blue' },
                { trait_type: 'Mood', value: 'Dreamy' }
              ]
            },
            {
              id: '2',
              title: 'Digital Sunset',
              description: 'A perfect sunset captured through AI imagination',
              imageUrl: 'https://api.muse.art/artwork/2.jpg',
              aiModel: 'DALL-E 3',
              prompt: 'Digital art sunset over cyberpunk city',
              owner: userAddress,
              creator: userAddress,
              price: 0.3,
              listed: false,
              createdAt: new Date(Date.now() - 172800000).toISOString(),
              views: 890,
              likes: 67,
              evolutionCount: 0,
              attributes: [
                { trait_type: 'Style', value: 'Landscape' },
                { trait_type: 'Color', value: 'Orange' },
                { trait_type: 'Mood', value: 'Peaceful' }
              ]
            }
          ];

          set(state => ({
              artworks: mockArtworks,
              loading: false
            }
          }));

          // Update stats based on collection
          set(state => ({
            profile: {
              ...state.profile,
              stats: {
                ...state.profile.stats,
                totalArtworks: mockArtworks.length,
                totalValue: mockArtworks.reduce((sum, art) => sum + (art.price || 0), 0)
              }
            }
          }));

          return mockArtworks;
        } catch (error) {
          console.error('Failed to load collection:', error);
          set(state => ({
            collection: {
              ...state.collection,
              error: error.message,
              loading: false
            }
          }));
          throw error;
        }
      },

      loadTradingHistory: async (userAddress) => {
        try {
          set(state => ({
            tradingHistory: {
              ...state.tradingHistory,
              loading: true,
              error: null
            }
          }));

          // In real implementation, fetch from blockchain/API
          const mockTransactions = [
            {
              id: '1',
              type: 'sale',
              artworkId: 'art-001',
              artworkTitle: 'Cosmic Dreams',
              artworkImage: 'https://api.muse.art/artwork/1.jpg',
              price: 0.5,
              buyer: '0x1234567890123456789012345678901234567890',
              seller: userAddress,
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
              gasUsed: '0.0021',
              status: 'completed'
            },
            {
              id: '2',
              type: 'purchase',
              artworkId: 'art-002',
              artworkTitle: 'Digital Sunset',
              artworkImage: 'https://api.muse.art/artwork/2.jpg',
              price: 0.3,
              buyer: userAddress,
              seller: '0x0987654321098765432109876543210987654321',
              timestamp: new Date(Date.now() - 172800000).toISOString(),
              txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
              gasUsed: '0.0018',
              status: 'completed'
            },
            {
              id: '3',
              type: 'listing',
              artworkId: 'art-003',
              artworkTitle: 'Abstract Mind',
              artworkImage: 'https://api.muse.art/artwork/3.jpg',
              price: 0.8,
              seller: userAddress,
              timestamp: new Date(Date.now() - 259200000).toISOString(),
              txHash: null,
              gasUsed: null,
              status: 'active'
            }
          ];

          set(state => ({
            tradingHistory: {
              ...state.tradingHistory,
              transactions: mockTransactions,
              loading: false,
              pagination: {
                ...state.tradingHistory.pagination,
                total: mockTransactions.length
              }
            }
          }));

          // Update stats based on trading history
          const sales = mockTransactions.filter(tx => tx.type === 'sale');
          const totalEarnings = sales.reduce((sum, tx) => sum + tx.price, 0);
          
          set(state => ({
            profile: {
              ...state.profile,
              stats: {
                ...state.profile.stats,
                totalSales: sales.length,
                totalEarnings: totalEarnings
              },
              achievements: [
                { id: '1', name: 'First Sale', description: 'Made your first sale on Muse', icon: '🏆', date: sales.length > 0 ? sales[0].timestamp : null },
                { id: '2', name: 'Collector', description: 'Owned more than 5 artworks', icon: '🖼️', date: get().collection.artworks.length > 5 ? new Date().toISOString() : null },
                { id: '3', name: 'Top Earner', description: 'Earned more than 10 ETH', icon: '💰', date: totalEarnings > 10 ? new Date().toISOString() : null }
              ]
            }
          }));

          return mockTransactions;
        } catch (error) {
          console.error('Failed to load trading history:', error);
          set(state => ({
            tradingHistory: {
              ...state.tradingHistory,
              error: error.message,
              loading: false
            }
          }));
          throw error;
        }
      },

      loadAnalytics: async (userAddress, timeRange = '30d') => {
        try {
          set(state => ({
            analytics: {
              ...state.analytics,
              loading: true,
              error: null
            }
          }));

          // In real implementation, fetch from analytics API
          const mockAnalytics = {
            salesData: [
              { date: '2024-01-01', sales: 2, revenue: 0.8 },
              { date: '2024-01-02', sales: 1, revenue: 0.3 },
              { date: '2024-01-03', sales: 3, revenue: 1.2 },
              { date: '2024-01-04', sales: 1, revenue: 0.5 },
              { date: '2024-01-05', sales: 2, revenue: 0.9 }
            ],
            viewsData: [
              { date: '2024-01-01', views: 150 },
              { date: '2024-01-02', views: 230 },
              { date: '2024-01-03', views: 189 },
              { date: '2024-01-04', views: 310 },
              { date: '2024-01-05', views: 267 }
            ],
            engagementData: [
              { type: 'likes', count: 234 },
              { type: 'comments', count: 45 },
              { type: 'shares', count: 67 },
              { type: 'saves', count: 89 }
            ]
          };

          set(state => ({
            analytics: {
              ...state.analytics,
              ...mockAnalytics,
              timeRange,
              loading: false
            }
          }));

          return mockAnalytics;
        } catch (error) {
          console.error('Failed to load analytics:', error);
          set(state => ({
            analytics: {
              ...state.analytics,
              error: error.message,
              loading: false
            }
          }));
          throw error;
        }
      },

      updateCollectionFilters: (filters) => {
        set(state => ({
          collection: {
            ...state.collection,
            filters: {
              ...state.collection.filters,
              ...filters
            }
          }
        }));
      },

      updateCollectionSort: (sortBy) => {
        set(state => ({
          collection: {
            ...state.collection,
            sortBy
          }
        }));
      },

      updateCollectionView: (viewMode) => {
        set(state => ({
          collection: {
            ...state.collection,
            viewMode
          }
        }));
      },

      updateTradingHistoryFilters: (filters) => {
        set(state => ({
          tradingHistory: {
            ...state.tradingHistory,
            filters: {
              ...state.tradingHistory.filters,
              ...filters
            }
          }
        }));
      },

      loadMoreTransactions: async () => {
        try {
          const { pagination } = get().tradingHistory;
          
          if (!pagination.hasMore) return;

          set(state => ({
            tradingHistory: {
              ...state.tradingHistory,
              loading: true
            }
          }));

          // In real implementation, fetch next page
          // For now, simulate no more data
          set(state => ({
            tradingHistory: {
              ...state.tradingHistory,
              pagination: {
                ...pagination,
                hasMore: false
              },
              loading: false
            }
          }));

        } catch (error) {
          console.error('Failed to load more transactions:', error);
          set(state => ({
            tradingHistory: {
              ...state.tradingHistory,
              error: error.message,
              loading: false
            }
          }));
        }
      },

      // Getters
      // Get price history for a specific artwork
      getPriceHistoryForArtwork: (artworkId) => {
        const { transactions } = get().tradingHistory;
        
        // Filter transactions for this artwork and return price data
        const artworkSales = transactions
          .filter(tx => tx.artworkId === artworkId && (tx.type === 'sale' || tx.type === 'purchase'))
          .map(tx => ({
            timestamp: tx.timestamp,
            price: tx.price,
            buyer: tx.buyer,
            seller: tx.seller,
            txHash: tx.txHash
          }))
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        return artworkSales;
      },

      getFilteredCollection: () => {
        const { artworks, filters, sortBy } = get().collection;
        
        const filtered = artworks.filter(artwork => {
          if (filters.category !== 'all') {
            // Filter by category based on attributes
            const hasCategory = artwork.attributes?.some(attr => 
              attr.trait_type === 'Style' && attr.value.toLowerCase() === filters.category.toLowerCase()
            );
            if (!hasCategory) return false;
          }

          if (filters.status !== 'all') {
            if (filters.status === 'listed' && !artwork.listed) return false;
            if (filters.status === 'owned' && artwork.listed) return false;
          }

          if (filters.priceRange) {
            const price = artwork.price || 0;
            if (price < filters.priceRange[0] || price > filters.priceRange[1]) return false;
          }

          return true;
        });

        // Sort
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'recent':
              return new Date(b.createdAt) - new Date(a.createdAt);
            case 'price-high':
              return (b.price || 0) - (a.price || 0);
            case 'price-low':
              return (a.price || 0) - (b.price || 0);
            case 'views':
              return (b.views || 0) - (a.views || 0);
            case 'likes':
              return (b.likes || 0) - (a.likes || 0);
            default:
              return 0;
          }
        });

        return filtered;
      },

      getFilteredTradingHistory: () => {
        const { transactions, filters } = get().tradingHistory;
        
        return transactions.filter(transaction => {
          if (filters.type !== 'all' && transaction.type !== filters.type) {
            return false;
          }

          if (filters.priceRange) {
            if (transaction.price < filters.priceRange[0] || transaction.price > filters.priceRange[1]) {
              return false;
            }
          }

          if (filters.dateRange) {
            const transactionDate = new Date(transaction.timestamp);
            if (transactionDate < filters.dateRange[0] || transactionDate > filters.dateRange[1]) {
              return false;
            }
          }

          return true;
        });
      },

      clearError: () => set({ error: null }),

      resetProfile: () => {
        set({
          profile: {
            username: '',
            bio: '',
            avatar: '',
            banner: '',
            socialLinks: {
              twitter: '',
              instagram: '',
              website: '',
              discord: ''
            },
            preferences: {
              theme: 'light',
              language: 'en',
              notifications: true,
              publicProfile: true
            },
            stats: {
              totalArtworks: 0,
              totalSales: 0,
              totalValue: 0,
              activeListings: 0,
              averagePrice: 0,
              followers: 0,
              following: 0,
              createdAt: null
            },
            verification: {
              isVerified: false,
              verificationLevel: 'basic',
              badges: []
            }
          },
          collection: {
            artworks: [],
            loading: false,
            error: null,
            filters: {
              category: 'all',
              priceRange: [0, 100],
              dateRange: null,
              status: 'all'
            },
            sortBy: 'recent',
            viewMode: 'grid'
          },
          tradingHistory: {
            transactions: [],
            loading: false,
            error: null,
            filters: {
              type: 'all',
              dateRange: null,
              priceRange: [0, 100]
            },
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              hasMore: true
            }
          }
        });
      }
    }),
    {
      name: 'muse-user-profile-storage',
      partialize: (state) => ({
        profile: state.profile,
        collection: {
          filters: state.collection.filters,
          sortBy: state.collection.sortBy,
          viewMode: state.collection.viewMode
        },
        tradingHistory: {
          filters: state.tradingHistory.filters
        }
      })
    }
  )
);

export { useUserProfileStore };
