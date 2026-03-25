import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Image as ImageIcon, 
  ShoppingCart, 
  Eye, 
  Heart, 
  ExternalLink,
  Sparkles,
  MoreVertical,
  Download,
  Share2
} from 'lucide-react';
import Loading from './ui/Loading';
import { Card, CardContent, Button, Badge, Avatar } from './ui';

const ArtworkGrid = ({ 
  artworks, 
  listings, 
  onBuyArtwork, 
  onAnalyzeArtwork,
  isLoading = false,
  address 
}) => {
  const [selectedArtwork, setSelectedArtwork] = useState(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(8)].map((_, index) => (
          <Card key={index} hover>
            <CardContent className="p-0">
              <div className="aspect-square bg-gray-100 animate-pulse rounded-t-xl" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 animate-pulse rounded" />
                <div className="h-3 bg-gray-200 animate-pulse rounded w-3/4" />
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-gray-200 animate-pulse rounded w-20" />
                  <div className="h-8 bg-gray-200 animate-pulse rounded w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!artworks || artworks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16 sm:py-24 px-4 bg-white rounded-2xl shadow-sm border border-gray-100"
      >
        <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Artworks Found</h3>
        <p className="text-gray-500">Start creating some amazing AI-human collaborative art!</p>
      </motion.div>
    );
  }

  const handleBuy = async (tokenId, price) => {
    if (onBuyArtwork) {
      await onBuyArtwork(tokenId, price);
    }
  };

  const handleAnalyze = async (artworkId) => {
    if (onAnalyzeArtwork) {
      await onAnalyzeArtwork(artworkId);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {artworks.map((artwork, index) => {
        const listing = listings?.find(l => l.tokenId === artwork.id);
        const isOwned = artwork.owner === address;
        
        return (
          <motion.div
            key={artwork.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="group overflow-hidden">
              <CardContent className="p-0">
                {/* Artwork Image */}
                <div className="relative aspect-square overflow-hidden bg-gray-50">
                  {artwork.image ? (
                    <img
                      src={artwork.image}
                      alt={artwork.name || 'Artwork'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/90 text-gray-900 hover:bg-white"
                      onClick={() => window.open(artwork.image, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    {artwork.metadata && !artwork.metadata.isVisionAnalyzed && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 text-gray-900 hover:bg-white"
                        onClick={() => handleAnalyze(artwork.id)}
                        disabled={isLoading}
                      >
                        <Sparkles className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/90 text-gray-900 hover:bg-white"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Status Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {artwork.metadata?.isVisionAnalyzed && (
                      <Badge variant="success" className="bg-green-500 text-white text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Vision AI
                      </Badge>
                    )}
                    {artwork.metadata?.canEvolve && (
                      <Badge variant="info" className="bg-blue-500 text-white text-xs">
                        Evolvable
                      </Badge>
                    )}
                    {isOwned && (
                      <Badge variant="warning" className="bg-yellow-500 text-white text-xs">
                        Owned
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Artwork Details */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate text-sm">
                      {artwork.name || `Artwork #${artwork.id}`}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {artwork.description || 'AI-human collaborative artwork'}
                    </p>
                  </div>
                  
                  {/* Creator Info */}
                  <div className="flex items-center gap-2">
                    <Avatar
                      size="xs"
                      fallback={artwork.creator?.slice(0, 2).toUpperCase() || 'AI'}
                      className="w-6 h-6"
                    />
                    <span className="text-xs text-gray-600 font-mono">
                      {artwork.creator ? `${artwork.creator.slice(0, 6)}...${artwork.creator.slice(-4)}` : 'Unknown'}
                    </span>
                  </div>
                  
                  {/* AI Model Tag */}
                  {artwork.metadata?.aiModel && (
                    <Badge variant="outline" className="text-xs">
                      {artwork.metadata.aiModel}
                    </Badge>
                  )}
                  
                  {/* Price and Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    {listing ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-gray-900">{listing.price}</span>
                        <span className="text-xs text-gray-500">XLM</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not Listed</span>
                    )}
                    
                    {listing && !isOwned && (
                      <Button
                        size="sm"
                        onClick={() => handleBuy(listing.tokenId, listing.price)}
                        disabled={isLoading}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {isLoading ? (
                          <Loading size="xs" />
                        ) : (
                          <>
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Buy
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ArtworkGrid;