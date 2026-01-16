import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, 
  Music, 
  Building, 
  Crown,
  Headphones,
  FileVideo,
  Newspaper,
  MapPin,
  Globe,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Wallet,
  Star,
  Package
} from 'lucide-react';
import { toast } from 'sonner';

type ServiceType = 
  | 'tiktok_artist_claim'
  | 'audiomack_monetization'
  | 'capcut_template'
  | 'music_blog_basic'
  | 'music_blog_pro'
  | 'music_blog_premium'
  | 'gmb_setup'
  | 'google_maps_optimization'
  | 'business_blog_basic'
  | 'business_blog_pro'
  | 'business_blog_premium'
  | 'seo_content';

interface ServicePackage {
  id: string;
  service_type: ServiceType;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  features: string[] | null;
  category: string;
  delivery_days: number | null;
  is_active: boolean;
}

interface ServiceOrder {
  id: string;
  service_type: ServiceType;
  price_paid: number;
  status: string;
  created_at: string;
  submission_data: any;
}

export default function Services() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  
  // Modal state
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [submissionData, setSubmissionData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchPackages(),
        fetchOrders()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();
    setProfile(data);
  };

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });
    
    if (!error && data) {
      setPackages(data as ServicePackage[]);
    }
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('service_orders')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setOrders(data as ServiceOrder[]);
    }
  };

  const handleOrderService = async () => {
    if (!selectedPackage) return;

    if (selectedPackage.price > (profile?.wallet_balance || 0)) {
      toast.error('Insufficient wallet balance');
      return;
    }

    setOrderLoading(true);
    try {
      // Create order
      const { error: orderError } = await supabase
        .from('service_orders')
        .insert({
          user_id: user?.id,
          service_type: selectedPackage.service_type,
          package_id: selectedPackage.id,
          price_paid: selectedPackage.price,
          currency: selectedPackage.currency,
          submission_data: submissionData,
          status: 'pending'
        });

      if (orderError) throw orderError;

      // Deduct from wallet
      const { error: walletError } = await supabase
        .from('profiles')
        .update({ 
          wallet_balance: (profile?.wallet_balance || 0) - selectedPackage.price 
        })
        .eq('user_id', user?.id);

      if (walletError) throw walletError;

      // Create wallet transaction
      await supabase.from('wallet_transactions').insert({
        user_id: user?.id,
        transaction_type: 'payment',
        amount: selectedPackage.price,
        description: `Service: ${selectedPackage.name}`,
        status: 'completed',
        reference_id: `SVC-${Date.now()}`
      });

      toast.success('Service ordered successfully! We will process it shortly.');
      setOrderModalOpen(false);
      setSelectedPackage(null);
      setSubmissionData({});
      loadData();
    } catch (error) {
      console.error('Error ordering service:', error);
      toast.error('Failed to order service');
    } finally {
      setOrderLoading(false);
    }
  };

  const getServiceIcon = (type: ServiceType) => {
    switch (type) {
      case 'tiktok_artist_claim': return <Crown className="h-5 w-5" />;
      case 'audiomack_monetization': return <Headphones className="h-5 w-5" />;
      case 'capcut_template': return <FileVideo className="h-5 w-5" />;
      case 'music_blog_basic':
      case 'music_blog_pro':
      case 'music_blog_premium':
      case 'business_blog_basic':
      case 'business_blog_pro':
      case 'business_blog_premium':
        return <Newspaper className="h-5 w-5" />;
      case 'gmb_setup': return <Building className="h-5 w-5" />;
      case 'google_maps_optimization': return <MapPin className="h-5 w-5" />;
      case 'seo_content': return <Search className="h-5 w-5" />;
      default: return <Sparkles className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'processing': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending':
      case 'in_review': return 'bg-warning/10 text-warning border-warning/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getRequiredFields = (type: ServiceType) => {
    switch (type) {
      case 'tiktok_artist_claim':
        return [
          { key: 'tiktok_username', label: 'TikTok Username', placeholder: '@username' },
          { key: 'artist_name', label: 'Artist/Stage Name', placeholder: 'Your artist name' },
          { key: 'proof_link', label: 'Proof of Ownership (Spotify/Apple Music Link)', placeholder: 'https://...' }
        ];
      case 'audiomack_monetization':
        return [
          { key: 'audiomack_username', label: 'Audiomack Username', placeholder: 'username' },
          { key: 'email', label: 'Email Address', placeholder: 'email@example.com' }
        ];
      case 'gmb_setup':
      case 'google_maps_optimization':
        return [
          { key: 'business_name', label: 'Business Name', placeholder: 'Your Business' },
          { key: 'business_address', label: 'Business Address', placeholder: 'Full address' },
          { key: 'phone', label: 'Phone Number', placeholder: '+234...' },
          { key: 'category', label: 'Business Category', placeholder: 'Restaurant, Salon, etc.' }
        ];
      default:
        return [
          { key: 'details', label: 'Additional Details', placeholder: 'Tell us what you need...' }
        ];
    }
  };

  const artistPackages = packages.filter(p => p.category === 'artist');
  const businessPackages = packages.filter(p => p.category === 'business');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Growth Services
          </h1>
          <p className="text-muted-foreground">
            Premium services to accelerate your growth
          </p>
        </div>

        {/* Wallet Balance */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-xl font-bold">₦{(profile?.wallet_balance || 0).toLocaleString()}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/wallet">Fund Wallet</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="artist">
          <TabsList className="mb-6">
            <TabsTrigger value="artist" className="gap-2">
              <Music className="h-4 w-4" />
              Artist Services
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-2">
              <Building className="h-4 w-4" />
              Business Services
            </TabsTrigger>
            <TabsTrigger value="my-orders" className="gap-2">
              <Package className="h-4 w-4" />
              My Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="artist">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artistPackages.map((pkg) => (
                <Card key={pkg.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {getServiceIcon(pkg.service_type)}
                      </div>
                      {pkg.name.includes('Premium') && (
                        <Badge className="bg-gradient-to-r from-primary to-primary-light text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {pkg.features && (
                      <ul className="space-y-2">
                        {pkg.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {pkg.delivery_days && (
                      <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Delivery in {pkg.delivery_days} days</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">₦{pkg.price.toLocaleString()}</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setOrderModalOpen(true);
                      }}
                      variant="gradient"
                    >
                      Order Now
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="business">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businessPackages.map((pkg) => (
                <Card key={pkg.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center text-success">
                        {getServiceIcon(pkg.service_type)}
                      </div>
                      {pkg.name.includes('Premium') && (
                        <Badge className="bg-gradient-to-r from-success to-success/80 text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {pkg.features && (
                      <ul className="space-y-2">
                        {pkg.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {pkg.delivery_days && (
                      <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Delivery in {pkg.delivery_days} days</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">₦{pkg.price.toLocaleString()}</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setOrderModalOpen(true);
                      }}
                      variant="gradient"
                    >
                      Order Now
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-orders">
            <Card>
              <CardHeader>
                <CardTitle>My Service Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No orders yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Order a service to see it here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              {getServiceIcon(order.service_type)}
                            </div>
                            <div>
                              <h4 className="font-medium capitalize">
                                {order.service_type.replace(/_/g, ' ')}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Ordered {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Amount Paid</span>
                          <span className="font-medium">₦{order.price_paid.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <MobileNavigation />

      {/* Order Modal */}
      <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order {selectedPackage?.name}</DialogTitle>
            <DialogDescription>
              Fill in the required information to proceed
            </DialogDescription>
          </DialogHeader>
          
          {selectedPackage && (
            <div className="space-y-4">
              <Card className="bg-muted/50">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <span>Service Price</span>
                    <span className="text-xl font-bold">₦{selectedPackage.price.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                    <span>Your Balance</span>
                    <span>₦{(profile?.wallet_balance || 0).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {getRequiredFields(selectedPackage.service_type).map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    {field.key === 'details' ? (
                      <Textarea
                        placeholder={field.placeholder}
                        value={submissionData[field.key] || ''}
                        onChange={(e) => setSubmissionData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      />
                    ) : (
                      <Input
                        placeholder={field.placeholder}
                        value={submissionData[field.key] || ''}
                        onChange={(e) => setSubmissionData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>

              <Button 
                onClick={handleOrderService}
                disabled={orderLoading || selectedPackage.price > (profile?.wallet_balance || 0)}
                className="w-full"
                variant="gradient"
              >
                {orderLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : selectedPackage.price > (profile?.wallet_balance || 0) ? (
                  'Insufficient Balance'
                ) : (
                  `Pay ₦${selectedPackage.price.toLocaleString()}`
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}