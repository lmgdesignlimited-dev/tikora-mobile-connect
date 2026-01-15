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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Package,
  Music,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  Play,
} from 'lucide-react';

interface ServiceOrder {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  service_type: string;
  service_name: string;
  status: string;
  price_paid: number;
  submission_data: Record<string, any>;
  admin_notes: string;
  created_at: string;
}

export default function CommandServices() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: string }>({ open: false, action: '' });
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_service_orders', {
        p_status: statusFilter === 'all' ? null : statusFilter as any,
        p_limit: 50,
      });

      if (error) throw error;
      setOrders((data || []) as unknown as ServiceOrder[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load service orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedOrder) return;
    
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('process_service_order', {
        p_order_id: selectedOrder.id,
        p_action: actionDialog.action,
        p_admin_notes: adminNotes || null,
        p_rejection_reason: rejectionReason || null,
      });

      if (error) throw error;

      const result = data as unknown as { success: boolean; error?: string };
      if (result.success) {
        toast.success(`Order ${actionDialog.action}ed successfully`);
        fetchOrders();
      } else {
        toast.error(result.error || 'Action failed');
      }
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Failed to process order');
    } finally {
      setProcessing(false);
      setActionDialog({ open: false, action: '' });
      setSelectedOrder(null);
      setAdminNotes('');
      setRejectionReason('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'in_review':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'processing':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'refunded':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getServiceIcon = (serviceType: string) => {
    if (serviceType.includes('music') || serviceType.includes('artist') || serviceType.includes('audiomack') || serviceType.includes('capcut') || serviceType.includes('tiktok')) {
      return <Music className="h-4 w-4 text-purple-500" />;
    }
    return <Building className="h-4 w-4 text-blue-500" />;
  };

  const filteredOrders = orders.filter(o => 
    o.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.price_paid || 0), 0),
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Service Orders
            </h1>
            <p className="text-muted-foreground">Manage artist and business growth service orders</p>
          </div>
          <Button onClick={fetchOrders} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Pending</div>
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Processing</div>
              <div className="text-2xl font-bold text-primary">{stats.processing}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Completed</div>
              <div className="text-2xl font-bold text-success">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Revenue</div>
              <div className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
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
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getServiceIcon(order.service_type)}
                          <span className="font-medium">{order.service_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.user_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{order.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>₦{order.price_paid?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(order.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedOrder(order);
                              setDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-primary"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setActionDialog({ open: true, action: 'approve' });
                                }}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setActionDialog({ open: true, action: 'reject' });
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {order.status === 'processing' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-success"
                              onClick={() => {
                                setSelectedOrder(order);
                                setActionDialog({ open: true, action: 'complete' });
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
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

        {/* Details Dialog */}
        <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                Service order information and submission data
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Service</label>
                    <p className="font-medium">{selectedOrder.service_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div>
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Customer</label>
                    <p className="font-medium">{selectedOrder.user_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.user_email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Price Paid</label>
                    <p className="font-medium">₦{selectedOrder.price_paid?.toLocaleString()}</p>
                  </div>
                </div>
                
                {selectedOrder.submission_data && Object.keys(selectedOrder.submission_data).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Submission Data</label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(selectedOrder.submission_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedOrder.admin_notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Admin Notes</label>
                    <p className="mt-1">{selectedOrder.admin_notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Action Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="capitalize">
                {actionDialog.action} Order
              </DialogTitle>
              <DialogDescription>
                {actionDialog.action === 'reject'
                  ? 'Please provide a reason for rejection. The payment will be refunded.'
                  : actionDialog.action === 'approve'
                  ? 'This will start processing the order.'
                  : actionDialog.action === 'complete'
                  ? 'Mark this order as completed.'
                  : `Are you sure you want to ${actionDialog.action} this order?`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {actionDialog.action === 'reject' && (
                <div>
                  <label className="text-sm font-medium">Rejection Reason *</label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this order is being rejected..."
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
                {processing ? 'Processing...' : `${actionDialog.action.charAt(0).toUpperCase() + actionDialog.action.slice(1)}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
