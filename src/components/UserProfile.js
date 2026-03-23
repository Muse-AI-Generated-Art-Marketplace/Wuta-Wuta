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
  Star,
  ExternalLink,
  Filter,
  Grid3X3,
  List,
  Calendar
} from 'lucide-react';
import { useMuseStore } from '../store/museStore';
import { useWalletStore } from '../store/walletStore';
import { useUserProfileStore } from '../store/userProfileStore';

const UserProfile = () => {
  const { artworks, listings, getUserListings } = useMuseStore();
  const { address, isConnected } = useWalletStore();
  const { 
    profile, 
    collection, 
    tradingHistory, 
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600">Connect your wallet to view your profile and collection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.username || 'Creator Profile'}
              </h1>
              <p className="text-gray-600 font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
              {profile.verification?.isVerified && (
                <div className="flex items-center space-x-2 mt-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Verified Creator</span>
                </div>
              )}
              {profile.bio && (
                <p className="text-gray-600 mt-2 max-w-md">{profile.bio}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Member since</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatDate(profile.stats.createdAt || new Date().toISOString())}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Artworks', value: profile.stats.totalArtworks, icon: Palette, color: 'from-purple-500 to-pink-500' },
          { label: 'Active Listings', value: profile.stats.activeListings, icon: Activity, color: 'from-blue-500 to-cyan-500' },
          { label: 'Total Sales', value: profile.stats.totalSales, icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
          { label: 'Portfolio Value', value: `${profile.stats.totalValue.toFixed(2)} ETH`, icon: DollarSign, color: 'from-yellow-500 to-orange-500' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-gray-600 text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Art Collection Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">AI Art Collection</h2>
          <div className="flex items-center space-x-2">
            <select
              value={collection.filters.status}
              onChange={(e) => updateCollectionFilters({ status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Artworks</option>
              <option value="owned">Owned</option>
              <option value="listed">Listed</option>
            </select>
            <select
              value={collection.sortBy}
              onChange={(e) => updateCollectionSort(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="recent">Most Recent</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
              <option value="views">Most Viewed</option>
              <option value="likes">Most Liked</option>
            </select>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => updateCollectionView('grid')}
                className={`p-2 ${collection.viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateCollectionView('list')}
                className={`p-2 ${collection.viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {filteredArtworks.length === 0 ? (
          <div className="text-center py-12">
            <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Artworks Yet</h3>
            <p className="text-gray-600">Start creating AI art to build your collection</p>
          </div>
        ) : (
          <div className={collection.viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredArtworks.map((artwork) => {
              const listing = listings.find(l => l.tokenId === artwork.id);
              return (
                <motion.div
                  key={artwork.id}
                  whileHover={{ scale: 1.02 }}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {collection.viewMode === 'grid' ? (
                    <>
                      <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 relative">
                        <img 
                          src={artwork.imageUrl} 
                          alt={artwork.title || 'AI Artwork'}
                          className="w-full h-full object-cover"
                        />
                        {artwork.listed && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                            Listed
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {artwork.title || 'Untitled'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          AI: {artwork.aiModel || 'Unknown'}
                        </p>
                        {artwork.price && (
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-purple-600">
                              {artwork.price} ETH
                            </span>
                            <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                              View Details
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center space-x-4 p-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={artwork.imageUrl} 
                          alt={artwork.title || 'AI Artwork'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {artwork.title || 'Untitled'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          AI: {artwork.aiModel || 'Unknown'} • Created {formatDate(artwork.createdAt)}
                        </p>
                        {artwork.price && (
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-lg font-bold text-purple-600">
                              {artwork.price} ETH
                            </span>
                            <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                              View Details
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Trading History Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">Trading History</h2>
        
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Trading Activity</h3>
            <p className="text-gray-600">Your trading history will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 capitalize">
                      {transaction.type === 'sale' ? 'Sold' : transaction.type === 'purchase' ? 'Purchased' : 'Listed'} 
                      <span className="ml-2 text-purple-600">{transaction.artworkTitle}</span>
                    </h4>
                    <p className="text-sm text-gray-600">
                      {transaction.type === 'sale' ? `Buyer: ${transaction.buyer?.slice(0, 6)}...${transaction.buyer?.slice(-4)}` : 
                       transaction.type === 'purchase' ? `Seller: ${transaction.seller?.slice(0, 6)}...${transaction.seller?.slice(-4)}` :
                       `Listed by ${transaction.seller?.slice(0, 6)}...${transaction.seller?.slice(-4)}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {transaction.price} ETH
                  </p>
                  <p className="text-sm text-gray-600">{formatDate(transaction.timestamp)}</p>
                  {transaction.txHash && (
                    <a 
                      href={`https://etherscan.io/tx/${transaction.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 text-xs flex items-center justify-end mt-1"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Transaction
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UserProfile;
