import React from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Clock
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFlowStore } from '../store/flowStore';
import { Card, CardHeader, CardTitle, CardContent, Badge } from './ui';

const Dashboard = () => {
  const { stats, recentActivity, topProjects } = useFlowStore();

  // Mock data for demonstration
  const fundingData = [
    { name: 'Jan', amount: 4000, projects: 12 },
    { name: 'Feb', amount: 3000, projects: 15 },
    { name: 'Mar', amount: 5000, projects: 18 },
    { name: 'Apr', amount: 2780, projects: 22 },
    { name: 'May', amount: 6890, projects: 25 },
    { name: 'Jun', amount: 7390, projects: 30 },
  ];

  const contributorData = [
    { name: 'New Contributors', value: 400, color: '#8b5cf6' },
    { name: 'Active Contributors', value: 300, color: '#3b82f6' },
    { name: 'Top Contributors', value: 200, color: '#10b981' },
    { name: 'Inactive Contributors', value: 100, color: '#6b7280' },
  ];

  const recentTransactions = [
    { id: 1, from: '0x1234...5678', to: 'Project Alpha', amount: '0.5 ETH', time: '2 min ago', type: 'funding' },
    { id: 2, from: '0xabcd...efgh', to: 'Project Beta', amount: '1.2 ETH', time: '5 min ago', type: 'funding' },
    { id: 3, from: '0x9876...5432', to: 'Project Gamma', amount: '0.3 ETH', time: '12 min ago', type: 'funding' },
    { id: 4, from: 'Project Alpha', to: 'Contributor A', amount: '0.1 ETH', time: '15 min ago', type: 'distribution' },
    { id: 5, from: '0x5678...1234', to: 'Project Delta', amount: '2.0 ETH', time: '20 min ago', type: 'funding' },
  ];

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <Card hover>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">{value}</p>
            <div className="flex flex-wrap items-center mt-1 sm:mt-2">
              {change > 0 ? (
                <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mr-1" />
              )}
              <span className={`text-xs sm:text-sm font-medium ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(change)}%
              </span>
              <span className="text-xs text-gray-500 ml-1 hidden sm:inline">from last month</span>
            </div>
          </div>
          <div className={`p-2.5 sm:p-3 rounded-full ${color}`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Flow Analytics Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Real-time insights and analytics for Web3 funding streams</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Funding"
          value="$28,450"
          change={12.5}
          icon={DollarSign}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Contributors"
          value="1,234"
          change={8.2}
          icon={Users}
          color="bg-purple-500"
        />
        <StatCard
          title="Projects Funded"
          value="89"
          change={15.3}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          title="Transaction Volume"
          value="$45,678"
          change={-2.1}
          icon={Activity}
          color="bg-orange-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Funding Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Funding Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="h-[250px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fundingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} tickMargin={10} />
                  <YAxis fontSize={12} width={40} />
                  <Tooltip />
                  <Area type="monotone" dataKey="amount" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Contributor Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Contributor Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contributorData}
                  cx="50%"
                  cy="50%"
                  outerRadius={window.innerWidth < 640 ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {contributorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4 sm:mt-6">
              {contributorData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 shrink-0`} style={{ backgroundColor: item.color }} />
                  <span className="text-xs sm:text-sm text-gray-600 truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Top Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center min-w-0 mr-3">
                    <div className={`w-2 h-2 rounded-full mr-3 shrink-0 ${
                      transaction.type === 'funding' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{transaction.from}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">→ {transaction.to}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">{transaction.amount}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">{transaction.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Top Projects</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {[
              { name: 'DeFi Protocol', funding: '$12,500', contributors: 45, growth: '+23%' },
              { name: 'NFT Marketplace', funding: '$8,200', contributors: 32, growth: '+15%' },
              { name: 'DAO Tools', funding: '$6,800', contributors: 28, growth: '+8%' },
              { name: 'Web3 Gaming', funding: '$5,400', contributors: 21, growth: '+12%' },
              { name: 'Cross-chain Bridge', funding: '$4,900', contributors: 18, growth: '+5%' },
            ].map((project, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="min-w-0 mr-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{project.name}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">{project.contributors} contributors</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">{project.funding}</p>
                  <p className="text-[10px] sm:text-xs text-green-500 font-medium">{project.growth}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
