import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import useFavoritesStore from '../store/favoritesStore';

/**
 * FavoriteButton - A heart button to favorite/unfavorite artworks
 * 
 * @param {string} artworkId - The ID of the artwork
 * @param {string} artworkTitle - The title of the artwork (for accessibility)
 * @param {string} size - Size variant: 'sm' | 'md' | 'lg'
 * @param {boolean} showLabel - Whether to show "Favorite" text label
 * @param {function} onToggle - Optional callback when favorite status changes
 */
const FavoriteButton = ({ 
  artworkId, 
  artworkTitle,
  size = 'md', 
  showLabel = false,
  onToggle 
}) => {
  const { favoriteIds, toggleFavorite, fetchFavorites } = useFavoritesStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const isFavorited = favoriteIds.has(artworkId);
  
  // Fetch favorites on mount
  useEffect(() => {
    fetchFavorites();
  }, []);
  
  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    await toggleFavorite(artworkId);
    setIsLoading(false);
    
    if (onToggle) {
      onToggle(!isFavorited);
    }
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  
  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };
  
  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-1.5
        ${buttonSizeClasses[size]}
        rounded-full
        transition-all duration-200
        ${isFavorited 
          ? 'bg-red-50 text-red-500 hover:bg-red-100' 
          : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-red-50'
        }
        ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
      `}
      aria-label={isFavorited ? `Remove ${artworkTitle} from favorites` : `Add ${artworkTitle} to favorites`}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart 
        className={`${sizeClasses[size]} transition-all duration-200 ${isFavorited ? 'fill-current' : ''}`}
        strokeWidth={isFavorited ? 2.5 : 2}
      />
      {showLabel && (
        <span className={`${labelSizeClasses[size]} font-medium`}>
          {isFavorited ? 'Favorited' : 'Favorite'}
        </span>
      )}
    </button>
  );
};

export default FavoriteButton;