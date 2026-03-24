
import React, { useEffect, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import {
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useTransactionNotificationStore } from '../../store/transactionNotificationStore';

const ToastNotification = ({ notification, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (notification.autoHide && notification.duration) {
      const interval = 50; // Update progress every 50ms
      const decrement = (100 * interval) / notification.duration;

      const timer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - decrement;
          if (newProgress <= 0) {
            setIsVisible(false);
            setTimeout(() => onDismiss(notification.id), 300);
            return 0;
          }
          return newProgress;
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [notification.autoHide, notification.duration, onDismiss, notification.id]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={`
        relative flex items-start p-4 rounded-lg border shadow-lg
        min-w-[320px] max-w-[400px]
        ${getBgColor()}
      `}
    >
      {/* Progress bar */}
      {notification.autoHide && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>
      )}

      <div className="flex items-start flex-1">
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${getTextColor()}`}>
            {notification.title}
          </h4>
          <p className={`text-sm mt-1 ${getTextColor()} opacity-90`}>
            {notification.message}
          </p>

          {notification.timestamp && (
            <p className="text-xs text-gray-500 mt-2">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onDismiss(notification.id), 300);
        }}
        className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

const TransactionToast = ({ notification, onDismiss }) => {
  const {
    getTransaction,
    retryTransaction,
    STATUS
  } = useTransactionNotificationStore();

  const transaction = getTransaction(notification.transactionId);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!transaction) return;

    setIsRetrying(true);
    try {
      await retryTransaction(notification.transactionId);
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const openExplorer = () => {
    if (!transaction?.hash) return;
    const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${transaction.hash}`;
    window.open(explorerUrl, '_blank');
  };

  const getStatusIcon = () => {
    switch (transaction?.status) {
      case STATUS.CONFIRMED:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case STATUS.FAILED:
        return <XCircle className="w-5 h-5 text-red-500" />;
      case STATUS.TIMEOUT:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className="relative flex items-start p-4 rounded-lg border bg-white shadow-lg min-w-[380px] max-w-[450px]"
    >
      <div className="flex items-start flex-1">
        <div className="flex-shrink-0 mr-3">
          {getStatusIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {notification.message}
          </p>

          {transaction && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Type: {transaction.type}
                </span>
                <span className="text-gray-500">
                  {transaction.hash ? `${transaction.hash.slice(0, 8)}...${transaction.hash.slice(-8)}` : 'Processing...'}
                </span>
              </div>

              {transaction.status === STATUS.FAILED && transaction.retryCount < transaction.maxRetries && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                  Retry ({transaction.retryCount}/{transaction.maxRetries})
                </button>
              )}

              {transaction.hash && (
                <button
                  onClick={openExplorer}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View on Explorer
                </button>
              )}
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>

      <button
        onClick={() => onDismiss(notification.id)}
        className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

const NotificationContainer = () => {
  const {
    notifications,
    dismissNotification,
    clearAllNotifications
  } = useTransactionNotificationStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Clear all button for multiple notifications */}
      {notifications.length > 3 && (
        <div className="flex justify-end">
          <button
            onClick={clearAllNotifications}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
          >
            Clear All
          </button>
        </div>
      )}

      <AnimatePresence>
        {notifications.map((notification) => (
          <div key={notification.id}>
            {notification.transactionId ? (
              <TransactionToast
                notification={notification}
                onDismiss={dismissNotification}
              />
            ) : (
              <ToastNotification
                notification={notification}
                onDismiss={dismissNotification}
              />
            )}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export { ToastNotification, TransactionToast, NotificationContainer };
