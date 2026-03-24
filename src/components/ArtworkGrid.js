import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ShoppingCart, Sparkles } from 'lucide-react';

const ArtworkGrid = ({ 
  artworks, 
  listings = [], 
  onBuyArtwork, 
  isLoading, 
  address 
}) => {
  const getListingForArtwork = (artworkId) => {
    return listings.find(listing => listing.tokenId === artworkId);
  };

  if (!artworks || artworks.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 transition-all duration-500 ease-in-out">
      {artworks.map((artwork, index) => {
        const listing = getListingForArtwork(artwork.id);
        const isOwner = artwork.owner === address;
        
        return (
          <motion.div
            key={artwork.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl dark:shadow-slate-900/50 border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col transition-all duration-300 transform hover:-translate-y-1"
          >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden group bg-gray-100 dark:bg-slate-900">
              <img
                src={artwork.imageUrl}
                alt={artwork.metadata?.prompt || artwork.title || 'Artwork'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              
              {/* Glassmorphism Hover Overlay */}
              <div className="absolute inset-0 bg-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out flex flex-col justify-between p-4">
                {/* Top Section - Artist and CID */}
                <div className="space-y-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {artwork.owner ? artwork.owner.slice(0, 2).toUpperCase() : 'AN'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm drop-shadow-lg">
                        Artist: {artwork.owner ? `${artwork.owner.slice(0, 6)}...${artwork.owner.slice(-4)}` : 'Unknown'}
                      </p>
                      <p className="text-white/80 text-xs drop-shadow">
                        CID: {artwork.tokenId || artwork.id ? `${String(artwork.tokenId || artwork.id).slice(0, 8)}...` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Middle Section - Title */}
                <div className="text-center transform scale-95 group-hover:scale-100 transition-transform duration-500 delay-150">
                  <h3 className="text-white font-bold text-lg drop-shadow-lg line-clamp-2">
                    {artwork.metadata?.prompt || artwork.title || 'Untitled'}
                  </h3>
                </div>

                {/* Bottom Section - Price and Actions */}
                <div className="space-y-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-200">
                  {listing && !isOwner && (
                    <div className="bg-white/30 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/80 text-xs font-medium">Price</p>
                          <p className="text-white font-bold text-lg">{listing.price} XLM</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onBuyArtwork(artwork.id, listing.price);
                          }}
                          disabled={isLoading}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all text-sm font-semibold shadow-lg hover:shadow-xl transform active:scale-95"
                        >
                          {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          ) : (
                            'Buy Now'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {isOwner && (
                    <div className="bg-white/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20 text-center">
                      <p className="text-white font-semibold text-sm">Owned by You</p>
                    </div>
                  )}

                  {!listing && !isOwner && (
                    <div className="bg-white/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20 text-center">
                      <p className="text-white/80 text-sm">Not for Sale</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Original Overlays */}
              <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start pointer-events-none opacity-0 group-hover:opacity-0 transition-opacity duration-300">
                {artwork.metadata?.canEvolve && (
                  <div className="bg-purple-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Evolvable</span>
                  </div>
                )}
                <div className="flex-1"></div>
                {listing && (
                  <div className="bg-green-500/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm">
                    For Sale
                  </div>
                )}
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4 sm:p-5 flex flex-col flex-grow bg-white dark:bg-slate-800">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 text-base sm:text-lg leading-tight" title={artwork.metadata?.prompt || artwork.title}>
                {artwork.metadata?.prompt || artwork.title || 'Untitled'}
              </h3>
              
              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 mt-auto">
                <span className="flex items-center font-medium">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  {new Date(artwork.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {artwork.metadata?.aiModel && (
                  <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-500/20 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                    {artwork.metadata.aiModel}
                  </span>
                )}
              </div>
              
              {/* Contributions */}
              {artwork.metadata?.humanContribution !== undefined && (
                <div className="space-y-2 mb-4">
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-purple-500" 
                      style={{ width: `${artwork.metadata.humanContribution}%` }}
                    ></div>
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${artwork.metadata.aiContribution}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span className="text-purple-600">Human {artwork.metadata.humanContribution}%</span>
                    <span className="text-blue-600">AI {artwork.metadata.aiContribution}%</span>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              {listing && !isOwner && onBuyArtwork && (
                <div className="border-t border-gray-100 dark:border-white/10 pt-4 mt-1">
                  <div className="flex items-end justify-between mb-3 sm:mb-4">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Current Price</p>
                      <span className="text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-none">
                        {listing.price} XLM
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-0.5">
                      ~${(listing.price * 0.13).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => onBuyArtwork(artwork.id, listing.price)}
                    disabled={isLoading}
                    className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all flex items-center justify-center text-sm font-bold shadow-md hover:shadow-lg transform active:scale-95"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Buy Artwork
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {isOwner && (
                <div className="border-t border-gray-100 dark:border-white/10 pt-3 sm:pt-4 mt-1">
                  <div className="bg-gray-50 dark:bg-slate-800/80 text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-semibold py-2.5 rounded-lg text-center border border-gray-200 dark:border-white/10">
                    Owned by You
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ArtworkGrid;