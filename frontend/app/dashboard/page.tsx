"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  Plus, 
  TrendingUp, 
  Wallet,
  Activity,
  Bitcoin,
  RefreshCw,
  Loader2
} from "lucide-react";
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

interface Stream {
  _id: string;
  recipient: string;
  totalAmount: number;
  streamedAmount: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  startDate: string;
  description: string;
  streamRate: number;
}

interface Transaction {
  _id: string;
  streamId: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch streams
      const streamsResponse = await fetch('/api/streams');
      if (streamsResponse.ok) {
        const streamsData = await streamsResponse.json();
        setStreams(streamsData.streams || []);
      }

      // Fetch recent transactions
      const transactionsResponse = await fetch('/api/transactions?limit=5');
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setRecentTransactions(transactionsData.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from real data
  const totalStreamed = streams.reduce((sum, stream) => sum + stream.streamedAmount, 0);
  const activeStreams = streams.filter(stream => stream.status === 'active').length;
  const monthlyVolume = streams.reduce((sum, stream) => sum + stream.totalAmount, 0);
  const pendingWithdrawals = recentTransactions
    .filter(tx => tx.status === 'confirmed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const stats = [
    {
      title: "Total Streamed",
      value: `${totalStreamed.toFixed(6)} sBTC`,
      change: "+12.5% from last month",
      changeType: "positive" as const,
      icon: Bitcoin,
    },
    {
      title: "Active Streams",
      value: activeStreams.toString(),
      change: `${streams.length} Total`,
      changeType: "neutral" as const,
      icon: Activity,
    },
    {
      title: "Monthly Volume",
      value: `${monthlyVolume.toFixed(6)} sBTC`,
      change: "+8.2% from last month",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
    {
      title: "Available Balance",
      value: `${pendingWithdrawals.toFixed(6)} sBTC`,
      change: "Ready for withdrawal",
      changeType: "neutral" as const,
      icon: Wallet,
    },
  ];

  // Mock chart data for portfolio overview
  const chartData = [
    { date: 'Jan 1', balance: 0 },
    { date: 'Jan 8', balance: totalStreamed * 0.2 },
    { date: 'Jan 15', balance: totalStreamed * 0.4 },
    { date: 'Jan 22', balance: totalStreamed * 0.7 },
    { date: 'Jan 29', balance: totalStreamed },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your Bitcoin streaming activity.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
            onClick={fetchDashboardData}
            disabled={updating}
          >
            {updating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {updating ? 'Updating...' : 'Refresh Data'}
          </Button>
          
          <Button asChild className="bg-brand-pink hover:bg-brand-pink/90 text-white">
            <Link href="/dashboard/streams/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Stream
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Badge 
                    variant={stat.changeType === 'positive' ? 'default' : 'secondary'}
                    className={
                      stat.changeType === 'positive' 
                        ? 'bg-brand-teal text-white' 
                        : ''
                    }
                  >
                    {stat.change}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest Bitcoin streaming activity and transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction, index) => (
                  <div key={transaction._id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-brand-pink/10 rounded-full">
                        <Activity className="h-4 w-4 text-brand-pink" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Stream Payment
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.txHash?.slice(0, 8)}...{transaction.txHash?.slice(-6)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-brand-teal">
                        +{transaction.amount.toFixed(6)} sBTC
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent transactions</p>
                  <p className="text-xs">Create your first stream to see activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage your Bitcoin streams and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                className="w-full justify-start bg-brand-pink hover:bg-brand-pink/90 text-white"
                asChild
              >
                <Link href="/dashboard/streams/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Stream
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
                asChild
              >
                <Link href="/dashboard/streams">
                  <Activity className="mr-2 h-4 w-4" />
                  Manage Streams
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard/analytics">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard/wallets">
                  <Wallet className="mr-2 h-4 w-4" />
                  Wallet Management
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streaming Overview Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Streaming Overview</CardTitle>
          <CardDescription>
            Your Bitcoin streaming trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.some(d => d.balance > 0) ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tickLine={false}
                  />
                  <YAxis 
                    className="text-xs"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(6)} sBTC`, 'Streamed']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#e91e63" 
                    strokeWidth={2}
                    dot={{ fill: '#e91e63', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#e91e63', strokeWidth: 2, fill: '#ffffff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                <p>No streaming data available</p>
                <p className="text-sm">Create your first stream to see trends</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Getting Started Card (for new users) */}
      {streams.length === 0 && (
        <Card className="border-brand-pink/20 bg-brand-pink/5">
          <CardHeader>
            <CardTitle className="text-brand-pink">🚀 Get Started with BitPay</CardTitle>
            <CardDescription>
              Create your first Bitcoin stream in just a few steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-brand-pink text-white flex items-center justify-center text-sm font-bold mx-auto mb-2">
                  1
                </div>
                <p className="text-sm font-medium">Connect Wallet</p>
                <p className="text-xs text-muted-foreground">Link your Stacks wallet</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center text-sm font-bold mx-auto mb-2">
                  2
                </div>
                <p className="text-sm font-medium">Create Stream</p>
                <p className="text-xs text-muted-foreground">Set recipient and amount</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-brand-pink text-white flex items-center justify-center text-sm font-bold mx-auto mb-2">
                  3
                </div>
                <p className="text-sm font-medium">Start Streaming</p>
                <p className="text-xs text-muted-foreground">Bitcoin flows automatically</p>
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <Button asChild className="bg-brand-pink hover:bg-brand-pink/90 text-white">
                <Link href="/dashboard/streams/create">
                  Create Your First Stream
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}