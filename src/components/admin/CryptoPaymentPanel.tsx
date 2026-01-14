import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bitcoin, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Copy,
  AlertTriangle,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface CryptoRequest {
  id: string;
  user_id: string;
  amount: number;
  crypto_type: string;
  wallet_address: string;
  payment_proof_url: string | null;
  tx_hash: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  user_name: string;
  user_email: string;
}

export function CryptoPaymentPanel() {
  const [requests, setRequests] = useState<CryptoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [txHashes, setTxHashes] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRequests(activeTab);
  }, [activeTab]);

  const fetchRequests = async (status: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_crypto_payment_requests', {
        p_status: status,
        p_limit: 100
      });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching crypto requests:', error);
      toast.error('Failed to load crypto payment requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessing(requestId);
    try {
      const { data, error } = await supabase.rpc('review_crypto_payment', {
        p_request_id: requestId,
        p_action: action,
        p_admin_notes: adminNotes[requestId] || null,
        p_tx_hash: action === 'approve' ? txHashes[requestId] || null : null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; action?: string };
      if (!result.success) {
        throw new Error(result.error || 'Review failed');
      }

      toast.success(`Payment request ${action}d successfully`);
      
      // Clear inputs
      setAdminNotes(prev => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
      setTxHashes(prev => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
      
      fetchRequests(activeTab);
    } catch (error: any) {
      console.error('Review error:', error);
      toast.error(error.message || 'Failed to process review');
    } finally {
      setProcessing(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const filteredRequests = requests.filter(req => 
    req.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.wallet_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.tx_hash?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getExplorerUrl = (cryptoType: string, txHash: string) => {
    switch (cryptoType.toUpperCase()) {
      case 'USDT':
      case 'ETH':
        return `https://etherscan.io/tx/${txHash}`;
      case 'BTC':
        return `https://blockchair.com/bitcoin/transaction/${txHash}`;
      case 'BNB':
        return `https://bscscan.com/tx/${txHash}`;
      default:
        return `https://etherscan.io/tx/${txHash}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-amber-500" />
            Crypto Payment Requests
          </h2>
          <p className="text-sm text-muted-foreground">
            Review and approve cryptocurrency deposit requests
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchRequests(activeTab)}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by user, wallet address, or tx hash..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bitcoin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No {activeTab} requests</h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'pending' 
                    ? 'All caught up! No crypto payments awaiting review.' 
                    : `No ${activeTab} requests to display.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Request Details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{request.user_name}</span>
                              <span className="text-sm text-muted-foreground">{request.user_email}</span>
                            </div>
                            <p className="text-2xl font-bold mt-1">
                              ₦{request.amount.toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline" className="uppercase">
                            {request.crypto_type}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Wallet:</span>
                            <code className="bg-muted px-2 py-1 rounded text-xs">
                              {request.wallet_address.slice(0, 10)}...{request.wallet_address.slice(-8)}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(request.wallet_address)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>

                          {request.tx_hash && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">TX Hash:</span>
                              <code className="bg-muted px-2 py-1 rounded text-xs">
                                {request.tx_hash.slice(0, 10)}...{request.tx_hash.slice(-8)}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                asChild
                              >
                                <a 
                                  href={getExplorerUrl(request.crypto_type, request.tx_hash)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        {request.payment_proof_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={request.payment_proof_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Payment Proof
                            </a>
                          </Button>
                        )}

                        {request.admin_notes && activeTab !== 'pending' && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Admin Notes:</p>
                            <p className="text-sm">{request.admin_notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions (only for pending) */}
                      {activeTab === 'pending' && (
                        <div className="lg:w-80 space-y-3 border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-4">
                          <div className="space-y-2">
                            <Input
                              placeholder="Transaction hash (for verification)"
                              value={txHashes[request.id] || ''}
                              onChange={(e) => setTxHashes(prev => ({ ...prev, [request.id]: e.target.value }))}
                            />
                            <Textarea
                              placeholder="Admin notes (optional)"
                              value={adminNotes[request.id] || ''}
                              onChange={(e) => setAdminNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                              rows={2}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              className="flex-1 gap-2"
                              onClick={() => handleReview(request.id, 'approve')}
                              disabled={processing === request.id}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1 gap-2"
                              onClick={() => handleReview(request.id, 'reject')}
                              disabled={processing === request.id}
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>

                          {!request.tx_hash && !txHashes[request.id] && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              No transaction hash provided by user
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
