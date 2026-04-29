import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';

import FavoriteButton from '../FavoriteButton';

const formatAddress = (address = '') => {
  if (!address) return 'Unknown creator';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const GalleryCarousel = ({ artworks, onSelect, onPurchase }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % artworks.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + artworks.length) % artworks.length);
  };

  if (!artworks.length) return null;

  const currentArtwork = artworks[currentIndex];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      <div className="flex flex-col lg:flex-row gap-8 items-center">
        <div className="relative w-full lg:w-3/5 aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentArtwork.id}
              src={currentArtwork.image}
              alt={currentArtwork.title}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="h-full w-full object-cover"
            />
          </AnimatePresence>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
            <button 
              onClick={() => onSelect(currentArtwork)}
              className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-2xl font-bold self-start hover:bg-white/30 transition"
            >
              View Full Detail
            </button>
          </div>

          <div className="absolute right-6 top-6">
            <FavoriteButton 
              artworkId={currentArtwork.id} 
              artworkTitle={currentArtwork.title}
              size="lg"
            />
          </div>
          
          <div className="absolute left-6 top-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md border border-white/20">
              {currentArtwork.aiModel}
            </span>
            {currentArtwork.canEvolve && (
              <span className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                Evolvable
              </span>
            )}
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentArtwork.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                  {currentArtwork.title}
                </h2>
                <div className="mt-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                    Featured Artwork
                  </p>
                </div>
              </div>

              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed italic border-l-4 border-purple-200 dark:border-purple-800 pl-4">
                "{currentArtwork.prompt}"
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Creator</p>
                  <p className="mt-1 font-mono font-bold text-gray-900 dark:text-white">
                    {formatAddress(currentArtwork.creator)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Price</p>
                  <p className="mt-1 text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                    {currentArtwork.price !== null ? `${currentArtwork.price} ETH` : 'Not listed'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => onPurchase(currentArtwork)}
                  disabled={currentArtwork.price === null}
                  className="flex-1 inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-8 py-4 font-bold text-white shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Acquire Now
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
            <div className="flex gap-2">
              <button
                onClick={prev}
                className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-purple-600 hover:text-white transition-colors shadow-md"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={next}
                className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-purple-600 hover:text-white transition-colors shadow-md"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {currentIndex + 1} <span className="text-gray-400 font-normal">/ {artworks.length}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryCarousel;
