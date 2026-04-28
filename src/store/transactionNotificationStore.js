import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useTransactionNotificationStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    transactions: new Map(), // Map<transactionId, transactionData>
    notifications: [], // Array of notification objects
    isLoading: false,
    error: null,

    // Transaction status enum
    STATUS: {
      PENDING: 'pending',
      CONFIRMED: 'confirmed',
      FAILED: 'failed',
      TIMEOUT: 'timeout'
    },

    // Notification types
    NOTIFICATION_TYPES: {
      INFO: 'info',
      SUCCESS: 'success',
      WARNING: 'warning',
      ERROR: 'error'
    },

    // Actions
    addTransaction: (transactionData) => {
      const { transactions } = get();
      const transaction = {
        id: transactionData.id,
        hash: transactionData.hash,
        type: transactionData.type || 'Contract Call',
        status: get().STATUS.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        details: transactionData.details || {},
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 60000, // 60 seconds timeout
        ...transactionData
      };

      transactions.set(transaction.id, transaction);

      set({
        transactions: new Map(transactions),
        notifications: [
          ...get().notifications,
          {
            id: `tx-${transaction.id}-${Date.now()}`,
            type: get().NOTIFICATION_TYPES.INFO,
            title: 'Transaction Submitted',
            message: `Your ${transaction.type} transaction has been submitted to the network.`,
            timestamp: new Date().toISOString(),
            transactionId: transaction.id,
            autoHide: false // Keep visible until confirmed/failed
          }
        ]
      });

      // Start monitoring the transaction
      get().monitorTransaction(transaction.id);

      return transaction.id;
    },

    addNotification: (notificationData) => {
      const { NOTIFICATION_TYPES } = get();
      const notification = {
        id: `notification-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        type: notificationData.type || NOTIFICATION_TYPES.INFO,
        title: notificationData.title || 'Notification',
        message: notificationData.message || '',
        timestamp: notificationData.timestamp || new Date().toISOString(),
        autoHide: notificationData.autoHide !== undefined ? notificationData.autoHide : true,
        duration: notificationData.duration || 5000,
        transactionId: notificationData.transactionId,
        ...notificationData
      };

      set({
        notifications: [...get().notifications, notification]
      });

      return notification.id;
    },

    addSuccess: (title, message, options = {}) => {
      const { NOTIFICATION_TYPES } = get();
      return get().addNotification({
        type: NOTIFICATION_TYPES.SUCCESS,
        title,
        message,
        ...options
      });
    },

    addError: (title, message, options = {}) => {
      const { NOTIFICATION_TYPES } = get();
      return get().addNotification({
        type: NOTIFICATION_TYPES.ERROR,
        title,
        message,
        ...options
      });
    },

    addWarning: (title, message, options = {}) => {
      const { NOTIFICATION_TYPES } = get();
      return get().addNotification({
        type: NOTIFICATION_TYPES.WARNING,
        title,
        message,
        ...options
      });
    },

    addInfo: (title, message, options = {}) => {
      const { NOTIFICATION_TYPES } = get();
      return get().addNotification({
        type: NOTIFICATION_TYPES.INFO,
        title,
        message,
        ...options
      });
    },

    updateTransactionStatus: (transactionId, newStatus, details = {}) => {
      const { transactions, STATUS, NOTIFICATION_TYPES } = get();
      const transaction = transactions.get(transactionId);

      if (!transaction) return;

      const updatedTransaction = {
        ...transaction,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        details: { ...transaction.details, ...details }
      };

      transactions.set(transactionId, updatedTransaction);

      // Add notification for status change
      let notification = {
        id: `tx-${transactionId}-${newStatus}-${Date.now()}`,
        transactionId,
        timestamp: new Date().toISOString(),
        autoHide: true,
        duration: 5000
      };

      switch (newStatus) {
        case STATUS.CONFIRMED:
          notification = {
            ...notification,
            type: NOTIFICATION_TYPES.SUCCESS,
            title: 'Transaction Confirmed',
            message: `Your ${transaction.type} transaction has been successfully confirmed.`
          };
          break;

        case STATUS.FAILED:
          notification = {
            ...notification,
            type: NOTIFICATION_TYPES.ERROR,
            title: 'Transaction Failed',
            message: `Your ${transaction.type} transaction failed. ${details.error || 'Please try again.'}`,
            autoHide: false
          };
          break;

        case STATUS.TIMEOUT:
          notification = {
            ...notification,
            type: NOTIFICATION_TYPES.WARNING,
            title: 'Transaction Timeout',
            message: `Your ${transaction.type} transaction is taking longer than expected. It may still be processed.`,
            autoHide: false
          };
          break;
      }

      set({
        transactions: new Map(transactions),
        notifications: [...get().notifications, notification]
      });
    },

    monitorTransaction: async (transactionId) => {
      const { transactions, STATUS } = get();
      const transaction = transactions.get(transactionId);

      if (!transaction) return;

      try {
        // Start timeout timer
        const timeoutId = setTimeout(() => {
          const currentTx = get().transactions.get(transactionId);
          if (currentTx && currentTx.status === STATUS.PENDING) {
            get().updateTransactionStatus(transactionId, STATUS.TIMEOUT);
          }
        }, transaction.timeoutMs);

        // Poll for transaction status
        const pollInterval = setInterval(async () => {
          try {
            const currentTx = get().transactions.get(transactionId);
            if (!currentTx || currentTx.status !== STATUS.PENDING) {
              clearInterval(pollInterval);
              clearTimeout(timeoutId);
              return;
            }

            // Check transaction status on blockchain
            const status = await get().checkTransactionStatus(transactionId);

            if (status === STATUS.CONFIRMED) {
              get().updateTransactionStatus(transactionId, STATUS.CONFIRMED);
              clearInterval(pollInterval);
              clearTimeout(timeoutId);
            } else if (status === STATUS.FAILED) {
              get().updateTransactionStatus(transactionId, STATUS.FAILED);
              clearInterval(pollInterval);
              clearTimeout(timeoutId);
            }
          } catch (error) {
            console.error('Error polling transaction status:', error);
          }
        }, 3000); // Poll every 3 seconds

      } catch (error) {
        console.error('Error monitoring transaction:', error);
        get().updateTransactionStatus(transactionId, STATUS.FAILED, { error: error.message });
      }
    },

    checkTransactionStatus: async (transactionId) => {
      const { transactions } = get();
      const transaction = transactions.get(transactionId);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // If hash is not yet available, it's still in initial submission phase
      if (!transaction.hash) {
        return get().STATUS.PENDING;
      }

      try {
        // Use the existing museStore to check transaction status
        const { useMuseStore } = await import('./museStore');
        const museStore = useMuseStore.getState();

        // Prefer Soroban RPC for status checking if available
        if (museStore.stellarClient && typeof museStore.stellarClient.getTransaction === 'function') {
          try {
            const sorobanResult = await museStore.stellarClient.getTransaction(transaction.hash);

            switch (sorobanResult.status) {
              case 'SUCCESS':
                return get().STATUS.CONFIRMED;
              case 'FAILED':
                return get().STATUS.FAILED;
              case 'NOT_FOUND':
                // Check Horizon as fallback or continue pending
                break;
              default:
                return get().STATUS.PENDING;
            }
          } catch (sorobanError) {
            console.warn('Soroban RPC check failed, falling back to Horizon:', sorobanError);
          }
        }

        // Fallback or secondary check via Horizon
        if (!museStore.horizonServer) {
          return get().STATUS.PENDING; // Keep pending if no server to check
        }

        const txResult = await museStore.horizonServer
          .transactions()
          .transaction(transaction.hash)
          .call();

        return txResult.successful ?
          get().STATUS.CONFIRMED :
          get().STATUS.FAILED;

      } catch (error) {
        if (error.response && (error.response.status === 404 || error.response.status === 400)) {
          // Transaction not found yet on Horizon/RPC, still pending
          return get().STATUS.PENDING;
        }

        // For Soroban "NOT_FOUND" usually means it hasn't landed yet
        if (error.message && error.message.includes('not found')) {
          return get().STATUS.PENDING;
        }

        throw error;
      }
    },

    retryTransaction: async (transactionId) => {
      const { transactions, STATUS } = get();
      const transaction = transactions.get(transactionId);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.retryCount >= transaction.maxRetries) {
        throw new Error('Maximum retry attempts reached');
      }

      // Update retry count
      const updatedTransaction = {
        ...transaction,
        retryCount: transaction.retryCount + 1,
        status: STATUS.PENDING,
        updatedAt: new Date().toISOString()
      };

      transactions.set(transactionId, updatedTransaction);

      set({
        transactions: new Map(transactions),
        notifications: [
          ...get().notifications,
          {
            id: `tx-${transactionId}-retry-${Date.now()}`,
            type: get().NOTIFICATION_TYPES.INFO,
            title: 'Retrying Transaction',
            message: `Attempting to retry your ${transaction.type} transaction (Attempt ${updatedTransaction.retryCount}/${transaction.maxRetries}).`,
            timestamp: new Date().toISOString(),
            transactionId,
            autoHide: true,
            duration: 3000
          }
        ]
      });

      // Restart monitoring
      get().monitorTransaction(transactionId);
    },

    dismissNotification: (notificationId) => {
      const { notifications } = get();
      const filtered = notifications.filter(n => n.id !== notificationId);
      set({ notifications: filtered });
    },

    clearAllNotifications: () => {
      set({ notifications: [] });
    },

    getTransaction: (transactionId) => {
      const { transactions } = get();
      return transactions.get(transactionId);
    },

    getPendingTransactions: () => {
      const { transactions, STATUS } = get();
      return Array.from(transactions.values()).filter(tx => tx.status === STATUS.PENDING);
    },

    getTransactionsByStatus: (status) => {
      const { transactions } = get();
      return Array.from(transactions.values()).filter(tx => tx.status === status);
    },

    clearTransaction: (transactionId) => {
      const { transactions } = get();
      transactions.delete(transactionId);
      set({ transactions: new Map(transactions) });
    },

    clearCompletedTransactions: () => {
      const { transactions, STATUS } = get();
      const activeTransactions = new Map();

      transactions.forEach((tx, id) => {
        if (tx.status === STATUS.PENDING) {
          activeTransactions.set(id, tx);
        }
      });

      set({ transactions: activeTransactions });
    }
  }))
);

export { useTransactionNotificationStore };
