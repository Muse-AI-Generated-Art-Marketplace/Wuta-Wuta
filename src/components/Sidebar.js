import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const Sidebar = ({ navigation, activeTab, onTabChange, isOpen }) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => onTabChange(activeTab)}
        />
      )}
      
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 lg:static lg:translate-x-0 lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Muse</h2>
              </div>
              <button
                onClick={() => onTabChange(activeTab)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-purple-100 text-purple-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-purple-700' : 'text-gray-500'}`} />
                  <span className={`font-medium ${isActive ? 'text-purple-700' : 'text-gray-900'}`}>
                    {item.name}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>Muse AI Art Marketplace</p>
              <p>© 2024 All rights reserved</p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
