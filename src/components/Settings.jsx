import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useWalletStore } from '../store/walletStore';

const Settings = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { address, isConnected, connectWallet, disconnectWallet, error, errorMessage, clearError } = useWalletStore();
  const [autoSync, setAutoSync] = useState(false);
  const [subscriptionEmail, setSubscriptionEmail] = useState('');
  const [defaultBlockchain, setDefaultBlockchain] = useState('stellar');

  return (
    <div data-testid="settings-page" className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 text-gray-900 dark:text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Configure your app preferences, theme, wallet, and blockchain options.</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">Appearance</h2>
          <p className="text-gray-600 dark:text-gray-300">Current theme: <strong>{theme}</strong></p>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 focus:outline-none"
          >
            Switch to {isDark ? 'light' : 'dark'} mode
          </button>
        </div>

        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">Wallet</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Status: <strong>{isConnected ? 'Connected' : 'Not connected'}</strong>
            {isConnected && address ? ` (${address})` : ''}
          </p>
          <div className="flex gap-2">
            {!isConnected && (
              <button
                onClick={connectWallet}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 focus:outline-none"
              >
                Connect Wallet
              </button>
            )}
            {isConnected && (
              <button
                onClick={disconnectWallet}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none"
              >
                Disconnect Wallet
              </button>
            )}
          </div>
          { (error || errorMessage) && (
            <div className="mt-3 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <strong className="block">Wallet connection error</strong>
                  <p className="text-sm mt-1">{(error && error.message) || errorMessage || 'An unknown error occurred while connecting your wallet.'}</p>
                  {error && error.helpUrl && (
                    <a href={error.helpUrl} target="_blank" rel="noreferrer" className="underline text-sm">Get help</a>
                  )}
                </div>
                <div>
                  <button onClick={clearError} className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-sm">Dismiss</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">General Settings</h2>
          <div className="flex items-center justify-between">
            <label htmlFor="auto-sync" className="text-gray-700 dark:text-gray-300">Automatic wallet sync</label>
            <input
              id="auto-sync"
              type="checkbox"
              checked={autoSync}
              onChange={() => setAutoSync((prev) => !prev)}
              className="accent-purple-600"
            />
          </div>

          <div>
            <label htmlFor="subscription-email" className="block text-gray-700 dark:text-gray-300 mb-1">Notification email</label>
            <input
              id="subscription-email"
              type="email"
              value={subscriptionEmail}
              onChange={(e) => setSubscriptionEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="default-blockchain" className="block text-gray-700 dark:text-gray-300 mb-1">Default blockchain</label>
            <select
              id="default-blockchain"
              value={defaultBlockchain}
              onChange={(e) => setDefaultBlockchain(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="stellar">Stellar (Testnet)</option>
              <option value="ethereum">Ethereum (Sepolia)</option>
              <option value="polygon">Polygon (Mumbai)</option>
            </select>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300">
            <p>Use the AI Studio and blockchain-specific settings from their dedicated screens.</p>
            <p>Auto-sync is currently <strong>{autoSync ? 'enabled' : 'disabled'}</strong>.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
