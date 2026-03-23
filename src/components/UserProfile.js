import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Palette, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Image,
  Activity,
  Award,
  ExternalLink,
  Grid3X3,
  List
} from 'lucide-react';
import { useMuseStore } from '../store/museStore';
import { useWalletStore } from '../store/walletStore';
import { useUserProfileStore } from '../store/userProfileStore';
import ArtworkGrid from './ArtworkGrid';
import CopyButton from './CopyButton';

const UserProfile = () => {
  const { listings } = useMuseStore();
  const { address, isConnected } = useWalletStore();
  const { 
    profile, 
    collection, 
    loadUserCollection, 
    loadTradingHistory,
    updateCollectionFilters,
    updateCollectionSort,
    updateCollectionView,
    getFilteredCollection,
    getFilteredTradingHistory
  } = useUserProfileStore();

  useEffect(() => {
    if (isConnected && address) {
      // Load user collection and trading history
      loadUserCollection(address);
      loadTradingHistory(address);
    }
  }, [isConnected, address, loadUserCollection, loadTradingHistory]);

  const filteredArtworks = getFilteredCollection();
  const filteredTransactions = getFilteredTradingHistory();

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'sale': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'purchase': return <DollarSign className="w-4 h-4 text-blue-500" />;
      case 'listing': return <Activity className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center bg-white dark:bg-slate-800 p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 max-w-md w-full">
          <div className="w-20 h-20 bg-gray-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">Connect Your Wallet</h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-8">Connect your wallet to view your profile, manage your collection, and track your trading history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800/80 rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/10 p-6 sm:p-8 relative overflow-hidden backdrop-blur-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100/50 to-blue-100/50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-5 sm:space-x-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20 rotate-3">
              <User className="w-10 h-10 sm:w-12 sm:h-12 text-white -rotate-3" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {profile.username || 'Creator Profile'}
              </h1>
              <div className="flex items-center mt-1 sm:mt-2 space-x-3">
                <div className="flex items-center bg-gray-50 dark:bg-slate-900/50 px-3 py-1 rounded-full border border-gray-100 dark:border-white/10 group gap-1">
                  <p className="text-gray-500 dark:text-gray-400 font-mono text-xs sm:text-sm">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                  <CopyButton text={address} className="opacity-0 group-hover:opacity-100 transition-opacity -my-1 dark:text-gray-400 dark:hover:text-purple-400 text-gray-500 hover:text-purple-600" />
                </div>
                {profile.verification?.isVerified && (
                  <div className="flex items-center space-x-1.5 bg-yellow-50 dark:bg-yellow-900/20 px-2.5 py-1 rounded-full border border-yellow-100 dark:border-yellow-500/20">
                    <Award className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500" />
                    <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">Verified</span>
                  </div>
                )}
              </div>
              {profile.bio && (
                <p className="text-gray-600 dark:text-gray-300 mt-3 max-w-md text-sm sm:text-base leading-relaxed">{profile.bio}</p>
              )}
            </div>
          </div>
          <div className="text-left sm:text-right bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl sm:bg-transparent sm:p-0 sm:rounded-none w-full sm:w-auto border border-gray-100 dark:border-white/10 sm:border-none">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Member since</p>
            <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              {formatDate(profile.stats.createdAt || new Date().toISOString()).split(',')[0]}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[
          { label: 'Total Artworks', value: profile.stats.totalArtworks, icon: Palette, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          { label: 'Active Listings', value: profile.stats.activeListings, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Total Sales', value: profile.stats.totalSales, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Portfolio Value', value: `${profile.stats.totalValue.toFixed(2)} ETH`, icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800/80 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 p-4 sm:p-6 flex flex-col justify-center backdrop-blur-md"
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bg} dark:bg-opacity-10 ${stat.border} border rounded-xl flex items-center justify-center mb-3 sm:mb-4`}>
              <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color} dark:text-opacity-90`} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        {/* Art Collection Section (Takes up more space) */}
        <div className="xl:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800/80 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 p-4 sm:p-6 backdrop-blur-md"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Palette className="w-5 h-5 mr-2 text-purple-500" />
                Collection
              </h2>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={collection.filters.status}
                  onChange={(e) => updateCollectionFilters({ status: e.target.value })}
                  className="flex-1 sm:flex-none px-3 py-2 bg-gray-50 dark:bg-slate-900/50 border-transparent dark:border-white/10 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 focus:border-purple-500"
                >
                  <option value="all">All Artworks</option>
                  <option value="owned">Owned</option>
                  <option value="listed">Listed</option>
                </select>
                <div className="flex items-center bg-gray-50 dark:bg-slate-900/50 rounded-lg p-1">
                  <button
                    onClick={() => updateCollectionView('grid')}
                    className={`p-1.5 sm:p-2 rounded-md transition-colors ${collection.viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-sm text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateCollectionView('list')}
                    className={`p-1.5 sm:p-2 rounded-md transition-colors ${collection.viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {filteredArtworks.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-100 dark:border-white/10 rounded-xl bg-gray-50/50 dark:bg-slate-900/30">
                <Image className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">No Artworks Yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Start creating AI art or purchase from the gallery to build your collection.</p>
              </div>
            ) : (
              collection.viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ArtworkGrid artworks={filteredArtworks} listings={listings} address={address} />
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredArtworks.map((artwork) => (
                    <motion.div
                      key={artwork.id}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center space-x-4 p-3 sm:p-4 border border-gray-100 dark:border-white/10 rounded-xl hover:shadow-md hover:border-gray-200 dark:hover:border-white/20 transition-all bg-white dark:bg-slate-800/50 group cursor-pointer"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <img
                          src={artwork.imageUrl}
                          alt={artwork.metadata?.prompt || artwork.title || 'AI Artwork'}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {listings.find(l => l.tokenId === artwork.id) && (
                          <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm sm:text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {artwork.metadata?.prompt || artwork.title || 'Untitled'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          {artwork.metadata?.aiModel || 'Unknown'} • {formatDate(artwork.createdAt).split(',')[0]}
                        </p>
                        {listings.find(l => l.tokenId === artwork.id) && (
                          <div className="mt-2 text-sm font-black text-gray-900 dark:text-white">
                            {listings.find(l => l.tokenId === artwork.id).price} XLM
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/60">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}
          </motion.div>
        </div>

        {/* Trading History Section (Side column) */}
        <div className="xl:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800/80 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 p-4 sm:p-6 sticky top-24 backdrop-blur-md"
          >
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-500" />
              Activity
            </h2>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-white/10 rounded-xl bg-gray-50/50 dark:bg-slate-900/30">
                <Clock className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction, index) => (
                  <div key={transaction.id} className="relative pl-6 sm:pl-8 pb-4 last:pb-0">
                    {/* Timeline line */}
                    {index !== filteredTransactions.length - 1 && (
                      <div className="absolute top-8 left-[11px] sm:left-[15px] w-0.5 h-full bg-gray-100 dark:bg-white/10 -ml-px z-0"></div>
                    )}

                    {/* Timeline dot/icon */}
                    <div className="absolute top-2 left-0 w-6 h-6 sm:w-8 sm:h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/10 z-10">
                      {getTransactionIcon(transaction.type)}
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gray-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-gray-100 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-md transition-all ml-2"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                          {transaction.type === 'sale' ? 'Sold' : transaction.type === 'purchase' ? 'Purchased' : 'Listed'}
                        </h4>
                        <span className="text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-slate-800 px-2 py-1 rounded-md shadow-sm border dark:border-white/5">
                          {transaction.price} ETH
                        </span>
                      </div>

                      <p className="text-xs text-purple-600 font-medium truncate mb-1">
                        {transaction.artworkTitle}
                      </p>

                      <div className="flex justify-between items-end mt-2">
                        <div className="flex items-center gap-1 group/address">
                          <p className="text-[10px] sm:text-xs text-gray-500 font-medium">
                            {transaction.type === 'sale' ? `To: ${transaction.buyer?.slice(0, 4)}...${transaction.buyer?.slice(-4)}` :
                             transaction.type === 'purchase' ? `From: ${transaction.seller?.slice(0, 4)}...${transaction.seller?.slice(-4)}` :
                             `Listed by you`}
                          </p>
                          {(transaction.type === 'sale' && transaction.buyer) && (
                            <CopyButton text={transaction.buyer} className="opacity-0 group-hover/address:opacity-100 transition-opacity" />
                          )}
                          {(transaction.type === 'purchase' && transaction.seller) && (
                            <CopyButton text={transaction.seller} className="opacity-0 group-hover/address:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">
                          {formatDate(transaction.timestamp).split(',')[0]}
                        </p>
                      </div>

                      {transaction.txHash && (
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <a
                            href={`https://etherscan.io/tx/${transaction.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[10px] sm:text-xs font-bold text-blue-500 hover:text-blue-600"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View on Explorer
                          </a>
                        </div>
                      )}
                    </motion.div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
