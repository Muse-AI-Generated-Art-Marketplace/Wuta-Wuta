import { create } from 'zustand';
import * as freighterApi from '@stellar/freighter-api';

// Helper to get functions regardless of import structure
const getFreighterMethod = (methodName) => {
  // Check main import
  if (freighterApi[methodName]) return freighterApi[methodName];
  // Check default export if exists
  if (freighterApi.default && freighterApi.default[methodName]) return freighterApi.default[methodName];
  // Check global object
  if (window.freighterApi && window.freighterApi[methodName]) return window.freighterApi[methodName];

  // Variation check: getPublicKey vs getAddress
  if (methodName === 'getPublicKey') {
    return getFreighterMethod('getAddress');
  }

  return null;
};

const useWalletStore = create((set, get) => ({
  // State
  isConnecting: false,
  isConnected: false,
  address: null,
  network: null,
  error: null,
  isLoading: false,

  // Actions
  checkConnection: async () => {
    try {
      const isConnected = getFreighterMethod('isConnected');
      const getPublicKey = getFreighterMethod('getPublicKey');
      const getNetwork = getFreighterMethod('getNetwork');

      if (isConnected && await isConnected()) {
        let publicKey = await getPublicKey();
        const networkValue = await getNetwork();

        // Handle object return from newer Freighter versions
        if (publicKey && typeof publicKey === 'object') {
          publicKey = publicKey.address || publicKey.publicKey || publicKey.id || '';
        }

        // Handle network object return
        let networkName = networkValue;
        if (networkValue && typeof networkValue === 'object') {
          networkName = networkValue.network || networkValue.networkPassphrase || 'Unknown';
        }

        if (publicKey) {
          set({
            address: String(publicKey),
            network: String(networkName),
            isConnected: true,
            error: null
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Check connection error:', error);
      return false;
    }
  },

  connectWallet: async () => {
    try {
      set({ isConnecting: true, error: null });

      const isConnected = getFreighterMethod('isConnected');
      const setAllowed = getFreighterMethod('setAllowed') || getFreighterMethod('requestAccess');
      const getPublicKey = getFreighterMethod('getPublicKey');
      const getNetwork = getFreighterMethod('getNetwork');

      if (!isConnected || !await isConnected()) {
        throw new Error('Freighter wallet not found. Please install the extension.');
      }

      // Explicitly request access/permission first
      if (setAllowed) {
        const result = await setAllowed();
        if (result && result.error) {
          throw new Error(result.error);
        }
      }

      let publicKey = await getPublicKey();
      const networkValue = await getNetwork();

      // Handle object return from newer Freighter versions
      if (publicKey && typeof publicKey === 'object') {
        publicKey = publicKey.address || publicKey.publicKey || publicKey.id || '';
      }

      // Handle network object return
      let networkName = networkValue;
      if (networkValue && typeof networkValue === 'object') {
        networkName = networkValue.network || networkValue.networkPassphrase || 'Unknown';
      }

      if (!publicKey) {
        throw new Error('Failed to retrieve public key from Freighter.');
      }

      set({
        isConnecting: false,
        isConnected: true,
        address: String(publicKey),
        network: String(networkName),
        error: null,
      });

      // Save connection preference
      localStorage.setItem('walletConnected', 'true');

    } catch (error) {
      console.error('Failed to connect wallet:', error);
      set({
        isConnecting: false,
        error: error.message
      });
    }
  },

  disconnectWallet: () => {
    set({
      isConnecting: false,
      isConnected: false,
      address: null,
      network: null,
      error: null,
    });
    localStorage.removeItem('walletConnected');
  },

  updateAccount: (newAddress) => {
    set({ address: newAddress });
  },

  updateNetwork: (newNetwork) => {
    set({ network: newNetwork });
  },

  clearError: () => set({ error: null }),

  signMessage: async (message) => {
    if (!get().isConnected || !get().address) {
      throw new Error('Wallet not connected');
    }

    const signMessage = getFreighterMethod('signMessage');
    if (!signMessage) {
      throw new Error('Freighter signMessage is unavailable');
    }

    const address = get().address;
    const attempts = [
      () => signMessage(message, { address }),
      () => signMessage(message, address),
      () => signMessage(message),
    ];

    let lastError;

    for (const attempt of attempts) {
      try {
        const result = await attempt();

        if (typeof result === 'string') {
          return result;
        }

        if (result?.signature) {
          return result.signature;
        }

        if (result?.signedMessage) {
          return result.signedMessage;
        }

        if (result?.data?.signature) {
          return result.data.signature;
        }

        if (!result?.error) {
          return result;
        }

        lastError = new Error(result.error);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Failed to sign message');
  },
}));

export { useWalletStore };
