import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Image as ImageIcon, 
  ShoppingCart,
  Eye,
  Sparkles,
  Heart,
  ExternalLink,
  MoreVertical
} from 'lucide-react';

const ArtworkGrid = ({ 
  artworks, 
  listings, 
  onBuyArtwork, 
  onAnalyzeArtwork,
  isLoading, 
  address 
}) => {
  const [selectedArtwork, setSelectedArtwork] = useState(null);

  const handleBuyClick = (artwork) => {
    const listing = listings.find(l => l.tokenId === artwork.id);
    if (listing) {
      onBuyArtwork(artwork.id, listing.price);
    }
  };

  const handleAnalyzeClick = (artwork) => {
    onAnalyzeArtwork(artwork.id);
  };

  const getListing = (artworkId) => {
    return listings.find(l => l.tokenId === artworkId);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse"
            role="status"
            aria-label="Loading artwork"
          >
            <div className="aspect-square bg-gray-200"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="text-center py-16 sm:py-24 px-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ImageIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No artworks found</h3>
        <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {artworks.map((artwork, index) => {
        const listing = getListing(artwork.id);
        const isOwner = address === artwork.creator;
        const hasVisionAnalysis = artwork.metadata?.isVisionAnalyzed;

        return (
          <motion.article
            key={artwork.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
            role="article"
            aria-label={`Artwork: ${artwork.name || 'Untitled'}`}
          >
            {/* Artwork Image */}
            <div className="relative aspect-square overflow-hidden bg-gray-50">
              {artwork.image ? (
                <img
                  src={artwork.image}
                  alt={artwork.name || 'Artwork'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                </div>
              )}

              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 p-4">
                {listing && !isOwner && (
                  <button
                    onClick={() => handleBuyClick(artwork)}
                    className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
                    aria-label={`Buy ${artwork.name || 'artwork'} for ${listing.price} XLM`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Buy {listing.price} XLM
                  </button>
                )}
                
                {!hasVisionAnalysis && (
                  <button
                    onClick={() => handleAnalyzeClick(artwork)}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                    aria-label={`Analyze ${artwork.name || 'artwork'} with Vision AI`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Analyze
                  </button>
                )}
              </div>

              {/* Status Badges */}
              <div className="absolute top-2 left-2 flex gap-2">
                {listing && (
                  <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    For Sale
                  </span>
                )}
                {hasVisionAnalysis && (
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full" aria-label="Vision analyzed">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Analyzed
                  </span>
                )}
                {artwork.metadata?.canEvolve && (
                  <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Evolvable
                  </span>
                )}
              </div>
            </div>

            {/* Artwork Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate text-sm sm:text-base">
                    {artwork.name || 'Untitled Artwork'}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    by {artwork.creator?.slice?.(0, 6)}...{artwork.creator?.slice?.(-4)}
                  </p>
                </div>
                <button
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ml-2"
                  aria-label="More options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Description */}
              {artwork.description && (
                <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                  {artwork.description}
                </p>
              )}

              {/* Tags */}
              {artwork.metadata?.tags && artwork.metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3" role="list" aria-label="Artwork tags">
                  {artwork.metadata.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                      role="listitem"
                    >
                      {tag}
                    </span>
                  ))}
                  {artwork.metadata.tags.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{artwork.metadata.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Price and Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                {listing ? (
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-gray-900">{listing.price}</span>
                    <span className="text-xs text-gray-500">XLM</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Not for sale</span>
                )}

                <div className="flex gap-1">
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="View artwork details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Add to favorites"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
};

export default ArtworkGrid;