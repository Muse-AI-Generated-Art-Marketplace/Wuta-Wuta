import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Image as GalleryIcon,
  LayoutDashboard,
  Sparkles,
  User,
  History,
  ArrowRight,
  Command,
  X
} from 'lucide-react';

const NAV_ITEMS = [
  {
    id: 'gallery',
    label: 'Gallery',
    description: 'Explore & buy AI-human artwork',
    icon: GalleryIcon,
    shortcut: 'G',
    keywords: ['gallery', 'art', 'explore', 'browse', 'marketplace', 'buy', 'collect'],
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Stats, charts & analytics',
    icon: LayoutDashboard,
    shortcut: 'D',
    keywords: ['dashboard', 'stats', 'analytics', 'charts', 'overview', 'insights'],
  },
  {
    id: 'create',
    label: 'Mint Artwork',
    description: 'Create a new collaborative piece',
    icon: Sparkles,
    shortcut: 'M',
    keywords: ['mint', 'create', 'new', 'artwork', 'generate', 'ai', 'collaborate'],
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'View your collection and stats',
    icon: User,
    shortcut: 'P',
    keywords: ['profile', 'user', 'collection', 'account', 'settings', 'wallet'],
  },
  {
    id: 'transactions',
    label: 'Transactions',
    description: 'History of your marketplace activity',
    icon: History,
    shortcut: 'T',
    keywords: ['transactions', 'history', 'activity', 'sales', 'purchases', 'logs'],
  },
];

const CommandPalette = ({ isOpen, onClose, onNavigate, activeTab }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter items based on search query
  const filteredItems = NAV_ITEMS.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.keywords.some((kw) => kw.includes(q))
    );
  });

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Clamp selected index when filtered list changes
  useEffect(() => {
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems.length, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex];
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (tabId) => {
      onNavigate(tabId);
      onClose();
    },
    [onNavigate, onClose]
  );

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredItems.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            handleSelect(filteredItems[selectedIndex].id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        default:
          break;
      }
    },
    [isOpen, filteredItems, selectedIndex, handleSelect, onClose]
  );

  // Global Ctrl+K / Cmd+K listener is handled in App.js

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={onClose}
            data-testid="command-palette-backdrop"
          />

          {/* Palette Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 top-[15vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-[61]"
            role="dialog"
            aria-modal="true"
            aria-label="Command Palette"
            data-testid="command-palette"
          >
            <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 border border-gray-200 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center px-4 sm:px-5 border-b border-gray-100">
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Where do you want to go?"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  className="flex-1 py-4 px-3 text-base sm:text-lg bg-transparent outline-none placeholder-gray-400 text-gray-900 font-medium"
                  data-testid="command-palette-input"
                  autoComplete="off"
                />
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close palette"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Results */}
              <div
                ref={listRef}
                className="max-h-[50vh] overflow-y-auto py-2 px-2"
                role="listbox"
                aria-label="Navigation options"
              >
                {filteredItems.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No results found</p>
                  </div>
                ) : (
                  filteredItems.map((item, index) => {
                    const isActive = activeTab === item.id;
                    const isSelected = index === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(item.id)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl transition-all duration-100 group ${
                          isSelected
                            ? 'bg-gradient-to-r from-purple-50 to-blue-50 shadow-sm'
                            : 'hover:bg-gray-50'
                        }`}
                        data-testid={`command-item-${item.id}`}
                      >
                        {/* Icon */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-md shadow-purple-500/20'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* Label + Description */}
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm sm:text-base font-semibold truncate ${
                                isSelected ? 'text-purple-900' : 'text-gray-800'
                              }`}
                            >
                              {item.label}
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-600 shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>

                        {/* Shortcut Badge */}
                        <div
                          className={`hidden sm:flex items-center gap-1 shrink-0 ${
                            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'
                          } transition-opacity`}
                        >
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer Hints */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-t border-gray-100 bg-gray-50/80">
                <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-sm">↑↓</kbd>
                    navigate
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-sm">↵</kbd>
                    select
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-sm">esc</kbd>
                    close
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                  <Command className="w-3 h-3" />
                  <span>Muse</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
