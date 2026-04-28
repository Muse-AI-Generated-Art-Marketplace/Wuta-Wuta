import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { useActivityStore } from '../store/useActivityStore';
import { Card, CardHeader, CardTitle, CardContent } from './ui';
import { TrendingUp, Activity, BarChart3, Zap, ShoppingCart, Users, Layers, Globe } from 'lucide-react';

const MarketStats = () => {
  const priceUpdates = useActivityStore((state) => state.priceUpdates);
  const activities = useActivityStore((state) => state.activities);

  // Process price trend data
  const priceTrendData = useMemo(() => {
    if (priceUpdates.length === 0) {
      // Mock data if no real-time updates yet
      return [
        { time: '10:00', price: 0.45 },
        { time: '10:05', price: 0.48 },
        { time: '10:10', price: 0.42 },
        { time: '10:15', price: 0.51 },
        { time: '10:20', price: 0.49 },
        { time: '10:25', price: 0.55 },
      ];
    }

    return [...priceUpdates]
      .reverse()
      .slice(-10)
      .map(update => ({
        time: new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: update.currentPrice,
        tokenId: update.tokenId
      }));
  }, [priceUpdates]);

  // Process trading volume data (last 24h by hour)
  const volumeData = useMemo(() => {
    const trades = activities.filter(a => a.type === 'TRADE');
    if (trades.length === 0) {
      // Mock data
      return [
        { name: '00:00', volume: 1.2 },
        { name: '04:00', volume: 2.1 },
        { name: '08:00', volume: 1.5 },
        { name: '12:00', volume: 3.8 },
        { name: '16:00', volume: 2.9 },
        { name: '20:00', volume: 4.2 },
      ];
    }

    // In a real app, we'd group activities by time
    // For this demo, we'll just show the last few trades as volume bars
    return trades.slice(0, 10).map(t => ({
      name: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      volume: t.price || 0.1
    }));
  }, [activities]);

  const marketSummary = [
    { label: 'Floor Price', value: '0.45 ETH', change: '+5.2%', icon: ShoppingCart, color: 'text-purple-500', bg: 'bg-purple-50', sparkline: [0.4, 0.42, 0.41, 0.45, 0.44, 0.48, 0.45] },
    { label: 'Volume 24h', value: '12.8 ETH', change: '+12.5%', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50', sparkline: [10, 15, 8, 12, 18, 14, 20] },
    { label: 'Market Cap', value: '1,250 ETH', change: '+2.1%', icon: Globe, color: 'text-green-500', bg: 'bg-green-50', sparkline: [1200, 1210, 1220, 1215, 1230, 1245, 1250] },
    { label: 'Total Owners', value: '856', change: '+8', icon: Users, color: 'text-orange-500', bg: 'bg-orange-50', sparkline: [840, 842, 845, 848, 850, 852, 856] },
  ];

  return (
    <div className="space-y-6 mb-8">
      {/* Market Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {marketSummary.map((stat, i) => (
          <Card key={i} className="border-none shadow-md overflow-hidden group hover:shadow-lg transition-all">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-black text-gray-900">{stat.value}</p>
                  <span className={`text-[10px] font-bold ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className="flex-1 h-8 ml-auto min-w-[60px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stat.sparkline.map(v => ({ v }))}>
                    <Line 
                      type="monotone" 
                      dataKey="v" 
                      stroke={stat.change.startsWith('+') ? '#10b981' : '#ef4444'} 
                      strokeWidth={2} 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Real-time Price Trend */}
      <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-white to-purple-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
            Live Price Trend
          </CardTitle>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
            LIVE
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceTrendData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="time" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#94a3b8' }}
                  tickFormatter={(val) => `${val} ETH`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Trading Volume */}
      <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            Trading Volume
          </CardTitle>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">24h History</span>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="volume" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketStats;
