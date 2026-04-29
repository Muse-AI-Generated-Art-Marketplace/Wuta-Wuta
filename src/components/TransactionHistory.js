import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  ArrowUpRight, 
  ExternalLink,
  RefreshCw,
  Coins,
  Search,
  Calendar,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useMuseStore } from '../store/museStore';
import { useWalletStore } from '../store/walletStore';

import CopyButton from './CopyButton';

const TransactionHistory = () => {
  const { fetchWutaWutaTransactions } = useMuseStore();
  const { address } = useWalletStore();
  
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadTransactions = useCallback(async () => {
    if (!address) {
      setError('Please connect your wallet to view transaction history');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use store function to fetch transactions
      const transactionData = await fetchWutaWutaTransactions(address, 20, page);
      
      setTransactions(transactionData);
      setTotalPages(1); // Simplified for now

    } catch (err) {
      setError(err.message);
      toast.error('Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  }, [address, fetchWutaWutaTransactions, page]);

  useEffect(() => {
    if (address) {
      loadTransactions();
    }
  }, [address, loadTransactions]);

  const applyFilters = (transactions) => {
    let filtered = transactions;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(tx => tx.status === filter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    // Apply date range filter
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(tx => new Date(tx.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the whole end day
      filtered = filtered.filter(tx => new Date(tx.createdAt) <= end);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.memo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const exportToCSV = () => {
    const filtered = applyFilters(transactions);
    if (filtered.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['ID', 'Hash', 'Type', 'Amount', 'Asset', 'Status', 'Date', 'Fee', 'Memo'];
    const csvContent = [
      headers.join(','),
      ...filtered.map(tx => [
        tx.id,
        tx.hash,
        tx.type,
        tx.amount.value,
        tx.amount.asset,
        tx.status,
        tx.createdAt,
        tx.fee,
        `"${tx.memo.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `wuta_wuta_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Transaction history exported to CSV');
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'Payment':
        return <ArrowUpRight className="w-4 h-4" />;
      case 'Contract Call':
        return <Activity className="w-4 h-4" />;
      case 'Account Creation':
        return <Clock className="w-4 h-4" />;
      case 'Mint':
        return <Coins className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100/50 backdrop-blur-sm';
      case 'failed':
        return 'text-red-600 bg-red-100/50 backdrop-blur-sm';
      default:
        return 'text-gray-600 bg-gray-100/50 backdrop-blur-sm';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Payment':
        return 'text-blue-600 bg-blue-100/50';
      case 'Contract Call':
        return 'text-purple-600 bg-purple-100/50';
      case 'Account Creation':
        return 'text-green-600 bg-green-100/50';
      case 'Mint':
        return 'text-amber-600 bg-amber-100/50';
      default:
        return 'text-gray-600 bg-gray-100/50';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    if (!amount) return '-';
    return `${parseFloat(amount.value).toFixed(7)} ${amount.asset}`;
  };

  const openExplorer = (hash) => {
    const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${hash}`;
    window.open(explorerUrl, '_blank');
  };

  const filteredTransactions = applyFilters(transactions);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-2">
            Transaction History
          </h1>
          <p className="text-gray-600 font-medium">Manage and audit your blockchain activity on Wuta-Wuta</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all font-semibold"
          >
            <ArrowUpRight className="w-4 h-4 mr-2 rotate-90" />
            Export CSV
          </button>
          <button
            onClick={loadTransactions}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 disabled:opacity-50 transition-all font-semibold"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Hash, type, memo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none text-sm"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-sm appearance-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="Payment">Payment</option>
              <option value="Contract Call">Contract Call</option>
              <option value="Account Creation">Account Creation</option>
              <option value="Mint">Mint</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">From</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">To</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Status:</span>
          {['all', 'success', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                filter === status 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
              <p className="text-sm text-gray-600">Total Transactions</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <div className="flex items-center">
            <ArrowUpRight className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTransactions.filter(tx => tx.status === 'success').length}
              </p>
              <p className="text-sm text-gray-600">Successful</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <div className="flex items-center">
            <Coins className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTransactions.reduce((sum, tx) => sum + (parseFloat(tx.fee) || 0), 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Total Fees (XLM)</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{page}</p>
              <p className="text-sm text-gray-600">Current Page</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600">
              {searchTerm || filter !== 'all' ? 'Try adjusting your filters' : 'No transactions yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((tx, index) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`p-1 rounded-full ${getTypeColor(tx.type)} mr-2`}>
                          {getTransactionIcon(tx.type)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{tx.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-900 font-mono">
                          {tx.hash.slice(0, 8)}...{tx.hash.slice(-8)}
                        </div>
                        <CopyButton text={tx.hash} />
                      </div>
                      {tx.memo && (
                        <div className="text-xs text-gray-500 mt-1">Memo: {tx.memo}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatAmount(tx.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Fee: {parseFloat(tx.fee).toFixed(2)} XLM
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => openExplorer(tx.hash)}
                        className="text-purple-600 hover:text-purple-900 flex items-center"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Explorer
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default TransactionHistory;
