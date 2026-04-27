import { create } from 'zustand';

export interface Activity {
  id: string;
  /** Which blockchain this event came from. */
  chain: 'EVM' | 'STELLAR';
  type: 'MINT' | 'TRADE' | 'BID' | 'LIST' | 'OTHER';
  from: string;
  to?: string;
  tokenId?: string;
  /** Sale/bid price in the chain's native asset (XLM for Stellar, ETH for EVM). */
  price?: number;
  timestamp: number;
  /** Raw event type string from the chain e.g. 'ARTWORK_SOLD', 'Transfer'. */
  eventType?: string;
}

export interface PriceUpdate {
  tokenId: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  timestamp: number;
  currency: 'XLM' | 'ETH';
}

export interface NewArtwork {
  id: string;
  title: string;
  creator: string;
  imageUrl: string;
  initialPrice: number;
  timestamp: number;
  currency: 'XLM' | 'ETH';
}

export interface BidUpdate {
  artworkId: string;
  bidId: string;
  bidder: string;
  amount: number;
  timestamp: number;
  isHighest: boolean;
  currency: 'XLM' | 'ETH';
}

interface ActivityState {
  activities: Activity[];
  priceUpdates: PriceUpdate[];
  newArtworks: NewArtwork[];
  bidUpdates: BidUpdate[];
  
  // Actions
  addActivity: (activity: Activity) => void;
  addPriceUpdate: (priceUpdate: PriceUpdate) => void;
  addNewArtwork: (artwork: NewArtwork) => void;
  addBidUpdate: (bidUpdate: BidUpdate) => void;
  clearActivities: () => void;
  clearPriceUpdates: () => void;
  clearNewArtworks: () => void;
  clearBidUpdates: () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  priceUpdates: [],
  newArtworks: [],
  bidUpdates: [],

  addActivity: (activity) =>
    set((state) => ({
      // Deduplicate by id — EVM and Stellar can both fire for the same tx
      activities: state.activities.some((a) => a.id === activity.id)
        ? state.activities
        : [activity, ...state.activities].slice(0, 50),
    })),

  addPriceUpdate: (priceUpdate) =>
    set((state) => ({
      priceUpdates: [priceUpdate, ...state.priceUpdates].slice(0, 100),
    })),

  addNewArtwork: (artwork) =>
    set((state) => ({
      newArtworks: [artwork, ...state.newArtworks].slice(0, 50),
    })),

  addBidUpdate: (bidUpdate) =>
    set((state) => ({
      bidUpdates: [bidUpdate, ...state.bidUpdates].slice(0, 100),
    })),

  clearActivities: () => set({ activities: [] }),
  clearPriceUpdates: () => set({ priceUpdates: [] }),
  clearNewArtworks: () => set({ newArtworks: [] }),
  clearBidUpdates: () => set({ bidUpdates: [] }),
}));