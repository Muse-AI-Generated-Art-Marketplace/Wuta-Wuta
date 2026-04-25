import React, { useState, useEffect } from 'react';
import { X, Shield, Cookie, Settings, Info } from 'lucide-react';
import { useAnalytics, AnalyticsConsent } from '../hooks/useAnalytics';

/**
 * Analytics Consent Management Component
 * 
 * Features:
 * - Cookie consent banner
 * - Privacy settings modal
 * - Granular consent options
 * - Accessibility support
 * - GDPR/CCPA compliant
 */

interface AnalyticsConsentProps {
  showBanner?: boolean;
  showSettingsButton?: boolean;
  position?: 'bottom' | 'top' | 'center';
  theme?: 'light' | 'dark' | 'auto';
}

const AnalyticsConsent: React.FC<AnalyticsConsentProps> = ({
  showBanner = true,
  showSettingsButton = true,
  position = 'bottom',
  theme = 'auto',
}) => {
  const { setConsent, hasConsent } = useAnalytics();
  const [showBanner, setShowBanner] = useState(showBanner);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsentState] = useState<AnalyticsConsent>({
    analytics: false,
    marketing: false,
    functional: true,
    timestamp: Date.now(),
    version: '1.0',
  });

  useEffect(() => {
    // Load existing consent
    const stored = localStorage.getItem('analytics_consent');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConsentState(parsed);
        if (parsed.analytics) {
          setShowBanner(false);
        }
      } catch (error) {
        console.error('Failed to parse consent:', error);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const newConsent: AnalyticsConsent = {
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: Date.now(),
      version: '1.0',
    };
    
    setConsentState(newConsent);
    setConsent(newConsent);
    setShowBanner(false);
  };

  const handleAcceptEssential = () => {
    const newConsent: AnalyticsConsent = {
      analytics: false,
      marketing: false,
      functional: true,
      timestamp: Date.now(),
      version: '1.0',
    };
    
    setConsentState(newConsent);
    setConsent(newConsent);
    setShowBanner(false);
  };

  const handleSaveSettings = () => {
    setConsent(consent);
    setShowSettings(false);
    setShowBanner(false);
  };

  const updateConsent = (category: keyof AnalyticsConsent, value: boolean) => {
    setConsentState(prev => ({
      ...prev,
      [category]: value,
      timestamp: Date.now(),
    }));
  };

  const getThemeClasses = () => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  const themeClasses = getThemeClasses();

  if (!showBanner && !showSettings) {
    return null;
  }

  return (
    <>
      {/* Consent Banner */}
      {showBanner && (
        <div
          className={`fixed inset-x-0 ${position === 'top' ? 'top-0' : position === 'center' ? 'top-1/2 transform -translate-y-1/2' : 'bottom-0'} z-50 p-4 ${
            themeClasses === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
          } border-t ${themeClasses === 'dark' ? 'border-gray-800' : 'border-gray-200'} shadow-lg`}
          role="dialog"
          aria-labelledby="consent-title"
          aria-describedby="consent-description"
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Icon and Content */}
              <div className="flex items-start gap-3 flex-1">
                <div className={`p-2 rounded-lg ${
                  themeClasses === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'
                }`}>
                  <Cookie className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 id="consent-title" className="font-semibold mb-1">
                    Privacy & Analytics
                  </h3>
                  <p id="consent-description" className="text-sm opacity-80">
                    We use analytics to understand how you interact with our marketplace and improve your experience. 
                    You can change your preferences at any time.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setShowSettings(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    themeClasses === 'dark' 
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Customize
                </button>
                <button
                  onClick={handleAcceptEssential}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    themeClasses === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Essential Only
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className={`w-full max-w-2xl rounded-2xl shadow-xl ${
              themeClasses === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
            }`}
            role="dialog"
            aria-labelledby="settings-title"
            aria-describedby="settings-description"
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              themeClasses === 'dark' ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  themeClasses === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'
                }`}>
                  <Settings className="w-5 h-5 text-purple-600" />
                </div>
                <h2 id="settings-title" className="text-xl font-semibold">
                  Privacy Settings
                </h2>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className={`p-2 rounded-lg transition-colors ${
                  themeClasses === 'dark' 
                    ? 'hover:bg-gray-800 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p id="settings-description" className="mb-6 text-sm opacity-80">
                Choose what data you'd like to share with us. You can change these settings at any time.
              </p>

              <div className="space-y-6">
                {/* Analytics Cookies */}
                <div className={`p-4 rounded-lg border ${
                  themeClasses === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="analytics"
                      checked={consent.analytics}
                      onChange={(e) => updateConsent('analytics', e.target.checked)}
                      className="mt-1 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="analytics" className="font-medium flex items-center gap-2">
                        Analytics Cookies
                        <Shield className="w-4 h-4 text-blue-500" />
                      </label>
                      <p className="text-sm opacity-70 mt-1">
                        Help us understand how you use our marketplace by collecting anonymous usage data. 
                        This helps us improve features and user experience.
                      </p>
                      <ul className="text-xs opacity-60 mt-2 space-y-1">
                        <li>• Page views and navigation patterns</li>
                        <li>• Artwork interaction data</li>
                        <li>• Search and filter usage</li>
                        <li>• Performance metrics</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className={`p-4 rounded-lg border ${
                  themeClasses === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="marketing"
                      checked={consent.marketing}
                      onChange={(e) => updateConsent('marketing', e.target.checked)}
                      className="mt-1 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="marketing" className="font-medium flex items-center gap-2">
                        Marketing Cookies
                      </label>
                      <p className="text-sm opacity-70 mt-1">
                        Allow us to show you personalized content and advertisements based on your interests.
                      </p>
                      <ul className="text-xs opacity-60 mt-2 space-y-1">
                        <li>• Personalized recommendations</li>
                        <li>• Targeted promotions</li>
                        <li>• Email marketing preferences</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className={`p-4 rounded-lg border ${
                  themeClasses === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="functional"
                      checked={consent.functional}
                      onChange={(e) => updateConsent('functional', e.target.checked)}
                      disabled={true}
                      className="mt-1 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <label htmlFor="functional" className="font-medium flex items-center gap-2">
                        Essential Cookies
                        <Info className="w-4 h-4 text-green-500" />
                      </label>
                      <p className="text-sm opacity-70 mt-1">
                        Required for the marketplace to function properly. These cannot be disabled.
                      </p>
                      <ul className="text-xs opacity-60 mt-2 space-y-1">
                        <li>• User authentication</li>
                        <li>• Shopping cart functionality</li>
                        <li>• Security features</li>
                        <li>• Basic site functionality</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Policy Link */}
              <div className={`mt-6 p-4 rounded-lg ${
                themeClasses === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
              }`}>
                <p className="text-sm">
                  <strong>Privacy Notice:</strong> We are committed to protecting your privacy. 
                  Read our{' '}
                  <a href="/privacy" className="text-purple-600 hover:underline">
                    Privacy Policy
                  </a>
                  {' '}and{' '}
                  <a href="/terms" className="text-purple-600 hover:underline">
                    Terms of Service
                  </a>
                  {' '}to learn more about how we handle your data.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className={`flex justify-end gap-3 p-6 border-t ${
              themeClasses === 'dark' ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setShowSettings(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  themeClasses === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Button (when banner is hidden) */}
      {showSettingsButton && !showBanner && (
        <button
          onClick={() => setShowSettings(true)}
          className={`fixed bottom-4 right-4 p-3 rounded-full shadow-lg transition-colors ${
            themeClasses === 'dark'
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              : 'bg-white hover:bg-gray-100 text-gray-700'
          } border ${themeClasses === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
          aria-label="Privacy settings"
        >
          <Cookie className="w-5 h-5" />
        </button>
      )}
    </>
  );
};

export default AnalyticsConsent;
