import React, { useState } from 'react';
import { 
  Vote, 
  Users, 
  Coins, 
  Activity,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-500 dark:text-gray-400 font-medium">{title}</h3>
      <div className={`p-3 rounded-full ${colorClass}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <div>
      <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const ProposalCard = ({ proposal }) => {
  const statusColors = {
    active: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
    passed: 'text-green-500 bg-green-50 dark:bg-green-900/30',
    rejected: 'text-red-500 bg-red-50 dark:bg-red-900/30'
  };

  const StatusIcon = {
    active: Clock,
    passed: CheckCircle2,
    rejected: XCircle
  }[proposal.status];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-semibold text-indigo-500">#{proposal.id}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusColors[proposal.status]}`}>
              <StatusIcon className="w-3 h-3" />
              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{proposal.title}</h3>
        </div>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-2">
        {proposal.description}
      </p>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">For</span>
            <span className="font-medium text-gray-900 dark:text-white">{proposal.votesFor}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${proposal.votesFor}%` }} />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Against</span>
            <span className="font-medium text-gray-900 dark:text-white">{proposal.votesAgainst}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${proposal.votesAgainst}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        {proposal.status === 'active' && (
          <>
            <button className="flex-1 py-2 px-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 font-semibold rounded-xl transition-colors duration-200">
              Vote For
            </button>
            <button className="flex-1 py-2 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-semibold rounded-xl transition-colors duration-200">
              Vote Against
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const MuseDAO = () => {
  const [activeTab, setActiveTab] = useState('proposals');

  // Mock data for demonstration
  const stats = [
    { title: 'Treasury Balance', value: '$2.4M', subtitle: '45,230 MUSE', icon: Coins, colorClass: 'bg-indigo-500' },
    { title: 'Total Members', value: '12,450', subtitle: '+124 this week', icon: Users, colorClass: 'bg-blue-500' },
    { title: 'Active Proposals', value: '3', subtitle: 'Requires voting', icon: Vote, colorClass: 'bg-green-500' },
    { title: 'Voting Participation', value: '64%', subtitle: 'Average turnout', icon: Activity, colorClass: 'bg-purple-500' },
  ];

  const proposals = [
    {
      id: '142',
      title: 'Integrate Layer 2 Scaling Solution',
      description: 'Proposal to integrate Arbitrum or Optimism to reduce minting fees for creators on the platform and improve transaction speeds.',
      status: 'active',
      votesFor: 75,
      votesAgainst: 25,
    },
    {
      id: '141',
      title: 'Q3 Creator Grants Program',
      description: 'Allocate 50,000 MUSE from the treasury to fund the upcoming Q3 creator grants program focusing on AI collaborative art.',
      status: 'active',
      votesFor: 92,
      votesAgainst: 8,
    },
    {
      id: '140',
      title: 'Update Protocol Fee Structure',
      description: 'Reduce the platform transaction fee from 2.5% to 2.0% to remain competitive with other emerging NFT marketplaces.',
      status: 'passed',
      votesFor: 88,
      votesAgainst: 12,
    },
    {
      id: '139',
      title: 'Partnership with AI Research Lab',
      description: 'Strategic partnership proposal to integrate advanced generative models from leading AI research laboratories directly into the platform.',
      status: 'rejected',
      votesFor: 34,
      votesAgainst: 66,
    }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 mb-2">
            Muse DAO
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Govern the future of the platform. Your voice, our direction.
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none transition-all duration-300 transform hover:-translate-y-1">
          <PlusCircle className="w-5 h-5" />
          Create Proposal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 mb-8 inline-flex shadow-sm border border-gray-100 dark:border-gray-700">
        {['proposals', 'treasury', 'members'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-300 ${
              activeTab === tab
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'proposals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}

      {activeTab !== 'proposals' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
          <div className="mx-auto w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 capitalize">{activeTab} Details</h3>
          <p className="text-gray-500 dark:text-gray-400">
            This module is currently under development. Check back later for updates.
          </p>
        </div>
      )}
    </div>
  );
};

export default MuseDAO;
