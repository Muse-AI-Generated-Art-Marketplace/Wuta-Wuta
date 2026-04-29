import { useState, useEffect, useRef } from 'react';

export function useLazyImage({ src, placeholder = '', rootMargin = '200px', threshold = 0.01 } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  useEffect(() => {
    if (!inView || !src) return;

    let cancelled = false;
    const img = new Image();

    img.onload = () => { if (!cancelled) setIsLoaded(true); };
    img.onerror = () => { if (!cancelled) setIsError(true); };
    img.src = src;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [inView, src]);

  return { ref, currentSrc: isLoaded ? src : placeholder, isLoaded, isError };
            }
