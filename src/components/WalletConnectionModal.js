import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    X,
    CheckCircle,
    ExternalLink,
    ExternalLinkIcon,
    HelpCircle,
    Copy,
    LogOut,
    RefreshCw,
    Wallet2,
    AlertCircle
} from 'lucide-react';

import { useWalletStore } from '../store/walletStore';

import { Button, Modal, Badge, Avatar } from './ui';
import CopyButton from './CopyButton';

const WalletConnectionModal = ({ isOpen, onClose }) => {
    const {
        address,
        isConnected,
        isConnecting,
        network,
        error,
        connectWallet,
        disconnectWallet,
        clearError
    } = useWalletStore();

    const handleConnect = async () => {
        try {
            await connectWallet();
            // On connection success, close after delay
            setTimeout(() => {
                if (!error && !isConnecting) {
                    // onClose(); // Keep open to show connected state if needed
                }
            }, 1500);
        } catch (err) {
            console.error('Connection failed:', err);
        }
    };

    const handleDisconnect = () => {
        disconnectWallet();
        onClose();
    };

    const shortAddress = (address && typeof address === 'string' && address.slice)
        ? `${address.slice(0, 6)}...${address.slice(-6)}`
        : '';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isConnected ? "Wallet Details" : "Connect Wallet"}
            size="md"
        >
            <div className="space-y-6">
                {isConnected ? (
                    /* Connected State Content */
                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center space-y-4 py-4">
                            <div className="relative">
                                <Avatar
                                    size="lg"
                                    fallback={address && typeof address === 'string' ? address.slice(0, 2).toUpperCase() : 'W'}
                                    className="w-24 h-24 ring-4 ring-purple-100 dark:ring-purple-900/30 shadow-2xl"
                                />
                                <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white dark:border-gray-900 shadow-sm" />
                            </div>

                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                    Connected with Freighter
                                </h3>
                                <div className="flex items-center justify-center gap-2">
                                    <Badge variant="success" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        {network || 'Testnet'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</span>
                                <CopyButton text={address} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors" />
                            </div>
                            <div className="font-mono text-sm break-all text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                {address}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => window.open(`https://stellar.expert/explorer/testnet/account/${address}`, '_blank')}
                                className="w-full justify-center group"
                                aria-label="View wallet on Stellar explorer"
                            >
                                <ExternalLink className="w-4 h-4 mr-2 group-hover:text-purple-600 transition-colors" />
                                Explorer
                            </button>
                            <button
                                onClick={handleDisconnect}
                                className="w-full justify-center bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-900/20"
                                aria-label="Disconnect wallet"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Disconnect
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Disconnected State Content */
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Wallet2 className="w-8 h-8 text-purple-600" />
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">
                                Connect your Stellar wallet to start creating and trading collaborative AI art.
                            </p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl flex items-start gap-3"
                            >
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-red-800 dark:text-red-400">Connection Failed</p>
                                    <p className="text-xs text-red-600 dark:text-red-500">{error}</p>
                                </div>
                                <button
                                    onClick={clearError}
                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded ml-auto transition-colors"
                                    aria-label="Clear error message"
                                >
                                    <X className="w-4 h-4 text-red-400" />
                                </button>
                            </motion.div>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className={`
                  w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group
                  ${isConnecting ? 'bg-gray-50 border-gray-100 cursor-not-allowed' : 'bg-white hover:bg-purple-50 border-gray-100 hover:border-purple-200 dark:bg-gray-800/50 dark:border-gray-700 dark:hover:border-purple-500/30'}
                `}
                                aria-label="Connect Freighter wallet"
                                aria-describedby="freighter-desc"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800 group-hover:scale-110 transition-transform overflow-hidden">
                                        <img
                                            src="https://raw.githubusercontent.com/stellar/stellar-design-system/main/src/assets/logos/freighter.svg"
                                            alt="Freighter"
                                            className="w-7 h-7"
                                        />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-bold text-gray-900 dark:text-white">Freighter Wallet</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400" id="freighter-desc">Standard Stellar extension</p>
                                    </div>
                                </div>
                                {isConnecting ? (
                                    <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CheckCircle className="w-4 h-4 text-purple-600" />
                                    </div>
                                )}
                            </button>

                            <p className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4">
                                New to Stellar? <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline font-semibold">Get Freighter</a>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default WalletConnectionModal;
