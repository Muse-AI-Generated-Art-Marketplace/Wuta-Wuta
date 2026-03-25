import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Image as GalleryIcon,
    LayoutDashboard,
    Sparkles,
    User,
    History,
    FileText
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Gallery from './components/Gallery';
import Dashboard from './components/Dashboard';
import CreateArt from './components/CreateArt';
import UserProfile from './components/UserProfile';
import TransactionHistory from './components/TransactionHistory';
import PromptHistorySidebar from './components/PromptHistorySidebar';
import CommandPalette from './components/CommandPalette';
import MobileBottomNav from './components/MobileBottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import WalletConnectionModal from './components/WalletConnectionModal';
import { useWalletStore } from './store/walletStore';

const navigation = [
    { id: 'gallery', name: 'Gallery', icon: GalleryIcon },
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', name: 'Create Art', icon: Sparkles },
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'transactions', name: 'Transactions', icon: History },
];

const App = () => {
    const [activeTab, setActiveTab] = useState('gallery');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState('');
    const [isPromptHistoryOpen, setIsPromptHistoryOpen] = useState(false);

    const { address, isConnected, checkConnection, disconnectWallet } = useWalletStore();

    // Wallet Persistence Watcher
    useEffect(() => {
        const initWallet = async () => {
            if (localStorage.getItem('walletConnected') === 'true') {
                await checkConnection();
            }
        };
        initWallet();
    }, [checkConnection]);

    // Global Ctrl+K / Cmd+K listener
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsPaletteOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    const handleTabChange = useCallback((tabId) => {
        setActiveTab(tabId);
        setIsSidebarOpen(false);
    }, []);

    const handleOpenPalette = useCallback(() => {
        setIsPaletteOpen(true);
    }, []);

    const handleClosePalette = useCallback(() => {
        setIsPaletteOpen(false);
    }, []);

    const handleMenuClick = useCallback(() => {
        setIsSidebarOpen((prev) => !prev);
    }, []);

    const handleCloseSidebar = useCallback(() => {
        setIsSidebarOpen(false);
    }, []);

    const handleOpenWalletModal = useCallback(() => {
        setIsWalletModalOpen(true);
    }, []);

    const handleCloseWalletModal = useCallback(() => {
        setIsWalletModalOpen(false);
    }, []);

    const renderPage = () => {
        switch (activeTab) {
            case 'gallery':
                return <Gallery />;
            case 'dashboard':
                return <Dashboard />;
            case 'create':
                return (
                    <CreateArt
                        currentPrompt={currentPrompt}
                        setCurrentPrompt={setCurrentPrompt}
                    />
                );
            case 'profile':
                return <UserProfile />;
            case 'transactions':
                return <TransactionHistory />;
            default:
                return <Gallery />;
        }
    };

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <Toaster position="top-right" />

                {/* Header */}
                <Header
                    onMenuClick={handleMenuClick}
                    onConnectWallet={handleOpenWalletModal}
                    onDisconnectWallet={disconnectWallet}
                    address={address}
                    isConnected={isConnected}
                    onOpenPalette={handleOpenPalette}
                />

                <div className="flex pt-16 sm:pt-20">
                    {/* Sidebar */}
                    <Sidebar
                        navigation={navigation}
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        isOpen={isSidebarOpen}
                        onClose={handleCloseSidebar}
                    />

                    {/* Main Content */}
                    <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderPage()}
                            </motion.div>
                        </AnimatePresence>
                    </main>

                    {/* Prompt History Sidebar */}
                    {activeTab === 'create' && (
                        <PromptHistorySidebar
                            isOpen={isPromptHistoryOpen}
                            onClose={() => setIsPromptHistoryOpen(false)}
                            onSelectPrompt={(prompt) => setCurrentPrompt(prompt)}
                        />
                    )}
                </div>

                {/* Mobile Bottom Nav */}
                <MobileBottomNav
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    onOpenPalette={handleOpenPalette}
                />

                {/* Command Palette */}
                <CommandPalette
                    isOpen={isPaletteOpen}
                    onClose={handleClosePalette}
                    onNavigate={handleTabChange}
                    activeTab={activeTab}
                />

                {/* Wallet Connection Modal */}
                <WalletConnectionModal
                    isOpen={isWalletModalOpen}
                    onClose={handleCloseWalletModal}
                />
            </div>
        </ErrorBoundary>
    );
};

export default App;
