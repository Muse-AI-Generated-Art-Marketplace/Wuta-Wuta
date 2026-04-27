import { useEffect, useRef, useCallback } from 'react';
import { analyticsService, AnalyticsEvent, UserProperties, AnalyticsConsent } from '../services/analyticsService';

/**
 * React hook for analytics integration
 * 
 * Features:
 * - Automatic page view tracking
 * - Event tracking with React-friendly API
 * - User identification
 * - Consent management
 * - Performance optimizations
 */

export interface UseAnalyticsOptions {
  autoTrackPageViews?: boolean;
  trackInteractions?: boolean;
  debounceMs?: number;
}

export interface AnalyticsEventData {
  eventName: string;
  eventCategory: string;
  eventAction: string;
  eventLabel?: string;
  eventValue?: number;
  properties?: Record<string, any>;
}

/**
 * Main analytics hook
 */
export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const {
    autoTrackPageViews = true,
    trackInteractions = true,
    debounceMs = 100,
  } = options;

  const debouncedEvents = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const previousPage = useRef<string>('');

  // Track page views automatically
  useEffect(() => {
    if (autoTrackPageViews) {
      const currentPage = window.location.pathname;
      
      if (currentPage !== previousPage.current) {
        analyticsService.trackPageView(currentPage, document.title);
        previousPage.current = currentPage;
      }
    }
  });

  // Cleanup debounced events on unmount
  useEffect(() => {
    return () => {
      debouncedEvents.current.forEach(timer => clearTimeout(timer));
      debouncedEvents.current.clear();
    };
  }, []);

  /**
   * Track analytics event with debouncing
   */
  const trackEvent = useCallback((
    eventName: string,
    eventCategory: string,
    eventAction: string,
    eventLabel?: string,
    eventValue?: number,
    properties?: Record<string, any>
  ) => {
    // Create unique key for debouncing
    const eventKey = `${eventName}_${eventCategory}_${eventAction}_${eventLabel || ''}`;
    
    // Clear existing timer
    const existingTimer = debouncedEvents.current.get(eventKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      analyticsService.trackEvent(eventName, eventCategory, eventAction, eventLabel, eventValue, properties);
      debouncedEvents.current.delete(eventKey);
    }, debounceMs);

    debouncedEvents.current.set(eventKey, timer);
  }, [debounceMs]);

  /**
   * Track artwork interactions
   */
  const trackArtworkView = useCallback((artworkId: string, artworkTitle: string, source?: string) => {
    analyticsService.trackArtworkView(artworkId, artworkTitle, source);
  }, []);

  const trackArtworkFavorite = useCallback((artworkId: string, artworkTitle: string, isFavorited: boolean) => {
    analyticsService.trackArtworkFavorite(artworkId, artworkTitle, isFavorited);
  }, []);

  const trackArtworkPurchase = useCallback((artworkId: string, artworkTitle: string, price: number, currency?: string) => {
    analyticsService.trackArtworkPurchase(artworkId, artworkTitle, price, currency);
  }, []);

  const trackArtworkCreation = useCallback((artworkId: string, artworkTitle: string, aiModel: string, promptLength: number) => {
    analyticsService.trackArtworkCreation(artworkId, artworkTitle, aiModel, promptLength);
  }, []);

  /**
   * Track collection interactions
   */
  const trackCollectionCreation = useCallback((collectionId: string, collectionName: string, isPublic: boolean) => {
    analyticsService.trackCollectionCreation(collectionId, collectionName, isPublic);
  }, []);

  /**
   * Track search and filter interactions
   */
  const trackSearch = useCallback((query: string, resultsCount: number, filters?: Record<string, any>) => {
    analyticsService.trackSearch(query, resultsCount, filters);
  }, []);

  const trackFilter = useCallback((filterType: string, filterValue: string, resultsCount: number) => {
    analyticsService.trackFilter(filterType, filterValue, resultsCount);
  }, []);

  /**
   * Track form interactions
   */
  const trackFormInteraction = useCallback((formName: string, action: string, fieldName?: string) => {
    analyticsService.trackFormInteraction(formName, action, fieldName);
  }, []);

  /**
   * Track errors
   */
  const trackError = useCallback((error: Error, context?: string) => {
    analyticsService.trackError(error, context);
  }, []);

  /**
   * User identification
   */
  const identifyUser = useCallback((userProperties: Partial<UserProperties>) => {
    analyticsService.identifyUser(userProperties);
  }, []);

  /**
   * Consent management
   */
  const setConsent = useCallback((consent: AnalyticsConsent) => {
    analyticsService.setConsent(consent);
  }, []);

  const hasConsent = useCallback(() => {
    return analyticsService.hasConsent();
  }, []);

  /**
   * Get analytics state
   */
  const getAnalyticsState = useCallback(() => {
    return analyticsService.getState();
  }, []);

  return {
    // Core tracking
    trackEvent,
    trackArtworkView,
    trackArtworkFavorite,
    trackArtworkPurchase,
    trackArtworkCreation,
    trackCollectionCreation,
    trackSearch,
    trackFilter,
    trackFormInteraction,
    trackError,

    // User management
    identifyUser,
    setConsent,
    hasConsent,

    // State
    getAnalyticsState,
  };
}

/**
 * Hook for tracking component interactions
 */
export function useInteractionTracker(componentName: string) {
  const { trackEvent } = useAnalytics();

  const trackInteraction = useCallback((
    action: string,
    target?: string,
    properties?: Record<string, any>
  ) => {
    trackEvent(
      `${componentName}_interaction`,
      'engagement',
      action,
      target,
      undefined,
      {
        component: componentName,
        target,
        ...properties,
      }
    );
  }, [trackEvent, componentName]);

  const trackClick = useCallback((target: string, properties?: Record<string, any>) => {
    trackInteraction('click', target, properties);
  }, [trackInteraction]);

  const trackHover = useCallback((target: string, properties?: Record<string, any>) => {
    trackInteraction('hover', target, properties);
  }, [trackInteraction]);

  const trackFocus = useCallback((target: string, properties?: Record<string, any>) => {
    trackInteraction('focus', target, properties);
  }, [trackInteraction]);

  return {
    trackInteraction,
    trackClick,
    trackHover,
    trackFocus,
  };
}

/**
 * Hook for tracking form events
 */
export function useFormTracker(formName: string) {
  const { trackFormInteraction, trackError } = useAnalytics();

  const trackFieldFocus = useCallback((fieldName: string) => {
    trackFormInteraction(formName, 'field_focus', fieldName);
  }, [trackFormInteraction, formName]);

  const trackFieldBlur = useCallback((fieldName: string, value: any) => {
    trackFormInteraction(formName, 'field_blur', fieldName, { value });
  }, [trackFormInteraction, formName]);

  const trackFieldChange = useCallback((fieldName: string, value: any) => {
    trackFormInteraction(formName, 'field_change', fieldName, { value });
  }, [trackFormInteraction, formName]);

  const trackFormSubmit = useCallback((success: boolean, errors?: Record<string, string>) => {
    trackFormInteraction(formName, success ? 'form_submit_success' : 'form_submit_error', undefined, { errors });
  }, [trackFormInteraction, formName]);

  const trackFormValidation = useCallback((fieldName: string, isValid: boolean, errorMessage?: string) => {
    trackFormInteraction(formName, 'field_validation', fieldName, { isValid, errorMessage });
  }, [trackFormInteraction, formName]);

  const trackFormError = useCallback((error: Error) => {
    trackError(error, `${formName}_submission`);
  }, [trackError, formName]);

  return {
    trackFieldFocus,
    trackFieldBlur,
    trackFieldChange,
    trackFormSubmit,
    trackFormValidation,
    trackFormError,
  };
}

/**
 * Hook for tracking artwork lifecycle
 */
export function useArtworkTracker() {
  const { 
    trackArtworkView, 
    trackArtworkFavorite, 
    trackArtworkPurchase, 
    trackArtworkCreation 
  } = useAnalytics();

  const trackView = useCallback((artworkId: string, artworkTitle: string, source?: string) => {
    trackArtworkView(artworkId, artworkTitle, source);
  }, [trackArtworkView]);

  const trackFavorite = useCallback((artworkId: string, artworkTitle: string, isFavorited: boolean) => {
    trackArtworkFavorite(artworkId, artworkTitle, isFavorited);
  }, [trackArtworkFavorite]);

  const trackPurchase = useCallback((artworkId: string, artworkTitle: string, price: number, currency?: string) => {
    trackArtworkPurchase(artworkId, artworkTitle, price, currency);
  }, [trackArtworkPurchase]);

  const trackCreation = useCallback((artworkId: string, artworkTitle: string, aiModel: string, promptLength: number) => {
    trackArtworkCreation(artworkId, artworkTitle, aiModel, promptLength);
  }, [trackArtworkCreation]);

  return {
    trackView,
    trackFavorite,
    trackPurchase,
    trackCreation,
  };
}

/**
 * Hook for tracking performance metrics
 */
export function usePerformanceTracker() {
  const { trackEvent } = useAnalytics();

  const trackPageLoad = useCallback(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      trackEvent('page_load', 'performance', 'page_loaded', undefined, navigation.loadEventEnd - navigation.loadEventStart, {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: navigation.responseEnd - navigation.requestStart,
        totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
      });
    }
  }, [trackEvent]);

  const trackComponentRender = useCallback((componentName: string, renderTime: number) => {
    trackEvent('component_render', 'performance', 'component_rendered', componentName, renderTime, {
      componentName,
      renderTime,
    });
  }, [trackEvent]);

  const trackApiCall = useCallback((endpoint: string, duration: number, success: boolean) => {
    trackEvent('api_call', 'performance', success ? 'api_success' : 'api_error', endpoint, duration, {
      endpoint,
      duration,
      success,
    });
  }, [trackEvent]);

  return {
    trackPageLoad,
    trackComponentRender,
    trackApiCall,
  };
}

/**
 * Hook for A/B testing integration
 */
export function useABTest(testName: string) {
  const { trackEvent } = useAnalytics();

  const trackVariation = useCallback((variation: string, properties?: Record<string, any>) => {
    trackEvent('ab_test', 'experiment', 'variation_assigned', testName, undefined, {
      testName,
      variation,
      ...properties,
    });
  }, [trackEvent, testName]);

  const trackConversion = useCallback((variation: string, conversionType: string, value?: number) => {
    trackEvent('ab_test_conversion', 'conversion', 'conversion_occurred', testName, value, {
      testName,
      variation,
      conversionType,
    });
  }, [trackEvent, testName]);

  return {
    trackVariation,
    trackConversion,
  };
}

export default useAnalytics;
