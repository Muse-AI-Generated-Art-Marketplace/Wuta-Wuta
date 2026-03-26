import { create } from 'zustand';
import { SorobanRpc } from '@sorobanrpc';
import { Keypair, TransactionBuilder, Networks, BASE_FEE } from '@stellar/stellar-sdk';

const useMuseStore = create((set, get) => ({
  // State
  isConnected: false,
  isLoading: false,
  error: null,
  stellarClient: null,
  contracts: {
    artAssetToken: null,
    nftMarketplace: null,
  },
  userAddress: null,
  userKeypair: null,
  artworks: [],
  listings: [],
  offers: [],

  // AI Models
  aiModels: [
    { id: 'stable-diffusion', name: 'Stable Diffusion', description: 'High-quality image generation' },
    { id: 'dall-e-3', name: 'DALL-E 3', description: 'OpenAI\'s image model' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Text generation for prompts' },
    { id: 'midjourney', name: 'Midjourney', description: 'Artistic image generation' },
  ],

  // Actions
  initializeMuse: async () => {
    set({ isLoading: true, error: null });
    try {
      const rpcUrl = process.env.REACT_APP_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
      const stellarClient = new SorobanRpc(rpcUrl);
      
      const contracts = {
        artAssetToken: process.env.REACT_APP_ART_ASSET_TOKEN_CONTRACT,
        nftMarketplace: process.env.REACT_APP_NFT_MARKETPLACE_CONTRACT,
      };

      set({
        isConnected: true,
        isLoading: false,
        stellarClient,
        contracts,
      });
    } catch (error) {
      set({
        isConnected: false,
        isLoading: false,
        error: error.message,
      });
    }
  },

  connectStellarWallet: async (secretKey) => {
    set({ isLoading: true, error: null });
    try {
      const keypair = Keypair.fromSecret(secretKey);
      const address = keypair.publicKey();
      
      set({
        userAddress: address,
        userKeypair: keypair,
        isLoading: false,
      });
    } catch (error) {
      set({
        userAddress: null,
        userKeypair: null,
        isLoading: false,
        error: error.message,
      });
    }
  },

  disconnectWallet: () => {
    set({
      userAddress: null,
      userKeypair: null,
      artworks: [],
      listings: [],
      offers: [],
    });
  },

  createCollaborativeArtwork: async (params) => {
    const { userAddress, stellarClient, contracts } = get();
    
    if (!userAddress || !stellarClient) {
      throw new Error('Not connected to Stellar');
    }

    set({ isLoading: true, error: null });
    
    try {
      // Mock implementation - in real app this would interact with smart contracts
      const artwork = {
        id: Date.now().toString(),
        owner: userAddress,
        metadata: {
          prompt: params.prompt,
          aiModel: params.aiModel,
          humanContribution: params.humanContribution,
          aiContribution: params.aiContribution,
          canEvolve: params.canEvolve,
          contentHash: params.contentHash,
        },
        createdAt: new Date().toISOString(),
        evolutionCount: 0,
        lastEvolved: null,
      };

      set(state => ({
        artworks: [...state.artworks, artwork],
        isLoading: false,
      }));

      return artwork;
    } catch (error) {
      set({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  generateArtwork: async (params) => {
    const { aiModel } = params;
    
    // Mock implementation - in real app this would call AI service
    const modelMap = {
      'stable-diffusion': 'stable-diffusion',
      'dall-e-3': 'dall-e-3',
      'gpt-4': 'stable-diffusion',
      'midjourney': 'stable-diffusion',
    };

    const model = modelMap[aiModel] || 'stable-diffusion';
    return `https://api.muse.art/generated/${model}.jpg`;
  },

  listArtwork: async (tokenId, price, duration) => {
    const { userAddress, stellarClient } = get();
    
    if (!userAddress || !stellarClient) {
      throw new Error('Not connected to Stellar');
    }

    set({ isLoading: true, error: null });

    try {
      const listing = {
        id: Date.now().toString(),
        tokenId,
        price,
        seller: userAddress,
        duration,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + duration * 1000).toISOString(),
        active: true,
      };

      set(state => ({
        listings: [...state.listings, listing],
        isLoading: false,
      }));

      return listing;
    } catch (error) {
      set({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  buyArtwork: async (tokenId, amount) => {
    const { userAddress, stellarClient, listings } = get();
    
    if (!userAddress || !stellarClient) {
      throw new Error('Not connected to Stellar');
    }

    set({ isLoading: true, error: null });

    try {
      // Remove the listing after purchase
      set(state => ({
        listings: state.listings.filter(listing => listing.tokenId !== tokenId),
        isLoading: false,
      }));

      return { success: true, tokenId, amount };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  evolveArtwork: async (tokenId, evolutionPrompt) => {
    const { userAddress, stellarClient, artworks } = get();
    
    if (!userAddress || !stellarClient) {
      throw new Error('Not connected to Stellar');
    }

    set({ isLoading: true, error: null });

    try {
      const evolvedImage = await get().generateEvolvedArtwork(tokenId, evolutionPrompt);
      
      // Update the artwork
      set(state => ({
        artworks: state.artworks.map(artwork => 
          artwork.id === tokenId
            ? {
                ...artwork,
                evolutionCount: artwork.evolutionCount + 1,
                lastEvolved: new Date().toISOString(),
                evolutionHistory: [
                  ...(artwork.evolutionHistory || []),
                  { prompt: evolutionPrompt, timestamp: new Date().toISOString() }
                ]
              }
            : artwork
        ),
        isLoading: false,
      }));

      return evolvedImage;
    } catch (error) {
      set({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  generateEvolvedArtwork: async (tokenId, prompt) => {
    // Mock implementation
    return `https://api.muse.art/evolved/${tokenId}?prompt=${encodeURIComponent(prompt)}`;
  },

  loadMarketplaceData: async () => {
    const { stellarClient } = get();
    
    if (!stellarClient) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Mock implementation - in real app this would fetch from contracts
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error.message,
      });
    }
  },

  loadUserArtworks: async (userAddress) => {
    set({ isLoading: true, error: null });

    try {
      // Mock implementation - in real app this would fetch from contracts
      set({ 
        artworks: [],
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error.message,
      });
    }
  },

  // Getters
  getArtworkById: (tokenId) => {
    return get().artworks.find(artwork => artwork.id === tokenId);
  },

  getActiveListings: () => {
    return get().listings.filter(listing => listing.active);
  },

  getUserListings: (address) => {
    return get().listings.filter(listing => listing.seller === address);
  },
}));

export { useMuseStore };