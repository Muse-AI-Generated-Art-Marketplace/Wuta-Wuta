import React from 'react';
import { motion } from 'framer-motion';
import { Menu, Wallet, LogOut, Search, Sun, Moon } from 'lucide-react';

import { Button, Badge, Avatar } from './ui';
import CopyButton from './CopyButton';
import { useTheme } from '../contexts/ThemeContext';

const Header = ({ onMenuClick, onConnectWallet, onDisconnectWallet, address, isConnected, onOpenPalette }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 fixed w-full top-0 z-40 transition-all duration-300"
    >
      <div className="max-w-[100vw] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo and Menu toggle (mobile only) */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="md:hidden -ml-2 mr-2"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6 dark:text-gray-300" />
            </Button>
            <div className="flex items-center space-x-3 md:hidden">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-base">M</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Muse</h1>
            </div>

            {/* Desktop spacer */}
            <div className="hidden md:block w-64"></div>
          </div>

          {/* Right side tools */}
          <div className="flex items-center space-x-2 sm:space-x-3 ml-auto">

            {/* THEME TOGGLE BUTTON */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </Button>

            {/* Command Palette Trigger */}
            {onOpenPalette && (
              <>
                <button
                  onClick={onOpenPalette}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all text-sm font-medium group"
                >
                  <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-500" />
                  <span className="text-xs text-gray-400">Quick nav</span>
                  <kbd className="ml-1 px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-[10px] font-mono text-gray-400 shadow-sm">
                    ⌘K
                  </kbd>
                </button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenPalette}
                  className="sm:hidden p-2"
                >
                  <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </Button>
              </>
            )}

            {/* Network indicator */}
            <Badge variant="success" className="hidden sm:flex dark:bg-green-900/30 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Testnet
            </Badge>

            {/* Wallet Connection */}
            {isConnected && address ? (
              <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-1 pr-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Avatar
                  size="sm"
                  fallback="W"
                  className="w-8 h-8 sm:w-10 sm:h-10"
                />
                <div className="flex flex-col pr-2">
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium leading-tight">Connected</p>
                  <div className="flex items-center gap-1 group/address">
                    <p className="text-xs sm:text-sm font-mono font-bold text-gray-900 dark:text-white leading-tight">
                      {address?.slice ? `${address.slice(0, 4)}...${address.slice(-4)}` : 'Connecting...'}
                    </p>
                    <CopyButton text={address} className="opacity-0 group-hover/address:opacity-100 transition-opacity -my-1 -ml-1" />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDisconnectWallet}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 ml-1"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={onConnectWallet}
                className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg hover:shadow-purple-500/20 px-6"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
