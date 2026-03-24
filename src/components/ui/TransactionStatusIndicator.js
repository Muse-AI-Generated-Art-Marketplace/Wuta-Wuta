import React from 'react';

import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useTransactionNotificationStore } from '../../store/transactionNotificationStore';

const TransactionStatusIndicator = ({ 
  transactionId, 
  size = 'sm',
  showText = true,
  showActions = false 
}) => {
  const { 
    getTransaction, 
    retryTransaction,
    STATUS 
  } = useTransactionNotificationStore();
  
  const transaction = getTransaction(transactionId);
  const [isRetrying, setIsRetrying] = React.useState(false);

  if (!transaction) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await retryTransaction(transactionId);
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const openExplorer = () => {
    if (!transaction.hash) return;
    const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${transaction.hash}`;
    window.open(explorerUrl, '_blank');
  };

  const getStatusConfig = () => {
    switch (transaction.status) {
      case STATUS.PENDING:
        return {
          icon: <RefreshCw className="animate-spin" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200',
          text: 'Pending'
        };
      case STATUS.CONFIRMED:
        return {
          icon: <CheckCircle />,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          text: 'Confirmed'
        };
      case STATUS.FAILED:
        return {
          icon: <XCircle />,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          text: 'Failed'
        };
      case STATUS.TIMEOUT:
        return {
          icon: <AlertTriangle />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200',
          text: 'Timeout'
        };
      default:
        return {
          icon: <Clock />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          text: 'Unknown'
        };
    }
  };

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3'
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4'
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'w-5 h-5'
    }
  };

  const statusConfig = getStatusConfig();
  const sizeConfig = sizeClasses[size];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-2 rounded-full border
        ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.color}
        ${sizeConfig.container}
      `}
    >
      <span className={sizeConfig.icon}>
        {statusConfig.icon}
      </span>
      
      {showText && (
        <span className="font-medium">
          {statusConfig.text}
        </span>
      )}

      {showActions && (
        <div className="flex items-center gap-1 ml-2">
          {transaction.status === STATUS.FAILED && 
           transaction.retryCount < transaction.maxRetries && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="p-1 rounded hover:bg-black hover:bg-opacity-10 disabled:opacity-50"
              title={`Retry transaction (${transaction.retryCount}/${transaction.maxRetries})`}
            >
              <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          {transaction.hash && (
            <button
              onClick={openExplorer}
              className="p-1 rounded hover:bg-black hover:bg-opacity-10"
              title="View on explorer"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default TransactionStatusIndicator;
