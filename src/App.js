import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  Palette, 
  Sparkles, 
  Gallery, 
  Settings,
  User,
  Zap,
  Wallet
} from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CreateArt from './components/CreateArt';
import Gallery from './components/Gallery';
import UserProfile from './components/UserProfile';
import EvolutionLab from './components/EvolutionLab';
import MuseDAO from './components/MuseDAO';
import { useMuseStore } from './store/museStore';
import { useWalletStore } from './store/walletStore';
import './App.css';

const queryClient = new QueryClient();

const App = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { initializeMuse, isConnected } = useMuseStore();
  const { connectWallet, disconnectWallet, address } = useWalletStore();

  useEffect(() => {
    // Initialize Muse connection
    initializeMuse();
  }, [initializeMuse]);

  const navigation = [
    { id: 'create', name: 'Create Art', icon: Palette },
    { id: 'gallery', name: 'Gallery', icon: Gallery },
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'evolve', name: 'Evolution Lab', icon: Sparkles },
    { id: 'dao', name: 'Muse DAO', icon: Zap },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'create':
        return <CreateArt />;
      case 'gallery':
        return <Gallery />;
      case 'profile':
        return <UserProfile />;
      case 'evolve':
        return <EvolutionLab />;
      case 'dao':
        return <MuseDAO />;
      case 'settings':
        return <div>Settings</div>;
      default:
        return <CreateArt />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Toaster position="top-right" />
        
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onConnectWallet={connectWallet}
          onDisconnectWallet={disconnectWallet}
          address={address}
          isConnected={isConnected}
        />

        <div className="flex">
          <Sidebar 
            navigation={navigation}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isOpen={sidebarOpen}
          />

          <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="p-6"
            >
              {renderContent()}
            </motion.div>
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default App;
