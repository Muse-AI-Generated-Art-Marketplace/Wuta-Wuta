/**
 * Analytics Service - Comprehensive tracking for user behavior, artwork interactions, and conversion metrics
 * 
 * Features:
 * - Event tracking with customizable properties
 * - Privacy controls and consent management
 * - Batch processing for performance
 * - Local storage fallback
 * - Multiple analytics providers support
 * - Real-time and batched event sending
 */

// Type definitions
export interface AnalyticsEvent {
  eventName: string;
  eventCategory: string;
  eventAction: string;
  eventLabel?: string;
  eventValue?: number;
  userId?: string;
  sessionId: string;
  timestamp: number;
  url: string;
  userAgent: string;
  properties?: Record<string, any>;
}

export interface UserProperties {
  userId?: string;
  walletAddress?: string;
  isFirstVisit: boolean;
  visitCount: number;
  lastVisit: number;
  browser: string;
  device: string;
  screenResolution: string;
  language: string;
  timezone: string;
  customProperties?: Record<string, any>;
}

export interface ConversionEvent {
  eventName: string;
  conversionType: 'artwork_creation' | 'artwork_purchase' | 'collection_creation' | 'user_registration';
  conversionValue?: number;
  currency?: string;
  artworkId?: string;
  collectionId?: string;
  userId?: string;
  timestamp: number;
  properties?: Record<string, any>;
}

export interface AnalyticsConfig {
  enabled: boolean;
  debugMode: boolean;
  batchSize: number;
  batchTimeout: number;
  maxRetries: number;
  consentRequired: boolean;
  providers: AnalyticsProvider[];
}

export interface AnalyticsProvider {
  name: string;
  enabled: boolean;
  initialize: () => Promise<void>;
  track: (event: AnalyticsEvent) => Promise<void>;
  identify: (userProperties: UserProperties) => Promise<void>;
  flush: () => Promise<void>;
}

export interface AnalyticsConsent {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: number;
  version: string;
}

/**
 * Core Analytics Service
 */
class AnalyticsService {
  private config: AnalyticsConfig;
  private consent: AnalyticsConsent | null = null;
  private sessionId: string;
  private userId: string | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private providers: Map<string, AnalyticsProvider> = new Map();

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enabled: true,
      debugMode: process.env.NODE_ENV === 'development',
      batchSize: 10,
      batchTimeout: 5000,
      maxRetries: 3,
      consentRequired: true,
      providers: [],
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.loadConsent();
    this.initializeProviders();
  }

  /**
   * Initialize the analytics service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || !this.config.enabled) {
      return;
    }

    try {
      // Wait for consent if required
      if (this.config.consentRequired && !this.hasConsent()) {
        this.log('Analytics initialization pending consent');
        return;
      }

      // Initialize all enabled providers
      for (const provider of this.config.providers) {
        if (provider.enabled) {
          try {
            await provider.initialize();
            this.providers.set(provider.name, provider);
            this.log(`Provider ${provider.name} initialized successfully`);
          } catch (error) {
            this.log(`Failed to initialize provider ${provider.name}:`, error);
          }
        }
      }

      // Start batch processing
      this.startBatchProcessor();
      
      // Track session start
      this.trackEvent('session_start', 'engagement', 'session_started', {
        sessionId: this.sessionId,
        timestamp: Date.now(),
      });

      this.isInitialized = true;
      this.log('Analytics service initialized successfully');
    } catch (error) {
      this.log('Failed to initialize analytics service:', error);
    }
  }

  /**
   * Track an analytics event
   */
  trackEvent(
    eventName: string,
    eventCategory: string,
    eventAction: string,
    eventLabel?: string,
    eventValue?: number,
    properties?: Record<string, any>
  ): void {
    if (!this.canTrack()) {
      return;
    }

    const event: AnalyticsEvent = {
      eventName,
      eventCategory,
      eventAction,
      eventLabel,
      eventValue,
      userId: this.userId || undefined,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      properties,
    };

    this.eventQueue.push(event);
    this.log('Event tracked:', event);

    // Process immediately if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flushEvents();
    }
  }

  /**
   * Track user behavior events
   */
  trackPageView(page: string, title?: string): void {
    this.trackEvent('page_view', 'navigation', 'page_viewed', page, undefined, {
      page,
      title: title || document.title,
      referrer: document.referrer,
    });
  }

  trackArtworkView(artworkId: string, artworkTitle: string, source: string = 'gallery'): void {
    this.trackEvent('artwork_view', 'engagement', 'artwork_viewed', artworkId, undefined, {
      artworkId,
      artworkTitle,
      source,
      timestamp: Date.now(),
    });
  }

  trackArtworkFavorite(artworkId: string, artworkTitle: string, isFavorited: boolean): void {
    this.trackEvent(
      'artwork_favorite',
      'engagement',
      isFavorited ? 'artwork_favorited' : 'artwork_unfavorited',
      artworkId,
      undefined,
      {
        artworkId,
        artworkTitle,
        action: isFavorited ? 'favorite' : 'unfavorite',
        timestamp: Date.now(),
      }
    );
  }

  trackArtworkPurchase(artworkId: string, artworkTitle: string, price: number, currency: string = 'ETH'): void {
    this.trackEvent('artwork_purchase', 'conversion', 'artwork_purchased', artworkId, price, {
      artworkId,
      artworkTitle,
      price,
      currency,
      timestamp: Date.now(),
    });

    // Track as conversion event
    this.trackConversion({
      eventName: 'artwork_purchase',
      conversionType: 'artwork_purchase',
      conversionValue: price,
      currency,
      artworkId,
      userId: this.userId || undefined,
      timestamp: Date.now(),
    });
  }

  trackArtworkCreation(artworkId: string, artworkTitle: string, aiModel: string, promptLength: number): void {
    this.trackEvent('artwork_creation', 'conversion', 'artwork_created', artworkId, undefined, {
      artworkId,
      artworkTitle,
      aiModel,
      promptLength,
      timestamp: Date.now(),
    });

    // Track as conversion event
    this.trackConversion({
      eventName: 'artwork_creation',
      conversionType: 'artwork_creation',
      artworkId,
      userId: this.userId || undefined,
      timestamp: Date.now(),
    });
  }

  trackCollectionCreation(collectionId: string, collectionName: string, isPublic: boolean): void {
    this.trackEvent('collection_creation', 'conversion', 'collection_created', collectionId, undefined, {
      collectionId,
      collectionName,
      isPublic,
      timestamp: Date.now(),
    });

    // Track as conversion event
    this.trackConversion({
      eventName: 'collection_creation',
      conversionType: 'collection_creation',
      collectionId,
      userId: this.userId || undefined,
      timestamp: Date.now(),
    });
  }

  trackSearch(query: string, resultsCount: number, filters?: Record<string, any>): void {
    this.trackEvent('search', 'engagement', 'search_performed', query, resultsCount, {
      query,
      resultsCount,
      filters,
      timestamp: Date.now(),
    });
  }

  trackFilter(filterType: string, filterValue: string, resultsCount: number): void {
    this.trackEvent('filter', 'engagement', 'filter_applied', filterType, resultsCount, {
      filterType,
      filterValue,
      resultsCount,
      timestamp: Date.now(),
    });
  }

  trackFormInteraction(formName: string, action: string, fieldName?: string): void {
    this.trackEvent('form_interaction', 'engagement', action, formName, undefined, {
      formName,
      action,
      fieldName,
      timestamp: Date.now(),
    });
  }

  trackError(error: Error, context?: string): void {
    this.trackEvent('error', 'system', 'error_occurred', error.name, undefined, {
      errorMessage: error.message,
      errorStack: error.stack,
      context,
      timestamp: Date.now(),
    });
  }

  /**
   * Track conversion events
   */
  private trackConversion(conversion: ConversionEvent): void {
    this.trackEvent(
      'conversion',
      'conversion',
      conversion.conversionType,
      conversion.eventName,
      conversion.conversionValue,
      {
        ...conversion,
        conversionType: conversion.conversionType,
      }
    );
  }

  /**
   * Identify user with properties
   */
  identifyUser(userProperties: Partial<UserProperties>): void {
    if (!this.canTrack()) {
      return;
    }

    const fullUserProperties: UserProperties = {
      userId: userProperties.userId || this.userId || undefined,
      walletAddress: userProperties.walletAddress,
      isFirstVisit: userProperties.isFirstVisit || false,
      visitCount: userProperties.visitCount || 1,
      lastVisit: userProperties.lastVisit || Date.now(),
      browser: userProperties.browser || this.getBrowser(),
      device: userProperties.device || this.getDevice(),
      screenResolution: userProperties.screenResolution || `${screen.width}x${screen.height}`,
      language: userProperties.language || navigator.language,
      timezone: userProperties.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      customProperties: userProperties.customProperties,
    };

    this.userId = fullUserProperties.userId || null;

    // Update all providers
    for (const provider of this.providers.values()) {
      try {
        provider.identify(fullUserProperties);
      } catch (error) {
        this.log(`Failed to identify user with provider ${provider.name}:`, error);
      }
    }

    this.log('User identified:', fullUserProperties);
  }

  /**
   * Consent management
   */
  setConsent(consent: AnalyticsConsent): void {
    this.consent = consent;
    this.saveConsent();

    if (consent.analytics && this.config.enabled && !this.isInitialized) {
      this.initialize();
    } else if (!consent.analytics && this.isInitialized) {
      this.disable();
    }
  }

  hasConsent(): boolean {
    return this.consent?.analytics === true;
  }

  private loadConsent(): void {
    try {
      const stored = localStorage.getItem('analytics_consent');
      if (stored) {
        this.consent = JSON.parse(stored);
      }
    } catch (error) {
      this.log('Failed to load consent:', error);
    }
  }

  private saveConsent(): void {
    if (this.consent) {
      try {
        localStorage.setItem('analytics_consent', JSON.stringify(this.consent));
      } catch (error) {
        this.log('Failed to save consent:', error);
      }
    }
  }

  /**
   * Batch processing
   */
  private startBatchProcessor(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    this.batchTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.config.batchTimeout);
  }

  async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = this.eventQueue.splice(0, this.config.batchSize);
    this.log(`Flushing ${events.length} events`);

    for (const provider of this.providers.values()) {
      try {
        await Promise.all(events.map(event => provider.track(event)));
      } catch (error) {
        this.log(`Failed to send events to provider ${provider.name}:`, error);
        // Re-add events to queue for retry
        this.eventQueue.unshift(...events);
      }
    }
  }

  /**
   * Disable analytics
   */
  disable(): void {
    this.isInitialized = false;
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    this.eventQueue = [];
    this.providers.clear();
    this.log('Analytics service disabled');
  }

  /**
   * Utility methods
   */
  private canTrack(): boolean {
    return this.config.enabled && this.isInitialized && this.hasConsent();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getDevice(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Mobile')) return 'Mobile';
    if (ua.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  }

  private initializeProviders(): void {
    // Providers will be initialized when the service is initialized
    this.log('Analytics providers configured');
  }

  private log(...args: any[]): void {
    if (this.config.debugMode) {
      console.log('[Analytics]', ...args);
    }
  }

  /**
   * Get current analytics state
   */
  getState(): {
    isInitialized: boolean;
    hasConsent: boolean;
    eventQueueSize: number;
    providersCount: number;
    sessionId: string;
    userId: string | null;
  } {
    return {
      isInitialized: this.isInitialized,
      hasConsent: this.hasConsent(),
      eventQueueSize: this.eventQueue.length,
      providersCount: this.providers.size,
      sessionId: this.sessionId,
      userId: this.userId,
    };
  }
}

// Create singleton instance
export const analyticsService = new AnalyticsService();

// Export types and utilities
export { AnalyticsService };
export type { AnalyticsEvent, UserProperties, ConversionEvent, AnalyticsConfig, AnalyticsProvider, AnalyticsConsent };
