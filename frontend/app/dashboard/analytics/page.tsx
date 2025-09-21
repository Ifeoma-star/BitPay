"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { 
  Loader2,
  Activity,
  Search,
  RefreshCw,
  Bitcoin,
  TrendingUp,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

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


interface StreamingHistory {
  date: string;
  totalStreamed: number;
  activeStreams: number;
  streamVolume: number;
}

export default function AnalyticsPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [streamingHistory, setStreamingHistory] = useState<StreamingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [streamStatus, setStreamStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe, streamStatus]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch streams
      const streamsResponse = await fetch(`/api/streams?status=${streamStatus}&timeframe=${timeframe}`);
      if (streamsResponse.ok) {
        const streamsData = await streamsResponse.json();
        setStreams(streamsData.streams || []);
      }

      // Fetch streaming transactions would go here if needed

      // Fetch streaming history
      await fetchStreamingHistory();

    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStreamingHistory = async () => {
    try {
      const response = await fetch(`/api/analytics/streaming-history?days=${timeframe === '30d' ? 30 : timeframe === '7d' ? 7 : 90}`);
      if (response.ok) {
        const data = await response.json();
        setStreamingHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch streaming history:', error);
      setStreamingHistory([]);
    }
  };

  const getFilteredStreams = () => {
    return streams.filter(stream => {
      const matchesSearch = 
        stream.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stream.recipient.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = streamStatus === 'all' || stream.status === streamStatus;
      
      return matchesSearch && matchesStatus;
    });
  };

  const getStreamingStats = () => {
    const totalStreamed = streams.reduce((sum, stream) => sum + stream.streamedAmount, 0);
    const totalVolume = streams.reduce((sum, stream) => sum + stream.totalAmount, 0);
    const activeStreams = streams.filter(stream => stream.status === 'active');
    const completedStreams = streams.filter(stream => stream.status === 'completed');
    
    return {
      totalStreams: streams.length,
      totalStreamed,
      totalVolume,
      activeCount: activeStreams.length,
      completedCount: completedStreams.length,
      averageStreamRate: streams.length > 0 ? streams.reduce((sum, s) => sum + s.streamRate, 0) / streams.length : 0,
    };
  };

  const getStreamsByStatus = () => {
    const statusCounts = {
      active: streams.filter(s => s.status === 'active').length,
      completed: streams.filter(s => s.status === 'completed').length,
      paused: streams.filter(s => s.status === 'paused').length,
      cancelled: streams.filter(s => s.status === 'cancelled').length,
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: status === 'active' ? '#10b981' : 
             status === 'completed' ? '#3b82f6' : 
             status === 'paused' ? '#f59e0b' : '#ef4444'
    }));
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const stats = getStreamingStats();
  const filteredStreams = getFilteredStreams();
  const streamStatusData = getStreamsByStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stream Analytics</h1>
            <p className="text-muted-foreground">
              Detailed insights into your Bitcoin streaming performance and activity
            </p>
          </div>
          <Button
            onClick={fetchAnalyticsData}
            disabled={isLoading}
            className="gap-2 bg-brand-pink hover:bg-brand-pink/90 text-white"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Streaming Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Streamed
            </CardTitle>
            <Bitcoin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStreamed.toFixed(6)} sBTC</div>
            <p className="text-xs text-muted-foreground">
              Total amount streamed to date
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Streams
            </CardTitle>
            <Activity className="h-4 w-4 text-brand-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently streaming • {stats.totalStreams} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Stream Volume
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-brand-pink" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVolume.toFixed(6)} sBTC</div>
            <p className="text-xs text-muted-foreground">
              Total committed amount
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Stream Rate
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageStreamRate.toFixed(6)} sBTC</div>
            <p className="text-xs text-muted-foreground">
              Per stream per day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Streaming History Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Streaming History</CardTitle>
          <CardDescription>
            Your Bitcoin streaming trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={streamingHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="totalStreamed" 
                stackId="1"
                stroke="#e91e63" 
                fill="#e91e63"
                fillOpacity={0.3}
                name="Total Streamed (sBTC)"
              />
              <Area 
                type="monotone" 
                dataKey="streamVolume" 
                stackId="2"
                stroke="#14b8a6" 
                fill="#14b8a6"
                fillOpacity={0.3}
                name="Stream Volume (sBTC)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Stream Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Stream Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Stream Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of streams by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={streamStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {streamStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Recipients */}
        <Card>
          <CardHeader>
            <CardTitle>Top Recipients</CardTitle>
            <CardDescription>
              Recipients with highest streaming volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {streams
                .sort((a, b) => b.streamedAmount - a.streamedAmount)
                .slice(0, 5)
                .map((stream, index) => (
                  <div key={stream._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-brand-pink/10 flex items-center justify-center text-sm font-bold text-brand-pink">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{stream.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatAddress(stream.recipient)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{stream.streamedAmount.toFixed(6)} sBTC</p>
                      <Badge variant={stream.status === 'active' ? 'default' : 'secondary'}>
                        {stream.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              {streams.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No streams found</p>
                  <p className="text-xs">Create your first stream to see analytics</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Stream List */}
      <Card>
        <CardHeader>
          <CardTitle>Stream Analysis</CardTitle>
          <CardDescription>
            Filter and analyze your streaming data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search streams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={streamStatus} onValueChange={setStreamStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStreamStatus('all');
                  setTimeframe('30d');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Stream List */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Filtered Streams ({filteredStreams.length})</h4>
            {filteredStreams.length > 0 ? (
              filteredStreams.map((stream) => (
                <motion.div
                  key={stream._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{stream.description}</p>
                      <Badge variant={stream.status === 'active' ? 'default' : 'secondary'}>
                        {stream.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      To: {formatAddress(stream.recipient)}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Streamed: <span className="font-medium text-brand-pink">{stream.streamedAmount.toFixed(6)} sBTC</span> / {stream.totalAmount.toFixed(6)} sBTC
                      </span>
                      <span>Rate: {stream.streamRate.toFixed(6)} sBTC/day</span>
                      <span>Started: {new Date(stream.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No streams found matching your filters.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}