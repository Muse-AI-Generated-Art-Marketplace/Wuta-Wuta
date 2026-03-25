import React, { useState, useEffect } from 'react';
import { useInfiniteScroll } from '../utils/useInfiniteScroll';
import { motion } from 'framer-motion';
import { 
  Image as GalleryIcon, 
  Search, 
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Filter
} from 'lucide-react';
import { useMuseStore } from '../store/museStore';
import { useWalletStore } from '../store/walletStore';
import Loading from './ui/Loading';
import toast from 'react-hot-toast';
import ArtworkGrid from './ArtworkGrid';

const Gallery = () => {
  const { 
    artworks, 
    listings, 
    buyArtwork, 
    getActiveListings, 
    isLoading,
    isAnalyzing,
    searchArtworks,
    getPopularTags,
    getAvailableStyles,
    getAvailableMoods,
    analyzeExistingArtwork,
    batchAnalyzeArtworks
  } = useMuseStore();
  const { address } = useWalletStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModel, setFilterModel] = useState('all');
  const [filterPrice, setFilterPrice] = useState('all');
  const [filterStyle, setFilterStyle] = useState('all');
  const [filterMood, setFilterMood] = useState('all');
  const [filterVisionAnalyzed, setFilterVisionAnalyzed] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showPopularTags, setShowPopularTags] = useState(false);

  // Get dynamic filter options
  const popularTags = getPopularTags();
  const availableStyles = getAvailableStyles();
  const availableMoods = getAvailableMoods();

  useEffect(() => {
    // Load marketplace data
    getActiveListings();
  }, [getActiveListings]);
  
  // Enhanced search using Vision AI data
  const filteredArtworks = searchArtworks(searchTerm, {
    aiModel: filterModel,
    style: filterStyle,
    mood: filterMood,
    hasVisionAnalysis: filterVisionAnalyzed
  }).filter(artwork => {
    // Apply price filtering
    const listing = listings.find(l => l.tokenId === artwork.id);
    const matchesPrice = filterPrice === 'all' || 
      (filterPrice === 'under-100' && listing && listing.price < 100) ||
      (filterPrice === '100-500' && listing && listing.price >= 100 && listing.price <= 500) ||
      (filterPrice === 'over-500' && listing && listing.price > 500);
    
    return matchesPrice;
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
  
  const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll(sortedArtworks);

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

  const handleAnalyzeArtwork = async (artworkId) => {
    try {
      await analyzeExistingArtwork(artworkId);
      toast.success('Artwork analyzed successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to analyze artwork');
    }
  };

  const handleBatchAnalyze = async () => {
    const unanalyzedArtworks = artworks.filter(a => !a.metadata?.isVisionAnalyzed);
    if (unanalyzedArtworks.length === 0) {
      toast('All artworks have been analyzed!');
      return;
    }

    try {
      await batchAnalyzeArtworks(unanalyzedArtworks.map(a => a.id));
      toast.success(`Successfully analyzed ${unanalyzedArtworks.length} artworks!`);
    } catch (error) {
      toast.error(error.message || 'Failed to analyze artworks');
    }
  };

  const handleTagClick = (tag) => {
    setSearchTerm(tag);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterModel('all');
    setFilterPrice('all');
    setFilterStyle('all');
    setFilterMood('all');
    setFilterVisionAnalyzed(false);
    setSortBy('recent');
  };
  
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">Art Gallery</h1>
          <p className="text-sm sm:text-base text-gray-600">Explore and collect AI-human collaborative artwork</p>
        </div>

        {/* Vision AI Controls */}
        <div className="flex gap-2">
          <button
            onClick={handleBatchAnalyze}
            disabled={isAnalyzing || artworks.length === 0}
            className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loading size="xs" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze All
              </>
            )}
          </button>
        </div>
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
          className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm"
        >
          <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mb-2 sm:mb-3" />
          <p className="text-2xl sm:text-3xl font-black text-gray-900">{getActiveListings().length}</p>
          <p className="text-xs sm:text-sm font-medium text-gray-500">Active Listings</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm"
        >
          <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mb-2 sm:mb-3" />
          <p className="text-2xl sm:text-3xl font-black text-gray-900">
            {getActiveListings().reduce((sum, listing) => sum + listing.price, 0)}
          </p>
          <p className="text-xs sm:text-sm font-medium text-gray-500">Total Value (XLM)</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm"
        >
          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mb-2 sm:mb-3" />
          <p className="text-2xl sm:text-3xl font-black text-gray-900">
            {artworks.filter(a => a.metadata?.canEvolve).length}
          </p>
          <p className="text-xs sm:text-sm font-medium text-gray-500">Evolvable Art</p>
        </motion.div>
      </div>

      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center mr-3">
                <TrendingUp className="w-4 h-4 text-orange-600" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Popular Tags</h3>
            </div>
            <button
              onClick={() => setShowPopularTags(!showPopularTags)}
              className="text-xs font-bold px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {showPopularTags ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showPopularTags && (
            <div className="flex flex-wrap gap-2">
              {popularTags.slice(0, 12).map(({ tag, count }) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 text-purple-700 hover:text-purple-800 rounded-lg text-xs font-semibold transition-all border border-purple-100 flex items-center gap-1"
                >
                  {tag}
                  <span className="text-purple-500">({count})</span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Mobile Filter Toggle */}
      <button
        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
        className="sm:hidden flex items-center justify-center space-x-2 w-full py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium shadow-sm"
      >
        <Filter className="w-4 h-4" />
        <span>{isFiltersOpen ? 'Hide Filters' : 'Show Filters'}</span>
      </button>

      {/* Filters & Search */}
      <motion.div
        initial={false}
        animate={{ height: isFiltersOpen || window.innerWidth >= 640 ? 'auto' : 0, opacity: isFiltersOpen || window.innerWidth >= 640 ? 1 : 0 }}
        className={`overflow-hidden sm:overflow-visible transition-all duration-300 ${!isFiltersOpen && 'max-sm:hidden'}`}
      >
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search artworks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 border-transparent rounded-lg sm:rounded-xl text-sm focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all placeholder-gray-400"
              />
            </div>

            {/* AI Model Filter */}
            <div className="relative">
              <select
                value={filterModel}
                onChange={(e) => setFilterModel(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 sm:py-3 bg-gray-50 border-transparent rounded-lg sm:rounded-xl text-sm text-gray-700 font-medium focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all appearance-none cursor-pointer"
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

            {/* Style Filter */}
            <div className="relative">
              <select
                value={filterStyle}
                onChange={(e) => setFilterStyle(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 sm:py-3 bg-gray-50 border-transparent rounded-lg sm:rounded-xl text-sm text-gray-700 font-medium focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Styles</option>
                {availableStyles.map(style => (
                  <option key={style} value={style}>{style.charAt(0).toUpperCase() + style.slice(1)}</option>
                ))}
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
                className="w-full pl-4 pr-10 py-2.5 sm:py-3 bg-gray-50 border-transparent rounded-lg sm:rounded-xl text-sm text-gray-700 font-medium focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all appearance-none cursor-pointer"
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
                className="w-full pl-4 pr-10 py-2.5 sm:py-3 bg-gray-50 border-transparent rounded-lg sm:rounded-xl text-sm text-gray-700 font-medium focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all appearance-none cursor-pointer"
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

          {/* Advanced Filters */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
            <label className="flex items-center p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={filterVisionAnalyzed}
                onChange={(e) => setFilterVisionAnalyzed(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 bg-white mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Vision Analyzed Only</span>
            </label>

            {availableMoods.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">Mood:</span>
                <div className="flex gap-1">
                  {availableMoods.slice(0, 4).map(mood => (
                    <button
                      key={mood}
                      onClick={() => setFilterMood(filterMood === mood ? 'all' : mood)}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                        filterMood === mood
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Gallery Grid using responsive component */}
      <ArtworkGrid 
        artworks={visibleItems} 
        listings={listings} 
        onBuyArtwork={handleBuyArtwork} 
        onAnalyzeArtwork={handleAnalyzeArtwork}
        isLoading={isLoading || isAnalyzing} 
        address={address} 
      />

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <Loading size="md" />
        </div>
      )}
      
      {/* Empty State */}
      {sortedArtworks.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 sm:py-24 px-4 bg-white rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <GalleryIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No artworks found</h3>
          <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto">
            {searchTerm || filterModel !== 'all' || filterPrice !== 'all'
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Be the first to create an artwork and it will appear here!'
            }
          </p>
          {(searchTerm || filterModel !== 'all' || filterPrice !== 'all' || filterStyle !== 'all' || filterMood !== 'all' || filterVisionAnalyzed) && (
            <button 
              onClick={clearFilters}
              className="mt-6 px-6 py-2.5 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 font-semibold transition-colors"
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
