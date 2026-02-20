import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Users,
  Search,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Application {
  id: string;
  campaign_id: string;
  influencer_id: string;
  proposed_rate: number | null;
  portfolio_links: string[] | null;
  proposal: string | null;
  status: string;
  payment_status: string | null;
  created_at: string;
  campaign_title?: string;
  campaign_type?: string;
  influencer_name?: string;
  influencer_username?: string;
  influencer_avatar?: string;
  influencer_tier?: string;
}

export function GigApplicationsPanel() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<Application | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('campaign_applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        setApplications([]);
        return;
      }

      // Enrich with campaign + influencer data
      const campaignIds = [...new Set(data.map(a => a.campaign_id))];
      const influencerIds = [...new Set(data.map(a => a.influencer_id))];

      const [campaignsRes, profilesRes] = await Promise.all([
        supabase.from('campaigns').select('id,title,campaign_type').in('id', campaignIds),
        supabase.from('profiles').select('user_id,full_name,username,avatar_url,influencer_tier').in('user_id', influencerIds),
      ]);

      const campaignMap: Record<string, any> = {};
      (campaignsRes.data || []).forEach(c => { campaignMap[c.id] = c; });
      const profileMap: Record<string, any> = {};
      (profilesRes.data || []).forEach(p => { profileMap[p.user_id] = p; });

      const enriched = data.map(a => ({
        ...a,
        campaign_title: campaignMap[a.campaign_id]?.title || 'Unknown Campaign',
        campaign_type: campaignMap[a.campaign_id]?.campaign_type,
        influencer_name: profileMap[a.influencer_id]?.full_name || 'Unknown',
        influencer_username: profileMap[a.influencer_id]?.username,
        influencer_avatar: profileMap[a.influencer_id]?.avatar_url,
        influencer_tier: profileMap[a.influencer_id]?.influencer_tier,
      }));

      setApplications(enriched);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleAction = async (applicationId: string, action: 'approved' | 'rejected') => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('campaign_applications')
        .update({ status: action })
        .eq('id', applicationId);

      if (error) throw error;

      // Insert admin log
      await supabase.from('admin_logs').insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id || '',
        action,
        target_type: 'campaign_application',
        target_id: applicationId,
        details: { note: rejectionNote || null },
        module: 'gigs',
      });

      toast.success(`Application ${action}`);
      setDetailOpen(false);
      setRejectionNote('');
      fetchApplications();
    } catch (err) {
      console.error(err);
      toast.error('Action failed');
    } finally {
      setSaving(false);
    }
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    approved: 'bg-success/10 text-success border-success/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
    completed: 'bg-primary/10 text-primary border-primary/20',
  };

  const filtered = applications.filter(a =>
    a.campaign_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.influencer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by campaign or influencer..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchApplications}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No applications found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{filtered.length} application{filtered.length !== 1 ? 's' : ''}</p>
          {filtered.map(app => (
            <Card key={app.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={app.influencer_avatar || undefined} />
                    <AvatarFallback>{app.influencer_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{app.influencer_name}</p>
                      {app.influencer_username && <span className="text-xs text-muted-foreground">@{app.influencer_username}</span>}
                      {app.influencer_tier && <Badge variant="outline" className="text-xs">{app.influencer_tier}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      Campaign: <span className="text-foreground">{app.campaign_title}</span>
                    </p>
                    {app.proposed_rate && (
                      <p className="text-xs text-muted-foreground">Rate: ₦{app.proposed_rate.toLocaleString()}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColor[app.status] || 'bg-muted text-muted-foreground'}>{app.status}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => { setSelected(app); setDetailOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {app.status === 'pending' && (
                      <>
                        <Button size="sm" variant="default" className="h-8 gap-1" onClick={() => handleAction(app.id, 'approved')} disabled={saving}>
                          <CheckCircle className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="h-8 gap-1" onClick={() => { setSelected(app); setDetailOpen(true); }} disabled={saving}>
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selected.influencer_avatar || undefined} />
                  <AvatarFallback>{selected.influencer_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selected.influencer_name}</p>
                  {selected.influencer_username && <p className="text-sm text-muted-foreground">@{selected.influencer_username}</p>}
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Campaign</span><span className="font-medium">{selected.campaign_title}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Proposed Rate</span><span className="font-medium">₦{(selected.proposed_rate || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Applied</span><span>{format(new Date(selected.created_at), 'MMM d, yyyy')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={statusColor[selected.status]}>{selected.status}</Badge></div>
              </div>

              {selected.proposal && (
                <div>
                  <p className="text-sm font-medium mb-1">Proposal</p>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{selected.proposal}</p>
                </div>
              )}

              {selected.portfolio_links && selected.portfolio_links.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Portfolio Links</p>
                  <div className="space-y-1">
                    {selected.portfolio_links.map((link, i) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline truncate">
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selected.status === 'pending' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Rejection Note (optional)</p>
                  <Textarea placeholder="Reason for rejection..." value={rejectionNote} onChange={e => setRejectionNote(e.target.value)} rows={2} />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
            {selected?.status === 'pending' && (
              <>
                <Button variant="destructive" onClick={() => handleAction(selected.id, 'rejected')} disabled={saving}>
                  Reject
                </Button>
                <Button onClick={() => handleAction(selected.id, 'approved')} disabled={saving}>
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
