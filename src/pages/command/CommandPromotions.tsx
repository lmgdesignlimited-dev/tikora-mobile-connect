import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Megaphone,
  Eye,
  MousePointer,
  Heart,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface Promotion {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  video_url: string;
  goal: string;
  budget: number;
  spent_amount: number;
  status: string;
  created_at: string;
}

export default function CommandPromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: string }>({ open: false, action: '' });
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, [statusFilter]);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_video_promotions', {
        p_status: statusFilter === 'all' ? null : statusFilter as any,
        p_limit: 50,
      });

      if (error) throw error;
      setPromotions((data || []) as unknown as Promotion[]);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedPromotion) return;
    
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('process_video_promotion', {
        p_promotion_id: selectedPromotion.id,
        p_action: actionDialog.action,
        p_admin_notes: adminNotes || null,
        p_rejection_reason: rejectionReason || null,
      });

      if (error) throw error;

      const result = data as unknown as { success: boolean; error?: string };
      if (result.success) {
        toast.success(`Promotion ${actionDialog.action}ed successfully`);
        fetchPromotions();
      } else {
        toast.error(result.error || 'Action failed');
      }
    } catch (error) {
      console.error('Error processing promotion:', error);
      toast.error('Failed to process promotion');
    } finally {
      setProcessing(false);
      setActionDialog({ open: false, action: '' });
      setSelectedPromotion(null);
      setAdminNotes('');
      setRejectionReason('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      case 'paused':
        return 'bg-muted text-muted-foreground';
      case 'completed':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'cancelled':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'views':
        return <Eye className="h-4 w-4" />;
      case 'clicks':
        return <MousePointer className="h-4 w-4" />;
      case 'engagement':
        return <Heart className="h-4 w-4" />;
      default:
        return <Megaphone className="h-4 w-4" />;
    }
  };

  const filteredPromotions = promotions.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    pending: promotions.filter(p => p.status === 'pending').length,
    active: promotions.filter(p => p.status === 'active').length,
    totalBudget: promotions.reduce((sum, p) => sum + (p.budget || 0), 0),
    totalSpent: promotions.reduce((sum, p) => sum + (p.spent_amount || 0), 0),
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-primary" />
              Video Promotions
            </h1>
            <p className="text-muted-foreground">Manage and approve video promotion campaigns</p>
          </div>
          <Button onClick={fetchPromotions} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Pending Review</div>
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Active Promotions</div>
              <div className="text-2xl font-bold text-success">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Total Budget</div>
              <div className="text-2xl font-bold">₦{stats.totalBudget.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Total Spent</div>
              <div className="text-2xl font-bold text-primary">₦{stats.totalSpent.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search promotions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Promotions Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredPromotions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No promotions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPromotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {promotion.title}
                          <a
                            href={promotion.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>{promotion.user_name || 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 capitalize">
                          {getGoalIcon(promotion.goal)}
                          {promotion.goal}
                        </div>
                      </TableCell>
                      <TableCell>₦{promotion.budget?.toLocaleString()}</TableCell>
                      <TableCell>₦{promotion.spent_amount?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(promotion.status)}>
                          {promotion.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(promotion.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {promotion.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-success hover:text-success"
                                onClick={() => {
                                  setSelectedPromotion(promotion);
                                  setActionDialog({ open: true, action: 'approve' });
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedPromotion(promotion);
                                  setActionDialog({ open: true, action: 'reject' });
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {promotion.status === 'active' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedPromotion(promotion);
                                  setActionDialog({ open: true, action: 'pause' });
                                }}
                                title="Pause"
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-success hover:text-success"
                                onClick={() => {
                                  setSelectedPromotion(promotion);
                                  setActionDialog({ open: true, action: 'complete' });
                                }}
                                title="Mark Complete"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedPromotion(promotion);
                                  setActionDialog({ open: true, action: 'cancel' });
                                }}
                                title="Cancel & Refund"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {promotion.status === 'paused' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-success"
                                onClick={() => {
                                  setSelectedPromotion(promotion);
                                  setActionDialog({ open: true, action: 'approve' });
                                }}
                                title="Resume"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedPromotion(promotion);
                                  setActionDialog({ open: true, action: 'cancel' });
                                }}
                                title="Cancel & Refund"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Action Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="capitalize">
                {actionDialog.action} Promotion
              </DialogTitle>
              <DialogDescription>
                {actionDialog.action === 'reject'
                  ? 'Please provide a reason for rejection. The budget will be refunded.'
                  : actionDialog.action === 'approve'
                  ? 'This will activate the promotion and start spending the budget.'
                  : `Are you sure you want to ${actionDialog.action} this promotion?`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {actionDialog.action === 'reject' && (
                <div>
                  <label className="text-sm font-medium">Rejection Reason *</label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this promotion is being rejected..."
                    className="mt-1"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Admin Notes (optional)</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes..."
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog({ open: false, action: '' })}>
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={processing || (actionDialog.action === 'reject' && !rejectionReason)}
                variant={actionDialog.action === 'reject' ? 'destructive' : 'default'}
              >
                {processing ? 'Processing...' : `${actionDialog.action.charAt(0).toUpperCase() + actionDialog.action.slice(1)} Promotion`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
