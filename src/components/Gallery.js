import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Gallery as GalleryIcon, 
  Search, 
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Filter
} from 'lucide-react';
import { useMuseStore } from '../store/museStore';
import { useWalletStore } from '../store/walletStore';
import toast from 'react-hot-toast';
import ArtworkGrid from './ArtworkGrid';

const Gallery = () => {
  const { 
    artworks, 
    listings, 
    buyArtwork, 
    getActiveListings, 
    isLoading 
  } = useMuseStore();
  const { address } = useWalletStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModel, setFilterModel] = useState('all');
  const [filterPrice, setFilterPrice] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    // Load marketplace data
    getActiveListings();
  }, [getActiveListings]);
  
  const filteredArtworks = artworks.filter(artwork => {
    const matchesSearch = artwork.metadata?.prompt?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          artwork.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          false;
    const matchesModel = filterModel === 'all' || artwork.metadata?.aiModel === filterModel;
    const listing = listings.find(l => l.tokenId === artwork.id);
    const matchesPrice = filterPrice === 'all' || 
      (filterPrice === 'under-100' && listing && listing.price < 100) ||
      (filterPrice === '100-500' && listing && listing.price >= 100 && listing.price <= 500) ||
      (filterPrice === 'over-500' && listing && listing.price > 500);
    
    return matchesSearch && matchesModel && matchesPrice;
  });
  
  const sortedArtworks = [...filteredArtworks].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'price-low': {
        const priceA = listings.find(l => l.tokenId === a.id)?.price || 0;
        const priceB = listings.find(l => l.tokenId === b.id)?.price || 0;
        return priceA - priceB;
      }
      case 'price-high': {
        const priceHighA = listings.find(l => l.tokenId === a.id)?.price || 0;
        const priceHighB = listings.find(l => l.tokenId === b.id)?.price || 0;
        return priceHighB - priceHighA;
      }
      default:
        return 0;
    }
  });
  
  const handleBuyArtwork = async (tokenId, price) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    try {
      await buyArtwork(tokenId, price);
      toast.success('Artwork purchased successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to purchase artwork');
    }
  };
  
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Art Gallery</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Explore and collect AI-human collaborative artwork</p>
        </div>

        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="sm:hidden flex items-center justify-center space-x-2 w-full py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-200 font-medium shadow-sm"
        >
          <Filter className="w-4 h-4" />
          <span>{isFiltersOpen ? 'Hide Filters' : 'Show Filters'}</span>
        </button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-purple-500/20"
        >
          <GalleryIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-200 mb-2 sm:mb-3" />
          <p className="text-2xl sm:text-3xl font-black">{artworks.length}</p>
          <p className="text-xs sm:text-sm font-medium text-purple-100">Total Artworks</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-white/10 shadow-sm backdrop-blur-md"
        >
          <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mb-2 sm:mb-3" />
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{getActiveListings().length}</p>
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Active Listings</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-white/10 shadow-sm backdrop-blur-md"
        >
          <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mb-2 sm:mb-3" />
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            {getActiveListings().reduce((sum, listing) => sum + listing.price, 0)}
          </p>
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Value (XLM)</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-white/10 shadow-sm backdrop-blur-md"
        >
          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mb-2 sm:mb-3" />
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            {artworks.filter(a => a.metadata?.canEvolve).length}
          </p>
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Evolvable Art</p>
        </motion.div>
      </div>

      {/* Filters & Search */}
      <motion.div
        initial={false}
        animate={{ height: isFiltersOpen || window.innerWidth >= 640 ? 'auto' : 0, opacity: isFiltersOpen || window.innerWidth >= 640 ? 1 : 0 }}
        className={`overflow-hidden sm:overflow-visible transition-all duration-300 ${!isFiltersOpen && 'max-sm:hidden'}`}
      >
        <div className="bg-white dark:bg-slate-800/60 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 p-4 sm:p-5 backdrop-blur-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search artworks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-slate-900/50 border-transparent dark:border-white/10 rounded-lg sm:rounded-xl text-sm dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 transition-all placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* AI Model Filter */}
            <div className="relative">
              <select
                value={filterModel}
                onChange={(e) => setFilterModel(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 sm:py-3 bg-gray-50 dark:bg-slate-900/50 border-transparent dark:border-white/10 rounded-lg sm:rounded-xl text-sm text-gray-700 dark:text-gray-200 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Models</option>
                <option value="stable-diffusion">Stable Diffusion</option>
                <option value="dall-e-3">DALL-E 3</option>
                <option value="midjourney">Midjourney</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            {/* Price Filter */}
            <div className="relative">
              <select
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 sm:py-3 bg-gray-50 dark:bg-slate-900/50 border-transparent dark:border-white/10 rounded-lg sm:rounded-xl text-sm text-gray-700 dark:text-gray-200 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Prices</option>
                <option value="under-100">Under 100 XLM</option>
                <option value="100-500">100-500 XLM</option>
                <option value="over-500">Over 500 XLM</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 sm:py-3 bg-gray-50 dark:bg-slate-900/50 border-transparent dark:border-white/10 rounded-lg sm:rounded-xl text-sm text-gray-700 dark:text-gray-200 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 transition-all appearance-none cursor-pointer"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Gallery Grid using responsive component */}
      <ArtworkGrid 
        artworks={sortedArtworks} 
        listings={listings} 
        onBuyArtwork={handleBuyArtwork} 
        isLoading={isLoading} 
        address={address} 
      />
      
      {/* Empty State */}
      {sortedArtworks.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 sm:py-24 px-4 bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10"
        >
          <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <GalleryIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">No artworks found</h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {searchTerm || filterModel !== 'all' || filterPrice !== 'all'
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Be the first to create an artwork and it will appear here!'
            }
          </p>
          {(searchTerm || filterModel !== 'all' || filterPrice !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterModel('all');
                  setFilterPrice('all');
                  setSortBy('recent');
                }}
                className="mt-6 px-6 py-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 font-semibold transition-colors"
              >
              Clear Filters
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Gallery;
