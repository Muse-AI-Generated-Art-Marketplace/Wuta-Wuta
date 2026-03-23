import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Copy, 
  Wand2,
  History,
  X
} from 'lucide-react';

const PromptHistorySidebar = ({ onRegeneratePrompt, currentPrompt }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [promptHistory, setPromptHistory] = useState([]);
  const [hoveredPrompt, setHoveredPrompt] = useState(null);

  // Load prompt history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('promptHistory');
    if (savedHistory) {
      try {
        setPromptHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading prompt history:', error);
      }
    }
  }, []);

  // Save prompt history to localStorage whenever it changes
  useEffect(() => {
    if (promptHistory.length > 0) {
      localStorage.setItem('promptHistory', JSON.stringify(promptHistory));
    }
  }, [promptHistory]);

  // Add current prompt to history when it changes
  const addToHistory = (prompt) => {
    if (!prompt || prompt.trim() === '') return;
    
    const newPromptEntry = {
      id: Date.now(),
      text: prompt.trim(),
      timestamp: new Date().toISOString(),
      usageCount: 0
    };

    setPromptHistory(prev => {
      // Remove duplicates and add new prompt to the beginning
      const filtered = prev.filter(p => p.text !== prompt.trim());
      const updated = [newPromptEntry, ...filtered].slice(0, 50); // Keep only last 50 prompts
      return updated;
    });
  };

  // Monitor current prompt changes and add to history
  useEffect(() => {
    if (currentPrompt && currentPrompt.trim() !== '') {
      const timeoutId = setTimeout(() => {
        addToHistory(currentPrompt);
      }, 1000); // Add to history after user stops typing for 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [currentPrompt]);

  const handleRegenerate = (promptText) => {
    // Increment usage count
    setPromptHistory(prev => 
      prev.map(p => 
        p.text === promptText 
          ? { ...p, usageCount: p.usageCount + 1 }
          : p
      )
    );
    
    if (onRegeneratePrompt) {
      onRegeneratePrompt(promptText);
    }
  };

  const handleCopy = (promptText) => {
    navigator.clipboard.writeText(promptText);
  };

  const handleDelete = (promptId) => {
    setPromptHistory(prev => prev.filter(p => p.id !== promptId));
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all prompt history?')) {
      setPromptHistory([]);
      localStorage.removeItem('promptHistory');
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative bg-white border-l border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-12' : 'w-80'
    }`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3 top-6 z-10 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-600" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-600" />
        )}
      </button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <History className="w-4 h-4 text-purple-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">Prompt History</h3>
                </div>
                {promptHistory.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {promptHistory.length} recent prompts
              </p>
            </div>

            {/* Prompt List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {promptHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No prompts yet</p>
                  <p className="text-xs text-gray-400 mt-1">Your recent prompts will appear here</p>
                </div>
              ) : (
                promptHistory.map((prompt) => (
                  <motion.div
                    key={prompt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="group relative"
                    onMouseEnter={() => setHoveredPrompt(prompt.id)}
                    onMouseLeave={() => setHoveredPrompt(null)}
                  >
                    <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                         onClick={() => handleRegenerate(prompt.text)}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 mr-2">
                          <p className="text-sm text-gray-900 line-clamp-2 leading-relaxed">
                            {prompt.text}
                          </p>
                        </div>
                        {hoveredPrompt === prompt.id && (
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(prompt.text);
                              }}
                              className="p-1 hover:bg-white rounded transition-colors"
                              title="Copy prompt"
                            >
                              <Copy className="w-3 h-3 text-gray-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRegenerate(prompt.text);
                              }}
                              className="p-1 hover:bg-white rounded transition-colors"
                              title="Regenerate"
                            >
                              <Wand2 className="w-3 h-3 text-purple-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(prompt.id);
                              }}
                              className="p-1 hover:bg-white rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3 text-red-600" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatDate(prompt.timestamp)}
                        </span>
                        {prompt.usageCount > 0 && (
                          <span className="text-xs text-purple-600 font-medium">
                            Used {prompt.usageCount}x
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                Prompts are stored locally in your browser
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed State Icon */}
      {isCollapsed && (
        <div className="h-full flex items-center justify-center">
          <History className="w-4 h-4 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default PromptHistorySidebar;
