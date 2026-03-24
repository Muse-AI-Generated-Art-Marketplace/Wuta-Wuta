import { create } from 'zustand';
import { SorobanRpc } from '@sorobanrpc';
import { Keypair, Horizon } from '@stellar/stellar-sdk';

const useMuseStore = create((set, get) => ({
  // State
  isConnected: false,
  isLoading: false,
  error: null,

  // Stellar connection
  stellarClient: null,
  horizonServer: null,
  network: Networks.FUTURENET,
  rpcUrl: 'https://rpc-futurenet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',

  // Contract addresses
  contracts: {
    artAssetToken: null,
    nftMarketplace: null,
  },

  // User data
  userAddress: null,
  userKeypair: null,

  // Artwork data
  artworks: [],
  listings: [],
  offers: [],

  // Initialize Stellar connection
  initializeMuse: async () => {
    try {
      set({ isLoading: true, error: null });

      const stellarClient = new SorobanRpc.Server(get().rpcUrl); // Soroban RPC client
      const horizonServer = new Server(get().horizonUrl); // Horizon server

      const contracts = {
        artAssetToken: process.env.REACT_APP_ART_ASSET_TOKEN_CONTRACT || 'art_asset_token',
        nftMarketplace: process.env.REACT_APP_NFT_MARKETPLACE_CONTRACT || 'nft_marketplace',
      };

      set({
        stellarClient,
        horizonServer,
        contracts,
        isConnected: true,
        isLoading: false
      });

      get().loadMarketplaceData();
    } catch (error) {
      console.error('Failed to initialize Muse:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  connectStellarWallet: async (secretKey) => {
    try {
      set({ isLoading: true, error: null });

      const keypair = Keypair.fromSecret(secretKey);
      const userAddress = keypair.publicKey();

      set({
        userAddress,
        userKeypair: keypair,
        isLoading: false,
      });

      get().loadUserArtworks(userAddress);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  disconnectWallet: () => {
    set({
      userAddress: null,
      userKeypair: null,
      artworks: [],
    });
  },

  // Example: mint NFT using Stellar SDK + Soroban RPC
  createCollaborativeArtwork: async (params) => {
    try {
      set({ isLoading: true, error: null });

      const { stellarClient, contracts, userAddress } = get();
      if (!stellarClient || !userAddress) throw new Error('Not connected to Stellar');

      const metadata = {
        prompt: params.prompt,
        aiModel: params.aiModel,
        humanContribution: params.humanContribution,
        aiContribution: params.aiContribution,
        canEvolve: params.canEvolve,
        timestamp: Date.now(),
      };
      
      // Generate transaction ID for tracking
      const transactionId = `artwork-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Add transaction to notification system
      const notificationStore = useTransactionNotificationStore.getState();
      notificationStore.addTransaction({
        id: transactionId,
        type: 'NFT Mint',
        details: {
          prompt: params.prompt,
          aiModel: params.aiModel,
          userAddress
        }
      });
      
      // Call smart contract to mint NFT
      const mintTx = await stellarClient.sendTransaction(
        new SorobanRpc.TransactionBuilder(userAddress, {
          fee: 100,
          networkPassphrase: get().network,
        })
        .addOperation(
          new SorobanRpc.Operation.invokeHostFunction({
            contract: new SorobanRpc.Contract(contracts.artAssetToken),
            functionName: 'mint',
            args: [
              new SorobanRpc.Address(userAddress),
              1, // Amount for NFT
              JSON.stringify(metadata),
              params.contentHash || '0x0000000000000000000000000000000000000000',
            ],
          })
        )
        .build()
      );
      
      // Update transaction with hash
      if (mintTx.hash) {
        notificationStore.updateTransactionStatus(transactionId, notificationStore.STATUS.PENDING, {
          hash: mintTx.hash
        });
      }
      
      // Generate AI artwork (in real implementation)
      const aiGeneratedImage = await get().generateArtwork(params);

      const newArtwork = {
        id: Date.now().toString(),
        tokenUri: `https://api.muse.art/metadata/${Date.now()}`,
        imageUrl: aiGeneratedImage,
        metadata,
        owner: userAddress,
        createdAt: new Date().toISOString(),
      };

      set(state => ({ artworks: [...state.artworks, newArtwork], isLoading: false }));

      return newArtwork;
    } catch (error) {
      console.error('Failed to create artwork:', error);
      
      // Update transaction status to failed
      const notificationStore = useTransactionNotificationStore.getState();
      const pendingTransactions = notificationStore.getPendingTransactions();
      const relevantTransaction = pendingTransactions.find(tx => 
        tx.type === 'NFT Mint' && 
        tx.details.prompt === params.prompt
      );
      
      if (relevantTransaction) {
        notificationStore.updateTransactionStatus(relevantTransaction.id, notificationStore.STATUS.FAILED, {
          error: error.message
        });
      }
      
      set({ 
        error: error.message, 
        isLoading: false 
      });
      throw error;
    }
  },

  generateArtwork: async (params) => {
    try {
      // In real implementation, this would call AI APIs
      // For now, return a placeholder
      const aiModels = {
        'stable-diffusion': 'https://api.muse.art/generated/stable-diffusion.jpg',
        'dall-e-3': 'https://api.muse.art/generated/dall-e-3.jpg',
        'midjourney': 'https://api.muse.art/generated/midjourney.jpg',
      };
      
      return aiModels[params.aiModel] || aiModels['stable-diffusion'];
      
    } catch (error) {
      console.error('Failed to generate artwork:', error);
      throw error;
    }
  },
  
  // Marketplace functions
  listArtwork: async (tokenId, price, duration) => {
    try {
      set({ isLoading: true, error: null });
      
      const { stellarClient, contracts, userAddress } = get();
      if (!stellarClient || !userAddress) throw new Error('Not connected to Stellar');
      
      // Generate transaction ID for tracking
      const transactionId = `listing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Add transaction to notification system
      const notificationStore = useTransactionNotificationStore.getState();
      notificationStore.addTransaction({
        id: transactionId,
        type: 'NFT Listing',
        details: {
          tokenId,
          price,
          duration,
          userAddress
        }
      });
      
      const listTx = await stellarClient.sendTransaction(
        new SorobanRpc.TransactionBuilder(userAddress, {
          fee: 100,
          networkPassphrase: get().network,
        })
        .addOperation(
          new SorobanRpc.Operation.invokeHostFunction({
            contract: new SorobanRpc.Contract(contracts.nftMarketplace),
            functionName: 'list_nft',
            args: [
              new SorobanRpc.Address(userAddress),
              tokenId,
              price,
              duration,
            ],
          })
        )
        .build()
      );
      
      // Update transaction with hash
      if (listTx.hash) {
        notificationStore.updateTransactionStatus(transactionId, notificationStore.STATUS.PENDING, {
          hash: listTx.hash
        });
      }
      
      // Update local state
      const newListing = {
        id: Date.now().toString(),
        tokenId,
        seller: userAddress,
        price,
        duration,
        expires: Date.now() + duration * 1000,
        active: true,
        transactionId,
      };
      
      set(state => ({
        listings: [...state.listings, newListing],
        isLoading: false,
      }));
      
      return newListing;
      
    } catch (error) {
      console.error('Failed to list artwork:', error);
      
      // Update transaction status to failed
      const notificationStore = useTransactionNotificationStore.getState();
      const pendingTransactions = notificationStore.getPendingTransactions();
      const relevantTransaction = pendingTransactions.find(tx => 
        tx.type === 'NFT Listing' && 
        tx.details.tokenId === tokenId
      );
      
      if (relevantTransaction) {
        notificationStore.updateTransactionStatus(relevantTransaction.id, notificationStore.STATUS.FAILED, {
          error: error.message
        });
      }
      
      set({ 
        error: error.message, 
        isLoading: false 
      });
      throw error;
    }
  },
  
  buyArtwork: async (tokenId, amount) => {
    try {
      set({ isLoading: true, error: null });
      
      const { stellarClient, contracts, userAddress } = get();
      if (!stellarClient || !userAddress) throw new Error('Not connected to Stellar');
      
      // Generate transaction ID for tracking
      const transactionId = `purchase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Add transaction to notification system
      const notificationStore = useTransactionNotificationStore.getState();
      notificationStore.addTransaction({
        id: transactionId,
        type: 'NFT Purchase',
        details: {
          tokenId,
          amount,
          userAddress
        }
      });
      
      const buyTx = await stellarClient.sendTransaction(
        new SorobanRpc.TransactionBuilder(userAddress, {
          fee: 100,
          networkPassphrase: get().network,
        })
        .addOperation(
          new SorobanRpc.Operation.invokeHostFunction({
            contract: new SorobanRpc.Contract(contracts.nftMarketplace),
            functionName: 'buy_nft',
            args: [
              new SorobanRpc.Address(userAddress),
              tokenId,
              amount,
            ],
          })
        )
        .build()
      );
      
      // Update transaction with hash
      if (buyTx.hash) {
        notificationStore.updateTransactionStatus(transactionId, notificationStore.STATUS.PENDING, {
          hash: buyTx.hash
        });
      }
      
      // Update local state
      set(state => ({
        listings: state.listings.filter(listing => listing.tokenId !== tokenId),
        isLoading: false,
      }));
      
      return buyTx;
      
    } catch (error) {
      console.error('Failed to buy artwork:', error);
      
      // Update transaction status to failed
      const notificationStore = useTransactionNotificationStore.getState();
      const pendingTransactions = notificationStore.getPendingTransactions();
      const relevantTransaction = pendingTransactions.find(tx => 
        tx.type === 'NFT Purchase' && 
        tx.details.tokenId === tokenId
      );
      
      if (relevantTransaction) {
        notificationStore.updateTransactionStatus(relevantTransaction.id, notificationStore.STATUS.FAILED, {
          error: error.message
        });
      }
      
      set({ 
        error: error.message, 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Evolution functions
  evolveArtwork: async (tokenId, evolutionPrompt) => {
    try {
      set({ isLoading: true, error: null });
      
      const { stellarClient, contracts, userAddress } = get();
      if (!stellarClient || !userAddress) throw new Error('Not connected to Stellar');
      
      // Generate evolved artwork
      const evolvedImage = await get().generateEvolvedArtwork(tokenId, evolutionPrompt);
      
      // Update artwork in local state
      set(state => ({
        artworks: state.artworks.map(artwork => 
          artwork.id === tokenId 
            ? { 
                ...artwork, 
                imageUrl: evolvedImage,
                evolutionCount: (artwork.evolutionCount || 0) + 1,
                lastEvolved: new Date().toISOString(),
              }
            : artwork
        ),
        isLoading: false,
      }));
      
      return evolvedImage;
      
    } catch (error) {
      console.error('Failed to evolve artwork:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
      throw error;
    }
  },
  
  generateEvolvedArtwork: async (tokenId, prompt) => {
    // In real implementation, this would use the original artwork + prompt
    return `https://api.muse.art/evolved/${tokenId}?prompt=${encodeURIComponent(prompt)}`;
  },
  
  // Data loading functions
  loadMarketplaceData: async () => {
    try {
      const { stellarClient, contracts } = get();
      if (!stellarClient || !contracts.nftMarketplace) return;

      const listings = await stellarClient.getContractData(
        contracts.nftMarketplace,
        'get_active_listings',
        []
      );
      set({ listings: listings || [] });
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
    }
  },

  loadUserArtworks: async (userAddress) => {
    set({ artworks: [] });
  },
}));

export { useMuseStore };