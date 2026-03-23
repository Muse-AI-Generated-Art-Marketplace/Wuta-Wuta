import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PromptHistorySidebar from './components/PromptHistorySidebar';
import CreateArt from './components/CreateArt';
import Gallery from './components/Gallery';
import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import TransactionHistory from './components/TransactionHistory';
import PageTransition from './components/PageTransition';
import './index.css';

const App = () => {
  const [activeView, setActiveView] = useState('create');
  const [currentPrompt, setCurrentPrompt] = useState('');

  const handleRegeneratePrompt = (promptText) => {
    setCurrentPrompt(promptText);
    setActiveView('create');
  };

  const getTransitionType = (view) => {
  switch (view) {
    case 'create':
      return 'fade';
    case 'gallery':
      return 'slide';
    case 'dashboard':
      return 'slide';
    case 'profile':
      return 'fade';
    case 'transactions':
      return 'slide';
    default:
      return 'slide';
  }
};

const renderMainContent = () => {
    switch (activeView) {
      case 'create':
        return <CreateArt currentPrompt={currentPrompt} setCurrentPrompt={setCurrentPrompt} />;
      case 'gallery':
        return <Gallery />;
      case 'dashboard':
        return <Dashboard />;
      case 'profile':
        return <UserProfile />;
      case 'transactions':
        return <TransactionHistory />;
      default:
        return <CreateArt currentPrompt={currentPrompt} setCurrentPrompt={setCurrentPrompt} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Sidebar */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header 
          onMenuClick={() => {}}
          onConnectWallet={() => {}}
          onDisconnectWallet={() => {}}
          address="0x1234...5678"
          isConnected={true}
        />
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              <PageTransition 
                location={activeView} 
                transitionType={getTransitionType(activeView)}
              >
                {renderMainContent()}
              </PageTransition>
            </div>
            
            {/* Prompt History Sidebar - only show on create view */}
            {activeView === 'create' && (
              <PromptHistorySidebar 
                onRegeneratePrompt={handleRegeneratePrompt}
                currentPrompt={currentPrompt}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
