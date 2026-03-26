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

interface ActivityState {
  activities: Activity[];
  addActivity: (activity: Activity) => void;
  clearActivities: () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],

  addActivity: (activity) =>
    set((state) => ({
      // Deduplicate by id — EVM and Stellar can both fire for the same tx
      activities: state.activities.some((a) => a.id === activity.id)
        ? state.activities
        : [activity, ...state.activities].slice(0, 50),
    })),

  clearActivities: () => set({ activities: [] }),
}));