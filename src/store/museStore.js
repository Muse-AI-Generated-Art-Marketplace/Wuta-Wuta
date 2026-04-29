import { create } from 'zustand';
import { Server } from 'soroban-client';
import { Keypair, TransactionBuilder, Networks, BASE_FEE } from '@stellar/stellar-sdk';

const useMuseStore = create((set, get) => ({
  // State
  isConnected: false,
  isLoading: false,
  error: null,
  stellarClient: null,
  horizonServer: null,
  contracts: {
    artAssetToken: null,
    nftMarketplace: null,
  },
  userAddress: null,
  userKeypair: null,
  artworks: [],
  listings: [],
  offers: [],
  advancedParameters: {
    temperature: 0.8,
    topK: 50,
    topP: 0.9,
    guidanceScale: 7.5,
    numInferenceSteps: 50,
  },

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
      const horizonUrl = process.env.REACT_APP_HORIZON_URL || 'https://horizon-testnet.stellar.org';
      
      const stellarClient = new Server(rpcUrl);
      // Mocking horizonServer since we don't have the full sdk setup here, but standard practice
      const horizonServer = {
        transactions: () => ({
          transaction: (hash) => ({
            call: async () => ({ successful: true })
          })
        })
      };
      
      const contracts = {
        artAssetToken: process.env.REACT_APP_ART_ASSET_TOKEN_CONTRACT || 'CC...ART',
        nftMarketplace: process.env.REACT_APP_NFT_MARKETPLACE_CONTRACT || 'CC...MKP',
      };

      set({
        isConnected: true,
        isLoading: false,
        stellarClient,
        horizonServer,
        contracts,
      });

      // Load initial data
      await get().loadMarketplaceData();
    } catch (error) {
      set({
        isConnected: false,
        isLoading: false,
        error: error.message,
      });
    }
  },

  setAdvancedParameters: (params) => {
    set({ advancedParameters: { ...get().advancedParameters, ...params } });
  },

  registerAIModel: async (model) => {
    set(state => ({
      aiModels: [...state.aiModels, model]
    }));
  },

  clearError: () => set({ error: null }),

  connectStellarWallet: async (secretKey) => {
    set({ isLoading: true, error: null });
    try {
      const keypair = Keypair.fromSecret(secretKey);
      const address = keypair.publicKey();
      
      set({
        userAddress: address,
        userKeypair: keypair,
        isConnected: true,
        isLoading: false,
      });

      await get().loadUserArtworks(address);
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
    const { userAddress, stellarClient } = get();
    
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call/Contract interaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      const artwork = {
        id: `art-${Date.now()}`,
        owner: userAddress || 'anonymous',
        metadata: {
          prompt: params.prompt,
          aiModel: params.aiModel,
          humanContribution: params.humanContribution,
          aiContribution: params.aiContribution,
          canEvolve: params.canEvolve,
          contentHash: params.contentHash,
          tokenURI: params.tokenURI,
        },
        createdAt: new Date().toISOString(),
        evolutionCount: 0,
        lastEvolved: null,
        evolutionHistory: [],
      };

      set(state => ({
        artworks: [artwork, ...state.artworks],
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
    set({ isLoading: true });
    
    try {
      // Simulate AI generation time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const modelMap = {
        'stable-diffusion': 'sd-v1-5',
        'dall-e-3': 'dalle3',
        'gpt-4': 'gpt4-vision',
        'midjourney': 'mj-v6',
      };

      const model = modelMap[aiModel] || 'default';
      set({ isLoading: false });
      return `https://api.muse.art/generated/${model}-${Date.now()}.jpg`;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  listArtwork: async (tokenId, price, duration) => {
    const { userAddress } = get();
    
    set({ isLoading: true, error: null });

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const listing = {
        id: `list-${Date.now()}`,
        tokenId,
        price,
        seller: userAddress,
        duration,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + duration * 1000).toISOString(),
        active: true,
      };

      set(state => ({
        listings: [listing, ...state.listings],
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
    const { userAddress } = get();
    
    set({ isLoading: true, error: null });

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      set(state => ({
        listings: state.listings.map(l => l.tokenId === tokenId ? { ...l, active: false } : l),
        artworks: state.artworks.map(a => a.id === tokenId ? { ...a, owner: userAddress } : a),
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
    set({ isLoading: true, error: null });

    try {
      const evolvedImage = await get().generateEvolvedArtwork(tokenId, evolutionPrompt);
      
      set(state => ({
        artworks: state.artworks.map(artwork => 
          artwork.id === tokenId
            ? {
                ...artwork,
                evolutionCount: artwork.evolutionCount + 1,
                lastEvolved: new Date().toISOString(),
                evolutionHistory: [
                  ...(artwork.evolutionHistory || []),
                  { prompt: evolutionPrompt, timestamp: new Date().toISOString(), image: evolvedImage }
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
    await new Promise(resolve => setTimeout(resolve, 2500));
    return `https://api.muse.art/evolved/${tokenId}?prompt=${encodeURIComponent(prompt)}&t=${Date.now()}`;
  },

  loadMarketplaceData: async () => {
    set({ isLoading: true, error: null });

    try {
      // Simulate fetching from smart contracts
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Seed some dummy data if empty
      if (get().listings.length === 0) {
        set({
          listings: [
            { id: '1', tokenId: 'art-1', price: '100', seller: 'GB...1', active: true, createdAt: new Date().toISOString() },
            { id: '2', tokenId: 'art-2', price: '250', seller: 'GB...2', active: true, createdAt: new Date().toISOString() },
          ]
        });
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error.message,
      });
    }
  },

  loadUserArtworks: async (address) => {
    if (!address) return;
    set({ isLoading: true, error: null });

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, we'd fetch from contract. Here we just filter or mock.
      const userArt = get().artworks.filter(a => a.owner === address);
      
      set({ 
        artworks: userArt.length > 0 ? userArt : get().artworks, // Fallback to all if none for demo
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error.message,
      });
    }
  },

  fetchWutaWutaTransactions: async (address, limit = 10, page = 1) => {
    if (!address) return [];

    try {
      const horizonUrl = process.env.REACT_APP_HORIZON_URL || 'https://horizon-testnet.stellar.org';
      // Use the address to fetch transactions from Horizon
      const response = await fetch(`${horizonUrl}/accounts/${address}/transactions?limit=${limit}&order=desc&include_failed=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions from Horizon');
      }

      const data = await response.json();
      const records = data._embedded.records;

      // Map Horizon transactions to the UI format
      const mappedTransactions = records.map(tx => {
        // Determine type based on operations (simplified for demo)
        // In a full implementation, we'd fetch operations for each tx
        let type = 'Contract Call';
        if (tx.memo_type === 'text' && tx.memo.includes('mint')) type = 'Mint';
        else if (tx.operation_count === 1) type = 'Payment';
        
        return {
          id: tx.id,
          hash: tx.hash,
          type: type,
          amount: { 
            value: (parseFloat(tx.fee_charged) / 10000000).toFixed(7), // Mocking amount as fee fraction for demo
            asset: 'XLM' 
          },
          status: tx.successful ? 'success' : 'failed',
          createdAt: tx.created_at,
          fee: (parseFloat(tx.fee_charged) / 10000000).toString(),
          memo: tx.memo || '',
        };
      });

      return mappedTransactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
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