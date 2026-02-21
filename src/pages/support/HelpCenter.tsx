import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MarketingPageShell } from '@/pages/marketing/MarketingPageShell';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { HelpCircle, Send, Ticket, Clock, CheckCircle, MessageSquare } from 'lucide-react';
import { useEffect } from 'react';

const faqs = [
  {
    category: 'Getting Started',
    items: [
      { q: 'How do I create an account?', a: 'Click "Get Started" on the homepage, choose your role (Artist, Influencer, or Business), fill in your details, and verify your email. You\'ll then complete a short onboarding wizard.' },
      { q: 'What are the different account types?', a: 'Artists promote their music through influencer campaigns. Influencers create content for brands and artists. Businesses launch product/brand campaigns to reach wider audiences.' },
      { q: 'How does onboarding work?', a: 'After signup, you\'ll go through a step-by-step wizard that collects your profile info, social handles, and preferences. Influencers also get auto-tiered based on follower count.' },
      { q: 'Is Tikora free to use?', a: 'Creating an account is free. Artists and businesses fund campaigns from their wallet. Influencers earn by completing gigs — no upfront cost.' },
    ]
  },
  {
    category: 'Campaigns & Gigs',
    items: [
      { q: 'How do campaigns work?', a: 'Artists/businesses create campaigns with a budget, requirements, and content style. Influencers browse available gigs, claim them, and submit content for review.' },
      { q: 'Who approves my gig application?', a: 'When you claim a gig, it goes to "Pending Approval". The campaign owner (artist or business) reviews applications and approves or rejects them. Once approved, you can start creating content.' },
      { q: 'How are influencers paid?', a: 'Once your submitted content is approved, 70% of the campaign\'s cost-per-video is credited to your wallet automatically. The remaining 30% is platform revenue.' },
      { q: 'What happens if my content is rejected?', a: 'You\'ll receive feedback on why it was rejected. You can resubmit up to 3 times per campaign. If all attempts are rejected, the gig is forfeited.' },
      { q: 'Can I set my own rate?', a: 'Yes! Go to Profile → Settings and set your Custom Rate. This rate is used as your default when applying to gigs.' },
    ]
  },
  {
    category: 'Payments & Wallet',
    items: [
      { q: 'How do I fund my wallet?', a: 'Go to the Wallet page and click "Fund Wallet". You can pay via bank transfer, card, or crypto (USDT). Crypto payments require admin approval.' },
      { q: 'How do withdrawals work?', a: 'Click "Withdraw" on the Wallet page, enter your bank details, and submit. Withdrawals are processed within 24-48 hours after admin verification.' },
      { q: 'What currencies are supported?', a: 'We support NGN (Nigerian Naira), GHS (Ghanaian Cedi), and USD. Set your preferred currency in Settings.' },
      { q: 'Is there a minimum withdrawal amount?', a: 'Yes, the minimum withdrawal is ₦1,000 or equivalent in your preferred currency.' },
    ]
  },
  {
    category: 'Referral Program',
    items: [
      { q: 'How does the referral program work?', a: 'Share your unique referral link (found on your dashboard). When someone signs up and completes their first order, you earn 5% commission on that order.' },
      { q: 'Where do I find my referral link?', a: 'Your referral link and code are displayed on your dashboard. Click the copy button to share it easily.' },
      { q: 'When do I receive my referral bonus?', a: 'The 5% commission is automatically credited to your wallet when your referred user completes their first successful order on the platform.' },
    ]
  },
  {
    category: 'Account & Security',
    items: [
      { q: 'How do I change my password?', a: 'Go to Profile → Settings → Security section. Enter your new password and click "Update Password".' },
      { q: 'How do I get verified?', a: 'Verification is handled by admins based on your activity, follower count, and content quality. Maintain a good track record to increase your chances.' },
      { q: 'What are strikes?', a: 'Strikes are penalties for policy violations (e.g., missing deadlines, low-quality content). Too many strikes can affect your visibility and tier.' },
    ]
  }
];

export default function HelpCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('faq');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    if (user && activeTab === 'tickets') fetchTickets();
  }, [user, activeTab]);

  const fetchTickets = async () => {
    if (!user) return;
    setLoadingTickets(true);
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoadingTickets(false);
  };

  const handleSubmitTicket = async () => {
    if (!user) { toast.error('Please sign in to submit a ticket'); return; }
    if (!subject.trim() || !message.trim()) { toast.error('Please fill in all fields'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('support_tickets').insert({
      user_id: user.id,
      subject: subject.trim(),
      message: message.trim(),
      category,
    });

    if (error) {
      toast.error('Failed to submit ticket');
    } else {
      toast.success('Support ticket submitted! We\'ll respond within 24 hours.');
      setSubject('');
      setMessage('');
      setCategory('general');
      fetchTickets();
    }
    setSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-warning/10 text-warning border-warning/20">Open</Badge>;
      case 'in_progress': return <Badge className="bg-primary/10 text-primary border-primary/20">In Progress</Badge>;
      case 'resolved': return <Badge className="bg-success/10 text-success border-success/20">Resolved</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <MarketingPageShell
      title="Help Center"
      subtitle="Find answers to common questions or submit a support ticket."
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="faq" className="gap-2"><HelpCircle className="h-4 w-4" />FAQ</TabsTrigger>
          <TabsTrigger value="submit" className="gap-2"><Send className="h-4 w-4" />Submit Ticket</TabsTrigger>
          {user && <TabsTrigger value="tickets" className="gap-2"><Ticket className="h-4 w-4" />My Tickets</TabsTrigger>}
        </TabsList>

        {/* FAQ */}
        <TabsContent value="faq">
          <div className="space-y-6">
            {faqs.map((section) => (
              <Card key={section.category}>
                <CardHeader>
                  <CardTitle className="text-lg">{section.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    {section.items.map((item, i) => (
                      <AccordionItem key={i} value={`${section.category}-${i}`}>
                        <AccordionTrigger className="text-left text-sm">{item.q}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Submit Ticket */}
        <TabsContent value="submit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" />Submit a Support Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!user && (
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">Please sign in to submit a support ticket.</p>
              )}
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="account">Account Issues</SelectItem>
                    <SelectItem value="payment">Payment & Wallet</SelectItem>
                    <SelectItem value="campaign">Campaign & Gigs</SelectItem>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="report">Report User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description of your issue" />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your issue in detail..." rows={5} />
              </div>
              <Button onClick={handleSubmitTicket} disabled={submitting || !user} className="gap-2">
                <Send className="h-4 w-4" />{submitting ? 'Submitting...' : 'Submit Ticket'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Tickets */}
        <TabsContent value="tickets">
          <Card>
            <CardHeader><CardTitle>My Support Tickets</CardTitle></CardHeader>
            <CardContent>
              {loadingTickets ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No tickets submitted yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map(ticket => (
                    <div key={ticket.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">{ticket.subject}</h4>
                          <p className="text-xs text-muted-foreground capitalize">{ticket.category} • {new Date(ticket.created_at).toLocaleDateString()}</p>
                        </div>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{ticket.message}</p>
                      {ticket.admin_response && (
                        <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                          <p className="text-xs font-medium text-primary mb-1">Admin Response:</p>
                          <p className="text-sm">{ticket.admin_response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MarketingPageShell>
  );
}
