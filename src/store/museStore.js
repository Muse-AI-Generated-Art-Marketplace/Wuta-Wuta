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
  network: 'Test SDF Future Network ; October 2022',
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
  
  // AI Models
  aiModels: [
    { id: 'stable-diffusion', name: 'Stable Diffusion', type: 'image' },
    { id: 'dall-e-3', name: 'DALL-E 3', type: 'image' },
    { id: 'gpt-4', name: 'GPT-4', type: 'text' },
    { id: 'midjourney', name: 'Midjourney', type: 'image' },
  ],
  
  // Advanced AI Parameters
  advancedParameters: {
    // Generation parameters
    temperature: 0.8,
    topK: 50,
    topP: 0.9,
    guidanceScale: 7.5,
    numInferenceSteps: 50,
    seed: -1,
    
    // Image-specific parameters
    width: 512,
    height: 512,
    quality: 0.9,
    sharpness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    
    // Style parameters
    strength: 0.8,
    noiseLevel: 0.1,
    detailEnhancement: 0.5,
    colorHarmony: 0.7,
    compositionBalance: 0.6,
    
    // Performance parameters
    batchSize: 1,
    enableAttentionSlicing: true,
    enableCpuOffload: false,
    enableModelCaching: true,
    maxGenerationTime: 120,
    
    // Advanced AI parameters
    negativePrompt: '',
    promptWeighting: true,
    crossAttentionControl: 0.5,
    selfAttentionControl: 0.3,
    temporalConsistency: 0.8,
    
    // Model-specific parameters
    modelVersion: 'latest',
    customModelPath: '',
    loraStrength: 0.7,
    controlNetStrength: 0.8,
    embeddingStrength: 0.6
  },
  
  // Parameter presets
  parameterPresets: [
    {
      id: 'photorealistic',
      name: 'Photorealistic',
      description: 'Highly detailed, realistic images',
      parameters: {
        guidanceScale: 7.5,
        numInferenceSteps: 50,
        quality: 0.95,
        sharpness: 1.2,
        contrast: 1.1,
        detailEnhancement: 0.8
      }
    },
    {
      id: 'artistic',
      name: 'Artistic',
      description: 'Creative and stylized outputs',
      parameters: {
        temperature: 1.2,
        guidanceScale: 6.0,
        numInferenceSteps: 40,
        strength: 0.9,
        colorHarmony: 0.8,
        compositionBalance: 0.7
      }
    },
    {
      id: 'fast',
      name: 'Fast Generation',
      description: 'Quick results with lower quality',
      parameters: {
        numInferenceSteps: 20,
        quality: 0.7,
        enableAttentionSlicing: true,
        maxGenerationTime: 60
      }
    },
    {
      id: 'high-quality',
      name: 'High Quality',
      description: 'Maximum quality with longer generation time',
      parameters: {
        guidanceScale: 8.0,
        numInferenceSteps: 100,
        quality: 1.0,
        sharpness: 1.3,
        detailEnhancement: 0.9,
        maxGenerationTime: 180
      }
    }
  ],
  
  // Actions
  initializeMuse: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Initialize Stellar RPC client
      const stellarClient = new SorobanRpc(get().rpcUrl);
      
      // Initialize Horizon server
      const horizonServer = new Horizon.Server(get().horizonUrl);
      
      // Set contract addresses (these would be deployed contracts)
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
      
      // Load initial data
      get().loadMarketplaceData();
      
    } catch (error) {
      console.error('Failed to initialize Muse:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
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
      
      // Load user's artworks
      get().loadUserArtworks(userAddress);
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
    }
  },
  
  disconnectWallet: () => {
    set({
      userAddress: null,
      userKeypair: null,
      artworks: [],
    });
  },
  
  // Artwork creation
  createCollaborativeArtwork: async (params) => {
    try {
      set({ isLoading: true, error: null });
      
      const { stellarClient, contracts, userAddress } = get();
      if (!stellarClient || !userAddress) throw new Error('Not connected to Stellar');
      
      // Create artwork metadata
      const metadata = {
        prompt: params.prompt,
        aiModel: params.aiModel,
        humanContribution: params.humanContribution,
        aiContribution: params.aiContribution,
        canEvolve: params.canEvolve,
        timestamp: Date.now(),
      };
      
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
      
      // Generate AI artwork (in real implementation)
      const aiGeneratedImage = await get().generateArtwork(params);
      
      // Add to local state
      const newArtwork = {
        id: Date.now().toString(),
        tokenUri: `https://api.muse.art/metadata/${Date.now()}`,
        imageUrl: aiGeneratedImage,
        metadata,
        owner: userAddress,
        createdAt: new Date().toISOString(),
      };
      
      set(state => ({
        artworks: [...state.artworks, newArtwork],
        isLoading: false,
      }));
      
      return newArtwork;
      
    } catch (error) {
      console.error('Failed to create artwork:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // AI artwork generation
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
      
      // Update local state
      const newListing = {
        id: Date.now().toString(),
        tokenId,
        seller: userAddress,
        price,
        duration,
        expires: Date.now() + duration * 1000,
        active: true,
      };
      
      set(state => ({
        listings: [...state.listings, newListing],
        isLoading: false,
      }));
      
      return newListing;
      
    } catch (error) {
      console.error('Failed to list artwork:', error);
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
      
      // Update local state
      set(state => ({
        listings: state.listings.filter(listing => listing.tokenId !== tokenId),
        isLoading: false,
      }));
      
      return buyTx;
      
    } catch (error) {
      console.error('Failed to buy artwork:', error);
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
      
      // Load active listings from contract
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
    try {
      // In real implementation, this would query the contract
      // For now, return empty array
      set({ artworks: [] });
      
    } catch (error) {
      console.error('Failed to load user artworks:', error);
    }
  },
  
  // Getters
  getArtworkById: (tokenId) => {
    const { artworks } = get();
    return artworks.find(artwork => artwork.id === tokenId);
  },
  
  getActiveListings: () => {
    const { listings } = get();
    const now = Date.now();
    return listings.filter(listing => listing.active && listing.expires > now);
  },
  
  getUserListings: (userAddress) => {
    const { listings } = get();
    return listings.filter(listing => listing.seller === userAddress);
  },

  // Transaction history functions
  fetchTransactions: async (userAddress, limit = 10, page = 1) => {
    try {
      const { horizonServer } = get();
      if (!horizonServer || !userAddress) throw new Error('Not connected to Horizon');

      const transactions = await horizonServer
        .transactions()
        .forAccount(userAddress)
        .limit(limit)
        .order('desc')
        .call();

      return transactions;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      throw error;
    }
  },

  fetchWutaWutaTransactions: async (userAddress, limit = 10, page = 1) => {
    try {
      const transactions = await get().fetchTransactions(userAddress, limit, page);
      
      // Filter transactions related to Wuta-Wuta contract
      const wutaWutaTxs = await Promise.all(
        transactions.records.map(async (tx) => {
          const isWutaWutaTx = await get().isWutaWutaTransaction(tx);
          return isWutaWutaTx ? get().formatTransaction(tx) : null;
        })
      );

      return wutaWutaTxs.filter(tx => tx !== null);
    } catch (error) {
      console.error('Failed to fetch Wuta-Wuta transactions:', error);
      throw error;
    }
  },

  isWutaWutaTransaction: async (transaction) => {
    try {
      const { contracts } = get();
      if (!contracts.nftMarketplace) return true; // If no contract specified, show all transactions
      
      // Check if transaction involves Wuta-Wuta contract
      const operations = transaction.operations || [];
      return operations.some(op => 
        op.type === 'invoke_host_function' && 
        op.contract_id === contracts.nftMarketplace
      );
    } catch (error) {
      console.error('Error checking transaction:', error);
      return false;
    }
  },

  formatTransaction: (transaction) => {
    const operations = transaction.operations || [];
    const mainOperation = operations[0] || {};
    
    return {
      id: transaction.id,
      hash: transaction.hash,
      createdAt: transaction.created_at,
      status: transaction.successful ? 'success' : 'failed',
      type: get().getTransactionType(mainOperation),
      amount: get().getTransactionAmount(mainOperation),
      fee: transaction.fee_paid,
      memo: transaction.memo || '',
      operations: operations,
      ledger: transaction.ledger_attr,
      sourceAccount: transaction.source_account
    };
  },

  getTransactionType: (operation) => {
    switch (operation.type) {
      case 'payment':
        return 'Payment';
      case 'invoke_host_function':
        return 'Contract Call';
      case 'create_account':
        return 'Account Creation';
      case 'manage_data':
        return 'Data Management';
      case 'set_options':
        return 'Account Settings';
      case 'change_trust':
        return 'Trust Line';
      case 'allow_trust':
        return 'Allow Trust';
      case 'account_merge':
        return 'Account Merge';
      case 'inflation':
        return 'Inflation';
      case 'manage_buy_offer':
        return 'Buy Offer';
      case 'manage_sell_offer':
        return 'Sell Offer';
      case 'create_passive_sell_offer':
        return 'Passive Sell Offer';
      case 'path_payment_strict_receive':
        return 'Path Payment';
      case 'path_payment_strict_send':
        return 'Path Payment';
      default:
        return 'Unknown';
    }
  },

  getTransactionAmount: (operation) => {
    if (operation.type === 'payment' && operation.amount) {
      return {
        value: operation.amount,
        asset: operation.asset_code || 'XLM'
      };
    }
    return null;
  },
  
  // Advanced Parameters Management
  updateAdvancedParameters: (newParameters) => {
    set(state => ({
      advancedParameters: { ...state.advancedParameters, ...newParameters }
    }));
  },
  
  resetAdvancedParameters: () => {
    const defaultParameters = {
      // Generation parameters
      temperature: 0.8,
      topK: 50,
      topP: 0.9,
      guidanceScale: 7.5,
      numInferenceSteps: 50,
      seed: -1,
      
      // Image-specific parameters
      width: 512,
      height: 512,
      quality: 0.9,
      sharpness: 1.0,
      contrast: 1.0,
      saturation: 1.0,
      
      // Style parameters
      strength: 0.8,
      noiseLevel: 0.1,
      detailEnhancement: 0.5,
      colorHarmony: 0.7,
      compositionBalance: 0.6,
      
      // Performance parameters
      batchSize: 1,
      enableAttentionSlicing: true,
      enableCpuOffload: false,
      enableModelCaching: true,
      maxGenerationTime: 120,
      
      // Advanced AI parameters
      negativePrompt: '',
      promptWeighting: true,
      crossAttentionControl: 0.5,
      selfAttentionControl: 0.3,
      temporalConsistency: 0.8,
      
      // Model-specific parameters
      modelVersion: 'latest',
      customModelPath: '',
      loraStrength: 0.7,
      controlNetStrength: 0.8,
      embeddingStrength: 0.6
    };
    
    set({ advancedParameters: defaultParameters });
  },
  
  applyParameterPreset: (presetId) => {
    const { parameterPresets, advancedParameters } = get();
    const preset = parameterPresets.find(p => p.id === presetId);
    
    if (preset) {
      const updatedParameters = { ...advancedParameters, ...preset.parameters };
      set({ advancedParameters: updatedParameters });
      return updatedParameters;
    }
    
    return null;
  },
  
  exportAdvancedParameters: () => {
    const { advancedParameters } = get();
    return JSON.stringify(advancedParameters, null, 2);
  },
  
  importAdvancedParameters: (parametersJson) => {
    try {
      const imported = JSON.parse(parametersJson);
      const { advancedParameters } = get();
      const updatedParameters = { ...advancedParameters, ...imported };
      set({ advancedParameters: updatedParameters });
      return updatedParameters;
    } catch (error) {
      console.error('Failed to import advanced parameters:', error);
      throw error;
    }
  },
  
  validateAdvancedParameters: (parameters) => {
    const validationRules = {
      temperature: { min: 0.1, max: 2.0, type: 'number' },
      topK: { min: 1, max: 100, type: 'number' },
      topP: { min: 0.1, max: 1.0, type: 'number' },
      guidanceScale: { min: 1.0, max: 20.0, type: 'number' },
      numInferenceSteps: { min: 10, max: 150, type: 'number' },
      seed: { type: 'number' },
      width: { min: 256, max: 1024, type: 'number' },
      height: { min: 256, max: 1024, type: 'number' },
      quality: { min: 0.1, max: 1.0, type: 'number' },
      sharpness: { min: 0.0, max: 2.0, type: 'number' },
      contrast: { min: 0.0, max: 2.0, type: 'number' },
      saturation: { min: 0.0, max: 2.0, type: 'number' },
      strength: { min: 0.0, max: 1.0, type: 'number' },
      noiseLevel: { min: 0.0, max: 1.0, type: 'number' },
      detailEnhancement: { min: 0.0, max: 1.0, type: 'number' },
      colorHarmony: { min: 0.0, max: 1.0, type: 'number' },
      compositionBalance: { min: 0.0, max: 1.0, type: 'number' },
      batchSize: { min: 1, max: 4, type: 'number' },
      maxGenerationTime: { min: 30, max: 300, type: 'number' },
      crossAttentionControl: { min: 0.0, max: 1.0, type: 'number' },
      selfAttentionControl: { min: 0.0, max: 1.0, type: 'number' },
      temporalConsistency: { min: 0.0, max: 1.0, type: 'number' },
      loraStrength: { min: 0.0, max: 1.0, type: 'number' },
      controlNetStrength: { min: 0.0, max: 1.0, type: 'number' },
      embeddingStrength: { min: 0.0, max: 1.0, type: 'number' }
    };
    
    const errors = [];
    
    Object.keys(parameters).forEach(key => {
      const value = parameters[key];
      const rule = validationRules[key];
      
      if (rule) {
        if (rule.type === 'number' && (typeof value !== 'number' || isNaN(value))) {
          errors.push(`${key} must be a valid number`);
        } else if (rule.type === 'number' && typeof value === 'number') {
          if (rule.min !== undefined && value < rule.min) {
            errors.push(`${key} must be at least ${rule.min}`);
          }
          if (rule.max !== undefined && value > rule.max) {
            errors.push(`${key} must be at most ${rule.max}`);
          }
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
}));

export { useMuseStore };
