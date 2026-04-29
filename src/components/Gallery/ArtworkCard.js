import React from 'react';
import { motion } from 'framer-motion';
import { Eye, ShoppingCart } from 'lucide-react';

import FavoriteButton from '../FavoriteButton';

const formatAddress = (address = '') => {
  if (!address) return 'Unknown creator';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatRelativeTime = (value) => {
  if (!value) return 'Unknown date';
  const timestamp = typeof value === 'number' ? value : new Date(value).getTime();
  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(seconds / 86400);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const ArtworkCard = ({ artwork, viewMode, onSelect, onPurchase }) => {
  const isList = viewMode === 'list';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 ${
        isList ? 'flex flex-col md:flex-row' : 'flex flex-col'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(artwork)}
        className={`block text-left ${isList ? 'w-full md:w-1/3' : 'w-full'}`}
      >
        <div className={`relative ${isList ? 'aspect-[4/3] md:aspect-square' : 'aspect-[4/3]'} overflow-hidden bg-gray-100 dark:bg-gray-800`}>
          {artwork.image ? (
            <img
              src={artwork.image}
              alt={artwork.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <Eye className="h-10 w-10" />
            </div>
          )}

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {artwork.aiModel}
            </span>
            {artwork.canEvolve && (
              <span className="rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white">
                Evolvable
              </span>
            )}
          </div>

          <div className="absolute right-4 top-4">
            <FavoriteButton 
              artworkId={artwork.id} 
              artworkTitle={artwork.title}
              size="sm"
            />
          </div>
        </div>
      </button>

      <div className={`flex flex-1 flex-col justify-between p-5 ${isList ? 'md:pl-6' : ''}`}>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{artwork.title}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formatRelativeTime(artwork.createdAt)}</p>
          </div>

          <p className={`${isList ? 'line-clamp-3' : 'line-clamp-2'} text-sm text-gray-600 dark:text-gray-300`}>
            {artwork.prompt}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-purple-50 px-3 py-1 font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              {artwork.humanContribution}% Human / {artwork.aiContribution}% AI
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {artwork.evolutionCount} Evolution{artwork.evolutionCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm dark:border-gray-800">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">Creator</p>
              <p className="font-mono font-semibold text-gray-900 dark:text-white">{formatAddress(artwork.creator)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-gray-400">Price</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {artwork.price !== null ? `${artwork.price} ETH` : 'Not listed'}
              </p>
            </div>
          </div>
        </div>

        <div className={`mt-5 border-t border-gray-100 pt-4 dark:border-gray-800 ${isList ? 'md:border-0 md:pt-0' : ''}`}>
          <button
            type="button"
            onClick={() => onPurchase(artwork)}
            disabled={artwork.price === null}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400"
          >
            <ShoppingCart className="h-4 w-4" />
            Buy Now
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default ArtworkCard;
