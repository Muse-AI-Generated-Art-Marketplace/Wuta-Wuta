import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Palette, 
  User, 
  History,
  MessageSquare
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// Stores
import { useThemeStore } from './store/themeStore';
import { useWalletStore } from './store/walletStore';
import { useMuseStore } from './store/museStore';
import { useFlowStore } from './store/flowStore';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Gallery from './components/Gallery';
import CreateArt from './components/CreateArt';
import UserProfile from './components/UserProfile';
import TransactionHistory from './components/TransactionHistory';
import AiPrompt from './components/AiPrompt';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  const { theme } = useThemeStore();
  const { isConnected, address, connectWallet, disconnectWallet } = useWalletStore();
  const { initializeMuse } = useMuseStore();
  const { initializeFlow } = useFlowStore();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');

  // Navigation items
  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'gallery', name: 'Art Gallery', icon: ImageIcon },
    { id: 'create', name: 'Create Art', icon: Palette },
    { id: 'ai-chat', name: 'AI Assistant', icon: MessageSquare },
    { id: 'profile', name: 'My Profile', icon: User },
    { id: 'history', name: 'Transactions', icon: History },
  ];

  useEffect(() => {
    // Initialize stores
    initializeMuse();
    initializeFlow();
  }, [initializeMuse, initializeFlow]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'gallery':
        return <Gallery />;
      case 'create':
        return <CreateArt currentPrompt={currentPrompt} setCurrentPrompt={setCurrentPrompt} />;
      case 'ai-chat':
        return <AiPrompt onPromptSelect={(prompt) => {
          setCurrentPrompt(prompt);
          setActiveTab('create');
        }} />;
      case 'profile':
        return <UserProfile />;
      case 'history':
        return <TransactionHistory />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-500">
        <Toaster position="top-right" />
        
        {/* Navigation Sidebar */}
        <Sidebar 
          navigation={navigation} 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }} 
          isOpen={isSidebarOpen} 
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header 
            onMenuClick={toggleSidebar}
            onConnectWallet={connectWallet}
            onDisconnectWallet={disconnectWallet}
            address={address}
            isConnected={isConnected}
          />

          <main className="flex-1 overflow-y-auto pt-16 sm:pt-20">
            <ErrorBoundary>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
