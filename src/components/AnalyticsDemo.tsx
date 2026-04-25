import React, { useState, useEffect } from 'react';
import { 
  Activity, Users, Eye, Heart, ShoppingCart, TrendingUp, 
  BarChart3, PieChart, Filter, Search, Settings, Download,
  Play, Pause, RotateCcw, CheckCircle, AlertCircle
} from 'lucide-react';
import { useAnalytics, useInteractionTracker, useFormTracker, usePerformanceTracker } from '../hooks/useAnalytics';
import AnalyticsConsent from './AnalyticsConsent';
import AnalyticsDashboard from './AnalyticsDashboard';

/**
 * Analytics Demo Component - Comprehensive demonstration of analytics features
 * 
 * Features:
 * - Real-time event tracking demonstration
 * - User behavior simulation
 * - Performance metrics
 * - Consent management
 * - Dashboard preview
 */
const AnalyticsDemo = () => {
  const [activeTab, setActiveTab] = useState<'demo' | 'dashboard' | 'consent'>('demo');
  const [isTracking, setIsTracking] = useState(false);
  const [eventLog, setEventLog] = useState([]);
  const [mockData, setMockData] = useState({
    users: 0,
    pageViews: 0,
    purchases: 0,
    revenue: 0,
  });

  // Analytics hooks
  const { 
    trackEvent, 
    trackArtworkView, 
    trackArtworkFavorite, 
    trackArtworkPurchase,
    trackSearch,
    trackFilter,
    trackFormInteraction,
    trackError,
    identifyUser,
    getAnalyticsState
  } = useAnalytics();

  const { trackClick, trackHover, trackInteraction } = useInteractionTracker('demo');
  const { trackFieldFocus, trackFieldBlur, trackFieldChange, trackFormSubmit } = useFormTracker('demo_form');
  const { trackPageLoad, trackComponentRender, trackApiCall } = usePerformanceTracker();

  // Mock data generation
  const generateMockEvent = (type: string, data: any) => {
    const event = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      type,
      data,
      status: 'success'
    };
    return event;
  };

  // Simulate user behavior
  const simulateUserBehavior = async () => {
    setIsTracking(true);
    setEventLog([]);

    // Track page load
    trackPageLoad();
    addEventToLog('page_load', { page: '/demo', loadTime: 1200 });

    // Simulate artwork views
    const artworks = [
      { id: '1', title: 'Cosmic Dreams', price: 0.5 },
      { id: '2', title: 'Digital Sunset', price: 0.3 },
      { id: '3', title: 'Abstract Mind', price: 0.8 },
    ];

    for (let i = 0; i < 5; i++) {
      // Track artwork view
      const artwork = artworks[Math.floor(Math.random() * artworks.length)];
      trackArtworkView(artwork.id, artwork.title, 'demo_gallery');
      addEventToLog('artwork_view', artwork);

      await new Promise(resolve => setTimeout(resolve, 500));

      // Random favorite
      if (Math.random() > 0.5) {
        trackArtworkFavorite(artwork.id, artwork.title, true);
        addEventToLog('artwork_favorite', { ...artwork, action: 'favorite' });
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Simulate search
    trackSearch('abstract art', 12, { category: 'all' });
    addEventToLog('search', { query: 'abstract art', results: 12 });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate filter
    trackFilter('category', 'abstract', 8);
    addEventToLog('filter', { type: 'category', value: 'abstract', results: 8 });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate purchase
    const purchasedArtwork = artworks[0];
    trackArtworkPurchase(purchasedArtwork.id, purchasedArtwork.title, purchasedArtwork.price);
    addEventToLog('artwork_purchase', purchasedArtwork);

    // Update mock data
    setMockData(prev => ({
      users: prev.users + 1,
      pageViews: prev.pageViews + 5,
      purchases: prev.purchases + 1,
      revenue: prev.revenue + purchasedArtwork.price,
    }));

    setIsTracking(false);
  };

  const addEventToLog = (type: string, data: any) => {
    const event = generateMockEvent(type, data);
    setEventLog(prev => [event, ...prev].slice(0, 50)); // Keep last 50 events
  };

  // Track demo interactions
  const handleDemoClick = (action: string, data?: any) => {
    trackClick(action, data);
    addEventToLog('click', { action, data });
  };

  const handleDemoHover = (element: string, data?: any) => {
    trackHover(element, data);
    addEventToLog('hover', { element, data });
  };

  const handleDemoForm = (action: string, field?: string, value?: any) => {
    trackFormInteraction('demo_form', action, field);
    addEventToLog('form_interaction', { action, field, value });
  };

  // Clear event log
  const clearEventLog = () => {
    setEventLog([]);
  };

  // Reset mock data
  const resetMockData = () => {
    setMockData({
      users: 0,
      pageViews: 0,
      purchases: 0,
      revenue: 0,
    });
  };

  const renderDemo = () => (
    <div className="space-y-6">
      {/* Demo Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Analytics Demo Controls
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={simulateUserBehavior}
            disabled={isTracking}
            className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTracking ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Simulate User
              </>
            )}
          </button>

          <button
            onClick={clearEventLog}
            className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <RotateCcw className="w-4 h-4" />
            Clear Log
          </button>

          <button
            onClick={resetMockData}
            className="flex items-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Data
          </button>

          <button
            onClick={() => handleDemoClick('export_data')}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Mock Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-green-600 font-medium">+{mockData.users}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{mockData.users}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-green-600 font-medium">+{mockData.pageViews}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{mockData.pageViews}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Page Views</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-600 font-medium">+{mockData.purchases}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{mockData.purchases}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Purchases</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-green-600 font-medium">+{mockData.revenue}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{mockData.revenue.toFixed(2)}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Revenue (ETH)</p>
        </div>
      </div>

      {/* Interactive Demo Elements */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Interactive Demo Elements
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Artwork Cards */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Artwork Cards</h3>
            <div className="space-y-3">
              {[
                { id: '1', title: 'Cosmic Dreams', price: 0.5, views: 1234 },
                { id: '2', title: 'Digital Sunset', price: 0.3, views: 892 },
              ].map(artwork => (
                <div
                  key={artwork.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 transition-colors cursor-pointer"
                  onClick={() => handleDemoClick('artwork_card', { artworkId: artwork.id })}
                  onMouseEnter={() => handleDemoHover('artwork_card', { artworkId: artwork.id })}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{artwork.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{artwork.views} views</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-purple-600">{artwork.price} ETH</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDemoClick('favorite_button', { artworkId: artwork.id });
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Elements */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Form Elements</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search artworks..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:bg-gray-700"
                onFocus={() => handleDemoForm('field_focus', 'search')}
                onBlur={() => handleDemoForm('field_blur', 'search')}
                onChange={(e) => handleDemoForm('field_change', 'search', e.target.value)}
              />

              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:bg-gray-700"
                onFocus={() => handleDemoForm('field_focus', 'category')}
                onBlur={() => handleDemoForm('field_blur', 'category')}
                onChange={(e) => handleDemoForm('field_change', 'category', e.target.value)}
              >
                <option value="">Select Category</option>
                <option value="abstract">Abstract</option>
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>

              <button
                onClick={() => handleDemoForm('submit')}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Submit Form
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Event Log */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Event Log
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Activity className="w-4 h-4" />
            {eventLog.length} events
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {eventLog.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No events yet. Click "Simulate User" to see analytics in action.
            </p>
          ) : (
            eventLog.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {event.type === 'artwork_view' && <Eye className="w-4 h-4 text-blue-500" />}
                  {event.type === 'artwork_favorite' && <Heart className="w-4 h-4 text-red-500" />}
                  {event.type === 'artwork_purchase' && <ShoppingCart className="w-4 h-4 text-green-500" />}
                  {event.type === 'search' && <Search className="w-4 h-4 text-purple-500" />}
                  {event.type === 'filter' && <Filter className="w-4 h-4 text-orange-500" />}
                  {event.type === 'click' && <Activity className="w-4 h-4 text-gray-500" />}
                  {event.type === 'hover' && <Activity className="w-4 h-4 text-gray-400" />}
                  {event.type === 'form_interaction' && <Settings className="w-4 h-4 text-indigo-500" />}
                  {event.type === 'page_load' && <BarChart3 className="w-4 h-4 text-cyan-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {event.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-purple-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Analytics Demo</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('demo')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'demo'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Demo
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('consent')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'consent'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Consent
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'demo' && renderDemo()}
        {activeTab === 'dashboard' && <AnalyticsDashboard />}
        {activeTab === 'consent' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Privacy Consent Management
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This demonstrates the consent management system for analytics tracking.
              </p>
              <AnalyticsConsent showBanner={true} showSettingsButton={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDemo;
