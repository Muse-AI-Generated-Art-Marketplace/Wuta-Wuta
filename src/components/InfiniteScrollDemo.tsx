import React, { useState } from 'react';
import GalleryInfiniteScroll from './GalleryInfiniteScroll';
import FavoritesPageOptimized from '../pages/FavoritesPageOptimized';
import { VirtualizedGrid, VirtualizedList, InfiniteScrollLoader, EndOfItemsIndicator } from './VirtualizedGrid';

/**
 * InfiniteScrollDemo - Comprehensive demo showcasing pagination optimization
 * 
 * Features demonstrated:
 * - Infinite scroll with virtualization
 * - Performance optimizations
 * - Loading states and error handling
 * - Responsive grid layouts
 * - Memory-efficient rendering
 */
const InfiniteScrollDemo = () => {
  const [activeDemo, setActiveDemo] = useState('gallery');

  // Generate mock data for testing
  const generateMockData = (count: number) => {
    return Array.from({ length: count }, (_, index) => ({
      id: `item-${index}`,
      title: `Artwork ${index + 1}`,
      creator: `Artist ${Math.floor(Math.random() * 100)}`,
      image: `https://picsum.photos/400/300?random=${index}`,
      prompt: `This is a sample prompt for artwork ${index + 1}`,
      aiModel: ['Stable Diffusion', 'DALL-E', 'Midjourney'][Math.floor(Math.random() * 3)],
      price: Math.random() > 0.5 ? (Math.random() * 10).toFixed(2) : null,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  };

  const mockData = generateMockData(1000);

  const renderMockItem = (item: any, index: number) => (
    <div
      key={item.id}
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
      <p className="text-sm text-gray-600 mb-2">{item.prompt}</p>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">{item.aiModel}</span>
        <span className="text-sm font-medium text-gray-900">
          {item.price ? `${item.price} ETH` : 'Not listed'}
        </span>
      </div>
    </div>
  );

  const renderListItem = (item: any, index: number) => (
    <div
      key={item.id}
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1 truncate">{item.title}</h3>
          <p className="text-sm text-gray-600 truncate">{item.prompt}</p>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">{item.aiModel}</span>
            <span className="text-sm font-medium text-gray-900">
              {item.price ? `${item.price} ETH` : 'Not listed'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Infinite Scroll & Virtualization Demo
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Experience optimized pagination with infinite scrolling and virtualization
              </p>
            </div>
          </div>

          {/* Demo Navigation */}
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveDemo('gallery')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeDemo === 'gallery'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Gallery (Real Data)
            </button>
            <button
              onClick={() => setActiveDemo('favorites')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeDemo === 'favorites'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Favorites (Real Data)
            </button>
            <button
              onClick={() => setActiveDemo('virtualized-grid')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeDemo === 'virtualized-grid'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Virtualized Grid (Mock Data)
            </button>
            <button
              onClick={() => setActiveDemo('virtualized-list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeDemo === 'virtualized-list'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Virtualized List (Mock Data)
            </button>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeDemo === 'gallery' && (
          <div>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Gallery with Infinite Scroll
              </h2>
              <p className="text-blue-800 dark:text-blue-200">
                Real marketplace data with infinite scrolling. Scroll down to load more artworks automatically.
              </p>
            </div>
            <GalleryInfiniteScroll />
          </div>
        )}

        {activeDemo === 'favorites' && (
          <div>
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
              <h2 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                Favorites with Infinite Scroll
              </h2>
              <p className="text-green-800 dark:text-green-200">
                User favorites and collections with optimized infinite scrolling.
              </p>
            </div>
            <FavoritesPageOptimized />
          </div>
        )}

        {activeDemo === 'virtualized-grid' && (
          <div>
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg dark:bg-purple-900/20 dark:border-purple-800">
              <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Virtualized Grid with Mock Data
              </h2>
              <p className="text-purple-800 dark:text-purple-200">
                1000 mock items with virtualization for optimal performance. Only visible items are rendered.
              </p>
            </div>
            <VirtualizedGrid
              items={mockData}
              renderItem={renderMockItem}
              itemsPerPage={20}
              columns={3}
              gap="1.5rem"
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              estimateHeight={400}
              overscan={3}
              threshold={0.1}
              rootMargin="200px"
              enabled={true}
              loadingComponent={<InfiniteScrollLoader message="Loading more items..." />}
              sentinelComponent={<div className="py-4 text-center text-sm text-gray-500">Loading more...</div>}
            />
          </div>
        )}

        {activeDemo === 'virtualized-list' && (
          <div>
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-900/20 dark:border-orange-800">
              <h2 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2">
                Virtualized List with Mock Data
              </h2>
              <p className="text-orange-800 dark:text-orange-200">
                1000 mock items in a single-column list layout with virtualization.
              </p>
            </div>
            <VirtualizedList
              items={mockData}
              renderItem={renderListItem}
              itemsPerPage={25}
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              estimateHeight={120}
              overscan={5}
              threshold={0.1}
              rootMargin="200px"
              enabled={true}
              loadingComponent={<InfiniteScrollLoader message="Loading more items..." />}
            />
          </div>
        )}
      </div>

      {/* Performance Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-800 dark:bg-gray-900 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Performance Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">🚀</div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Faster Loading</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Only loads what's visible
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">💾</div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Memory Efficient</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Virtualization reduces memory usage
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">📱</div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Mobile Optimized</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Better performance on all devices
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">♾️</div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Infinite Scroll</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Seamless browsing experience
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfiniteScrollDemo;
