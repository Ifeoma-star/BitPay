"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  Clock, 
  CheckCircle, 
  XCircle,
  Pause,
  Bitcoin,
  Play,
  X as XIcon
} from "lucide-react";
import { WithdrawModal } from "@/components/dashboard/modals/WithdrawModal";
import { StreamDetailsModal } from "@/components/dashboard/modals/StreamDetailsModal";
import { PauseStreamModal } from "@/components/dashboard/modals/PauseStreamModal";
import { ResumeStreamModal } from "@/components/dashboard/modals/ResumeStreamModal";
import { CancelStreamModal } from "@/components/dashboard/modals/CancelStreamModal";

// Mock data - replace with real API calls
const mockStreams = [
  {
    id: "stream-1",
    recipient: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
    recipientName: "John Developer",
    totalAmount: "2.50000000",
    vestedAmount: "1.25000000",
    withdrawnAmount: "0.75000000",
    status: "active",
    startDate: "2024-01-15T10:00:00Z",
    endDate: "2024-04-15T10:00:00Z",
    description: "Q1 2024 Salary Stream",
    progress: 50
  },
  {
    id: "stream-2",
    recipient: "SP1A3B5C7D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S",
    recipientName: "Alice Designer", 
    totalAmount: "1.00000000",
    vestedAmount: "1.00000000",
    withdrawnAmount: "1.00000000",
    status: "completed",
    startDate: "2024-01-01T10:00:00Z",
    endDate: "2024-01-31T10:00:00Z",
    description: "Design Project Payment",
    progress: 100
  },
  {
    id: "stream-3",
    recipient: "SP3F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X",
    recipientName: "Bob Consultant",
    totalAmount: "0.75000000",
    vestedAmount: "0.25000000", 
    withdrawnAmount: "0.00000000",
    status: "paused",
    startDate: "2024-01-20T10:00:00Z",
    endDate: "2024-03-20T10:00:00Z",
    description: "Consulting Services",
    progress: 33
  }
];

export default function StreamsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Modal states
  const [selectedStream, setSelectedStream] = useState<typeof mockStreams[0] | null>(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="h-4 w-4 text-brand-teal" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "paused":
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-brand-teal text-white">Active</Badge>;
      case "completed":
        return <Badge className="bg-green-500 text-white">Completed</Badge>;
      case "paused":
        return <Badge variant="secondary">Paused</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredStreams = mockStreams.filter(stream => {
    const matchesSearch = stream.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stream.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stream.recipient.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && stream.status === activeTab;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short", 
      day: "numeric"
    });
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  // Modal handlers
  const openModal = (stream: typeof mockStreams[0], modalType: 'withdraw' | 'details' | 'pause' | 'resume' | 'cancel') => {
    setSelectedStream(stream);
    switch (modalType) {
      case 'withdraw':
        setWithdrawModalOpen(true);
        break;
      case 'details':
        setDetailsModalOpen(true);
        break;
      case 'pause':
        setPauseModalOpen(true);
        break;
      case 'resume':
        setResumeModalOpen(true);
        break;
      case 'cancel':
        setCancelModalOpen(true);
        break;
    }
  };

  const closeAllModals = () => {
    setWithdrawModalOpen(false);
    setDetailsModalOpen(false);
    setPauseModalOpen(false);
    setResumeModalOpen(false);
    setCancelModalOpen(false);
    setSelectedStream(null);
  };

  const handleModalSuccess = () => {
    // In real app, refresh streams data
    closeAllModals();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Streams</h1>
          <p className="text-muted-foreground">Manage your Bitcoin payment streams</p>
        </div>
        <Button asChild className="bg-brand-pink hover:bg-brand-pink/90 text-white">
          <Link href="/dashboard/streams/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Stream
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-brand-teal" />
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-2xl font-bold text-brand-teal">
                  {mockStreams.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-500">
                  {mockStreams.filter(s => s.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bitcoin className="h-4 w-4 text-brand-pink" />
              <div>
                <p className="text-sm font-medium">Total Volume</p>
                <p className="text-2xl font-bold text-brand-pink">
                  {mockStreams.reduce((acc, s) => acc + parseFloat(s.totalAmount), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ArrowUpRight className="h-4 w-4 text-brand-teal" />
              <div>
                <p className="text-sm font-medium">Vested</p>
                <p className="text-2xl font-bold text-brand-teal">
                  {mockStreams.reduce((acc, s) => acc + parseFloat(s.vestedAmount), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search streams by description, recipient, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Streams List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Streams</CardTitle>
          <CardDescription>All your payment streams in one place</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="paused">Paused</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredStreams.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {searchTerm ? "No streams found" : "No streams yet"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm 
                      ? "Try adjusting your search terms or filters"
                      : "Create your first Bitcoin stream to get started"
                    }
                  </p>
                  {!searchTerm && (
                    <Button asChild className="bg-brand-pink hover:bg-brand-pink/90 text-white">
                      <Link href="/dashboard/streams/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Stream
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStreams.map((stream) => (
                    <div key={stream.id} className="border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{stream.description}</h3>
                            {getStatusBadge(stream.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                              <p>
                                <span className="font-medium">Recipient:</span>{" "}
                                {stream.recipientName || truncateAddress(stream.recipient)}
                              </p>
                              <p>
                                <span className="font-medium">Address:</span>{" "}
                                {truncateAddress(stream.recipient)}
                              </p>
                            </div>
                            <div>
                              <p>
                                <span className="font-medium">Period:</span>{" "}
                                {formatDate(stream.startDate)} - {formatDate(stream.endDate)}
                              </p>
                              <p>
                                <span className="font-medium">Progress:</span>{" "}
                                {stream.progress}% complete
                              </p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="font-medium">
                                <span className="text-brand-pink">{stream.vestedAmount} sBTC</span> vested of {stream.totalAmount} sBTC total
                              </span>
                              <span>{stream.progress}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-brand-pink h-2 rounded-full transition-all"
                                style={{ width: `${stream.progress}%` }}
                              />
                            </div>
                          </div>

                          {parseFloat(stream.vestedAmount) > parseFloat(stream.withdrawnAmount) && (
                            <div className="mt-3 p-3 bg-brand-teal/10 rounded-lg">
                              <p className="text-sm text-brand-teal font-medium">
                                💰 {(parseFloat(stream.vestedAmount) - parseFloat(stream.withdrawnAmount)).toFixed(8)} sBTC available to withdraw
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="ml-4 flex flex-col gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openModal(stream, 'details')}
                          >
                            View Details
                            <ArrowUpRight className="h-4 w-4 ml-1" />
                          </Button>
                          
                          {stream.status === "active" && parseFloat(stream.vestedAmount) > parseFloat(stream.withdrawnAmount) && (
                            <Button 
                              size="sm" 
                              className="bg-brand-teal hover:bg-brand-teal/90 text-white"
                              onClick={() => openModal(stream, 'withdraw')}
                            >
                              Withdraw
                            </Button>
                          )}
                          
                          {stream.status === "active" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openModal(stream, 'pause')}
                            >
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </Button>
                          )}
                          
                          {stream.status === "paused" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openModal(stream, 'resume')}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Resume
                            </Button>
                          )}
                          
                          {(stream.status === "active" || stream.status === "paused") && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openModal(stream, 'cancel')}
                              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                            >
                              <XIcon className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedStream && (
        <>
          <WithdrawModal 
            isOpen={withdrawModalOpen}
            onClose={closeAllModals}
            stream={selectedStream}
            onSuccess={handleModalSuccess}
          />
          <StreamDetailsModal 
            isOpen={detailsModalOpen}
            onClose={closeAllModals}
            stream={selectedStream}
            onAction={(actionType) => {
              setDetailsModalOpen(false);
              openModal(selectedStream, actionType);
            }}
          />
          <PauseStreamModal 
            isOpen={pauseModalOpen}
            onClose={closeAllModals}
            stream={selectedStream}
            onSuccess={handleModalSuccess}
          />
          <ResumeStreamModal 
            isOpen={resumeModalOpen}
            onClose={closeAllModals}
            stream={selectedStream}
            onSuccess={handleModalSuccess}
          />
          <CancelStreamModal 
            isOpen={cancelModalOpen}
            onClose={closeAllModals}
            stream={selectedStream}
            onSuccess={handleModalSuccess}
          />
        </>
      )}
    </div>
  );
}