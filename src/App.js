import React, { useMemo, useState } from 'react';
import {
  Home,
  PlusCircle,
  Image,
  Sparkles,
  Users,
  ListChecks,
  Settings as SettingsIcon
} from 'lucide-react';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CreateArt from './components/CreateArt';
import Gallery from './components/Gallery';
import MuseDAO from './components/MuseDAO';
import TransactionHistory from './components/TransactionHistory';
import Settings from './components/Settings';
import EvolutionLab from './components/EvolutionLab';
import { NotificationContainer } from './components/ui/ToastNotification';
import { useStellarActivityFeed } from './hooks/useStellarActivityFeed';
import { useLiveEngine } from './hooks/useLiveEngine';

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: Home },
  { id: 'create', name: 'Create Art', icon: PlusCircle },
  { id: 'gallery', name: 'Gallery', icon: Image },
  { id: 'evolve', name: 'Evolution Lab', icon: Sparkles },
  { id: 'dao', name: 'Muse DAO', icon: Users },
  { id: 'transactions', name: 'Transactions', icon: ListChecks },
  { id: 'settings', name: 'Settings', icon: SettingsIcon }
];

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Activate real-time data feeds
  useStellarActivityFeed();
  useLiveEngine(process.env.REACT_APP_MUSE_CONTRACT_ADDRESS);

  const activeComponent = useMemo(() => {
    switch (activeTab) {
      case 'create':
        return <CreateArt />;
      case 'gallery':
        return <Gallery />;
      case 'evolve':
        return <EvolutionLab />;
      case 'dao':
        return <MuseDAO />;
      case 'transactions':
        return <TransactionHistory />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header onMenuClick={() => setIsSidebarOpen((current) => !current)} />

      <div className="pt-16 md:flex">
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

        <main className="flex-1 min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
          {activeComponent}
        </main>
      </div>

      <NotificationContainer />
    </div>
  );
};

export default App;
