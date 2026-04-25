import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, Users, Eye, Heart, ShoppingCart, Filter, Search, 
  Calendar, Download, RefreshCw, Settings, Activity
} from 'lucide-react';

/**
 * Analytics Dashboard Component
 * 
 * Features:
 * - Real-time analytics visualization
 * - User behavior metrics
 * - Artwork interaction tracking
 * - Conversion metrics
 * - Performance monitoring
 * - Export functionality
 */

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalArtworks: number;
    totalPurchases: number;
    totalRevenue: number;
    avgSessionDuration: number;
    conversionRate: number;
  };
  userBehavior: {
    pageViews: Array<{ date: string; views: number; uniqueUsers: number }>;
    sessions: Array<{ date: string; sessions: number; duration: number }>;
    devices: Array<{ device: string; count: number; percentage: number }>;
    browsers: Array<{ browser: string; count: number; percentage: number }>;
  };
  artworkInteractions: {
    views: Array<{ date: string; views: number; favorites: number }>;
    topArtworks: Array<{ id: string; title: string; views: number; favorites: number; purchases: number }>;
    categories: Array<{ category: string; count: number }>;
  };
  conversions: {
    purchases: Array<{ date: string; count: number; revenue: number }>;
    artworkCreations: Array<{ date: string; count: number }>;
    collectionCreations: Array<{ date: string; count: number }>;
    funnel: Array<{ stage: string; count: number; conversionRate: number }>;
  };
  performance: {
    pageLoadTimes: Array<{ date: string; avgTime: number }>;
    apiResponseTimes: Array<{ endpoint: string; avgTime: number; requests: number }>;
    errorRates: Array<{ date: string; rate: number }>;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'artworks' | 'conversions' | 'performance'>('overview');

  // Mock data generator (in production, this would fetch from your analytics backend)
  const generateMockData = (): AnalyticsData => ({
    overview: {
      totalUsers: 12453,
      activeUsers: 3421,
      totalArtworks: 8934,
      totalPurchases: 1247,
      totalRevenue: 156.78,
      avgSessionDuration: 425,
      conversionRate: 3.2,
    },
    userBehavior: {
      pageViews: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 5000) + 2000,
        uniqueUsers: Math.floor(Math.random() * 2000) + 800,
      })),
      sessions: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sessions: Math.floor(Math.random() * 1000) + 400,
        duration: Math.floor(Math.random() * 600) + 180,
      })),
      devices: [
        { device: 'Desktop', count: 6845, percentage: 55 },
        { device: 'Mobile', count: 4321, percentage: 35 },
        { device: 'Tablet', count: 1287, percentage: 10 },
      ],
      browsers: [
        { browser: 'Chrome', count: 5234, percentage: 42 },
        { browser: 'Safari', count: 3742, percentage: 30 },
        { browser: 'Firefox', count: 2491, percentage: 20 },
        { browser: 'Other', count: 986, percentage: 8 },
      ],
    },
    artworkInteractions: {
      views: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 3000) + 1000,
        favorites: Math.floor(Math.random() * 500) + 200,
      })),
      topArtworks: [
        { id: '1', title: 'Cosmic Dreams', views: 1234, favorites: 89, purchases: 12 },
        { id: '2', title: 'Digital Sunset', views: 1089, favorites: 76, purchases: 8 },
        { id: '3', title: 'Abstract Mind', views: 987, favorites: 65, purchases: 6 },
        { id: '4', title: 'Neural Networks', views: 876, favorites: 54, purchases: 5 },
        { id: '5', title: 'Quantum Art', views: 765, favorites: 43, purchases: 4 },
      ],
      categories: [
        { category: 'Abstract', count: 3421 },
        { category: 'Landscape', count: 2876 },
        { category: 'Portrait', count: 1987 },
        { category: 'Digital Art', count: 1543 },
        { category: 'Other', count: 1107 },
      ],
    },
    conversions: {
      purchases: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        count: Math.floor(Math.random() * 20) + 5,
        revenue: Math.random() * 5 + 0.5,
      })),
      artworkCreations: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        count: Math.floor(Math.random() * 30) + 10,
      })),
      collectionCreations: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        count: Math.floor(Math.random() * 15) + 3,
      })),
      funnel: [
        { stage: 'Visitors', count: 12453, conversionRate: 100 },
        { stage: 'Artwork Views', count: 8934, conversionRate: 71.7 },
        { stage: 'Favorites', count: 2341, conversionRate: 18.8 },
        { stage: 'Purchase Intent', count: 567, conversionRate: 4.6 },
        { stage: 'Purchases', count: 1247, conversionRate: 10.0 },
      ],
    },
    performance: {
      pageLoadTimes: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        avgTime: Math.random() * 2000 + 1000,
      })),
      apiResponseTimes: [
        { endpoint: '/api/artworks', avgTime: 234, requests: 1234 },
        { endpoint: '/api/users', avgTime: 156, requests: 876 },
        { endpoint: '/api/purchases', avgTime: 445, requests: 234 },
        { endpoint: '/api/search', avgTime: 189, requests: 567 },
      ],
      errorRates: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        rate: Math.random() * 2 + 0.5,
      })),
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockData = generateMockData();
        setData(mockData);
      } catch (err) {
        setError('Failed to load analytics data');
        console.error('Analytics data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const handleExport = (format: 'csv' | 'json') => {
    if (!data) return;

    const exportData = JSON.stringify(data, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'No data available'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-green-600 font-medium">+12%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data.overview.totalUsers.toLocaleString()}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-green-600 font-medium">+8%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data.overview.totalArtworks.toLocaleString()}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Artworks</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-600 font-medium">+15%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data.overview.totalPurchases.toLocaleString()}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Purchases</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-green-600 font-medium">+5%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data.overview.conversionRate}%</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Page Views Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.userBehavior.pageViews}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="views" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
              <Area type="monotone" dataKey="uniqueUsers" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Device Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.userBehavior.devices}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ device, percentage }) => `${device}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.userBehavior.devices.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Session Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.userBehavior.sessions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sessions" stroke="#8b5cf6" />
              <Line type="monotone" dataKey="duration" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Browser Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.userBehavior.browsers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="browser" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderArtworks = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Artwork Interactions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.artworkInteractions.views}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="views" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
              <Area type="monotone" dataKey="favorites" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Artworks</h3>
          <div className="space-y-3">
            {data.artworkInteractions.topArtworks.map((artwork, index) => (
              <div key={artwork.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{artwork.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {artwork.views} views • {artwork.favorites} favorites • {artwork.purchases} purchases
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderConversions = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Purchase Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.conversions.purchases}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.conversions.funnel} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="stage" type="category" />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Page Load Times</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.performance.pageLoadTimes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="avgTime" stroke="#f59e0b" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">API Response Times</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.performance.apiResponseTimes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="endpoint" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgTime" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
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
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Date Range Selector */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
                  className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>

              {/* Export Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport('json')}
                  className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'artworks', label: 'Artworks', icon: Eye },
              { id: 'conversions', label: 'Conversions', icon: ShoppingCart },
              { id: 'performance', label: 'Performance', icon: TrendingUp },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'artworks' && renderArtworks()}
        {activeTab === 'conversions' && renderConversions()}
        {activeTab === 'performance' && renderPerformance()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
