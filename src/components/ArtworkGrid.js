import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Sparkles, TrendingUp } from 'lucide-react';
import FavoriteButton from './FavoriteButton';

// ---------------------------------------------------------------------------
// useLazyImage — fires once the card enters the viewport
// ---------------------------------------------------------------------------
function useLazyImage(src) {
  const ref = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { setInView(true); return; }

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !src) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) setIsLoaded(true); };
    img.src = src;
    return () => { cancelled = true; img.onload = null; };
  }, [inView, src]);

  return { ref, isLoaded };
}

// ---------------------------------------------------------------------------
// ArtCardSkeleton — shimmering placeholder while Stellar data loads
// ---------------------------------------------------------------------------
const ArtCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
    <div className="relative aspect-square overflow-hidden bg-gray-100 skeleton-shimmer" />
    <div className="p-4 space-y-3">
      <div className="h-4 rounded-lg bg-gray-100 skeleton-shimmer w-3/4" />
      <div className="flex items-center gap-2">
        <div className="h-3 rounded-md bg-gray-100 skeleton-shimmer w-1/3" />
        <div className="h-3 rounded-md bg-gray-100 skeleton-shimmer w-1/4" />
      </div>
      <div className="flex gap-2 pt-1">
        <div className="h-5 w-14 rounded-full bg-gray-100 skeleton-shimmer" />
        <div className="h-5 w-16 rounded-full bg-gray-100 skeleton-shimmer" />
        <div className="h-5 w-10 rounded-full bg-gray-100 skeleton-shimmer" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <div className="h-5 w-20 rounded-lg bg-gray-100 skeleton-shimmer" />
        <div className="h-8 w-24 rounded-xl bg-gray-100 skeleton-shimmer" />
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// ArtCard
// ---------------------------------------------------------------------------
const ArtCard = ({ artwork, listing, onBuyArtwork, onAnalyzeArtwork, address }) => {
  const isListed = !!listing;
  const isOwner = address && artwork.creator === address;
  const isVisionAnalyzed = artwork.metadata?.isVisionAnalyzed;

  const { ref, isLoaded } = useLazyImage(artwork.imageUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300"
    >
      {/* ── IMAGE (lazy) ── */}
      <div ref={ref} className="relative aspect-square overflow-hidden bg-gray-50">
        {artwork.imageUrl ? (
          <>
            {/* Shimmer shown until full image loads */}
            {!isLoaded && (
              <div className="absolute inset-0 skeleton-shimmer" />
            )}
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              loading="lazy"
              decoding="async"
              className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
                isLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
              }`}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Eye className="w-10 h-10" />
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {isVisionAnalyzed && (
            <span className="px-2 py-0.5 bg-purple-600/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI
            </span>
          )}
          {artwork.metadata?.canEvolve && (
            <span className="px-2 py-0.5 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Evolvable
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <FavoriteButton
            artworkId={artwork.id}
            artworkTitle={artwork.title}
            size="sm"
          />
        </div>

        {isOwner && !isVisionAnalyzed && (
          <button
            onClick={() => onAnalyzeArtwork(artwork.id)}
            className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-purple-600 text-xs font-bold rounded-xl shadow hover:bg-white transition-colors"
          >
            Analyze
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1">{artwork.title}</h3>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="truncate max-w-[120px]">
            {artwork.creator
              ? `${artwork.creator.slice(0, 6)}...${artwork.creator.slice(-4)}`
              : 'Unknown'}
          </span>
          {artwork.metadata?.aiModel && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium shrink-0">
              {artwork.metadata.aiModel}
            </span>
          )}
        </div>

        {artwork.metadata?.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {artwork.metadata.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 text-xs rounded-full border border-purple-100"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          {isListed ? (
            <span className="text-sm font-black text-gray-900">
              {listing.price} <span className="text-xs font-semibold text-gray-400">XLM</span>
            </span>
          ) : (
            <span className="text-xs text-gray-400 italic">Not listed</span>
          )}

          {isListed && !isOwner && (
            <button
              onClick={() => onBuyArtwork(artwork.id, listing.price)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-flow-primary to-flow-secondary text-white text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm shadow-purple-300"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Buy
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// ArtworkGrid
// ---------------------------------------------------------------------------
const SKELETON_COUNT = 8;

const ArtworkGrid = ({
  artworks = [],
  listings = [],
  onBuyArtwork,
  onAnalyzeArtwork,
  isLoading = false,
  address,
}) => {
  return (
    <>
      <style>{`
        @keyframes wuta-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            #f3f4f6 25%,
            #ede9fe 50%,
            #f3f4f6 75%
          );
          background-size: 600px 100%;
          animation: wuta-shimmer 1.6s ease-in-out infinite;
        }
      `}</style>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <ArtCardSkeleton key={`skeleton-${i}`} />
            ))
          : artworks.map(artwork => (
              <ArtCard
                key={artwork.id}
                artwork={artwork}
                listing={listings.find(l => l.tokenId === artwork.id)}
                onBuyArtwork={onBuyArtwork}
                onAnalyzeArtwork={onAnalyzeArtwork}
                address={address}
              />
            ))}
      </div>
    </>
  );
};

export default ArtworkGrid;
