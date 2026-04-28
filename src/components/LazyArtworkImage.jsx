import React, { useEffect } from 'react';
import { useLazyImage } from '../hooks/useLazyImage';
import './LazyArtworkImage.css';

export default function LazyArtworkImage({
  src,
  placeholder = '',
  alt,
  aspectRatio = '1 / 1',
  className = '',
  rootMargin = '200px',
  onLoad,
  onError,
}) {
  const { ref, currentSrc, isLoaded, isError } = useLazyImage({ src, placeholder, rootMargin });

  useEffect(() => { if (isLoaded && onLoad) onLoad(); }, [isLoaded]);
  useEffect(() => { if (isError && onError) onError(); }, [isError]);

  return (
    <div
      ref={ref}
      className={`lazy-artwork-wrapper ${className}`}
      style={{ aspectRatio }}
      aria-busy={!isLoaded}
      role="img"
      aria-label={alt}
    >
      {!currentSrc && !isError && (
        <div className="lazy-artwork-skeleton" aria-hidden="true" />
      )}

      {isError && (
        <div className="lazy-artwork-error" aria-label="Image failed to load">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </div>
      )}

      {currentSrc && !isError && (
        <img
          src={currentSrc}
          alt={alt}
          className={`lazy-artwork-img ${isLoaded ? 'is-loaded' : 'is-placeholder'}`}
          draggable={false}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}
