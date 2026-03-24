import React, { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Minimize2, 
  Maximize2, 
  X, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  List
} from 'lucide-react';
import { useTransactionNotificationStore } from '../../store/transactionNotificationStore';
import TransactionStatusIndicator from './TransactionStatusIndicator';

const TransactionMonitor = ({ 
  position = 'bottom-right',
  maxVisible = 3,
  showMinimizeButton = true 
}) => {
  const { 
    getPendingTransactions,
    getTransactionsByStatus,
    clearTransaction,
    clearCompletedTransactions,
    STATUS
  } = useTransactionNotificationStore();
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const pendingTransactions = getPendingTransactions();
  const confirmedTransactions = getTransactionsByStatus(STATUS.CONFIRMED);
  const failedTransactions = getTransactionsByStatus(STATUS.FAILED);
  const timeoutTransactions = getTransactionsByStatus(STATUS.TIMEOUT);

  const allTransactions = [
    ...pendingTransactions,
    ...timeoutTransactions,
    ...failedTransactions.slice(0, 5), // Show only last 5 failed
    ...confirmedTransactions.slice(0, 3) // Show only last 3 confirmed
  ];

  const displayTransactions = showAll ? allTransactions : allTransactions.slice(0, maxVisible);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case STATUS.PENDING:
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case STATUS.CONFIRMED:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case STATUS.FAILED:
        return <XCircle className="w-4 h-4 text-red-500" />;
      case STATUS.TIMEOUT:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const openExplorer = (hash) => {
    const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${hash}`;
    window.open(explorerUrl, '_blank');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  const hasActiveTransactions = pendingTransactions.length > 0 || timeoutTransactions.length > 0;

  if (!hasActiveTransactions && confirmedTransactions.length === 0 && failedTransactions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed ${getPositionClasses()} z-40`}
    >
      <motion.div
        layout
        className={`
          bg-white rounded-lg shadow-xl border border-gray-200
          ${isMinimized ? 'w-auto' : 'w-80'}
          overflow-hidden
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              Transactions
            </span>
            {pendingTransactions.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                {pendingTransactions.length} pending
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {showMinimizeButton && (
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Transaction List */}
              <div className="max-h-96 overflow-y-auto">
                {displayTransactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        <span className="text-sm font-medium text-gray-900">
                          {transaction.type}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <TransactionStatusIndicator 
                          transactionId={transaction.id} 
                          size="sm" 
                          showText={false}
                        />
                        
                        <button
                          onClick={() => clearTransaction(transaction.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>
                          {transaction.hash ? 
                            `${transaction.hash.slice(0, 10)}...${transaction.hash.slice(-8)}` : 
                            'Processing...'
                          }
                        </span>
                        <span>{formatTime(transaction.createdAt)}</span>
                      </div>
                      
                      {transaction.retryCount > 0 && (
                        <div className="text-yellow-600">
                          Retry {transaction.retryCount}/{transaction.maxRetries}
                        </div>
                      )}
                    </div>

                    {transaction.hash && (
                      <div className="mt-2">
                        <button
                          onClick={() => openExplorer(transaction.hash)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View on Explorer
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Footer Actions */}
              <div className="p-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {allTransactions.length} total transactions
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {allTransactions.length > maxVisible && (
                      <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {showAll ? 'Show Less' : `Show ${allTransactions.length - maxVisible} More`}
                      </button>
                    )}
                    
                    <button
                      onClick={clearCompletedTransactions}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear Completed
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default TransactionMonitor;
