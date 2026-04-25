import React, { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, Image, PlusCircle, History, Sparkles, Settings as SettingsIcon, Send, Heart } from 'lucide-react';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MintingDashboard from './components/MintingDashboard';
import ArtMintingStepper from './components/ArtMintingStepper';
import Gallery from './components/Gallery';
import CreateArt from './components/CreateArt';
import Settings from './components/Settings';
import TransactionHistory from './components/TransactionHistory';
import FavoritesPage from './pages/FavoritesPage';
import ThemeProvider from './contexts/ThemeContext';
import { useWalletStore } from './store/walletStore';
import { useMuseStore } from './store/museStore';
import { NotificationContainer } from './components/ui/ToastNotification';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { 
    address, 
    isConnected, 
    connectWallet, 
    disconnectWallet, 
    checkConnection 
  } = useWalletStore();

  const { initializeMuse } = useMuseStore();

  // Initial setup
  useEffect(() => {
    const init = async () => {
      // Initialize theme
      const storedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldUseDark = storedTheme ? storedTheme === 'dark' : prefersDark;
      document.documentElement.classList.toggle('dark', shouldUseDark);

      // Check wallet connection
      await checkConnection();
      
      // Initialize Muse store
      await initializeMuse();
    };
    
    init();
  }, [checkConnection, initializeMuse]);

  const navigation = useMemo(
    () => [
      { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
      { id: 'favorites', name: 'Favorites', icon: Heart },
      { id: 'gallery', name: 'Gallery', icon: Image },
      { id: 'create', name: 'Create', icon: PlusCircle },
      { id: 'minting', name: 'Minting', icon: Send },
      { id: 'history', name: 'History', icon: History },
      { id: 'ai', name: 'AI Studio', icon: Sparkles },
      { id: 'settings', name: 'Settings', icon: SettingsIcon },
    ],
    []
  );

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
  };

  // Render main content based on activeTab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'favorites':
        return <FavoritesPage />;
      case 'minting':
        return <MintingDashboard />;
      case 'create':
        return <CreateArt />;
      case 'gallery':
        return <Gallery />;
      case 'ai':
        return <ArtMintingStepper />;
      case 'history':
        return <TransactionHistory />;
      case 'settings':
        return <Settings />;
      default:
        // Render Dashboard as fallback for unhandled tabs
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider>
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300">
      <NotificationContainer />
      <Header
        onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        address={address}
        isConnected={isConnected}
      />

      <div className="pt-16 sm:pt-20 md:flex">
        <Sidebar
          navigation={navigation}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0">
          {renderContent()}
        </main>
      </div>
    </div>
    </ThemeProvider>
  );
};

export default App;
