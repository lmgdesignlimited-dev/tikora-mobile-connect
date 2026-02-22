import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Headphones, 
  FileVideo, 
  Newspaper,
  Sparkles,
  ArrowRight,
  Star,
  CheckCircle,
  Clock,
  Music
} from 'lucide-react';

interface ServicePackage {
  id: string;
  service_type: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  features: string[] | null;
  category: string;
  delivery_days: number | null;
}

const artistServices = [
  {
    id: 'tiktok_claim',
    title: 'TikTok Artist Claiming',
    description: 'Get your official verified TikTok artist profile with the music note badge. Stand out as a verified creator.',
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    route: '/services',
    tag: 'Most Popular'
  },
  {
    id: 'audiomack',
    title: 'Audiomack Monetization',
    description: 'Enable monetization on your Audiomack account and start earning from your streams professionally.',
    icon: Headphones,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    route: '/services',
    tag: 'Earn More'
  },
  {
    id: 'capcut',
    title: 'CapCut Templates',
    description: 'Custom CapCut templates designed for your music — transitions, lyric videos, dance challenges and more.',
    icon: FileVideo,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    route: '/services',
    tag: 'Creative'
  },
  {
    id: 'blog',
    title: 'Blog Promotion',
    description: 'Get your music featured on top music blogs and publications. Increase visibility and credibility.',
    icon: Newspaper,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    route: '/services',
    tag: 'PR & Press'
  },
  {
    id: 'video_promo',
    title: 'Video Promotion & Ads',
    description: 'Boost your music videos with targeted ads across TikTok and Instagram. Reach new listeners instantly.',
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    route: '/promote',
    tag: 'Boost'
  }
];

export default function ExploreArtist() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    const [pkgRes, orderRes] = await Promise.all([
      supabase.from('service_packages').select('*').eq('category', 'artist').eq('is_active', true).order('price'),
      supabase.from('service_orders').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(5)
    ]);
    if (pkgRes.data) setPackages(pkgRes.data as ServicePackage[]);
    if (orderRes.data) setRecentOrders(orderRes.data);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 pb-20">
        <div className="space-y-6">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 via-primary/10 to-amber-500/10 border border-primary/20 p-6">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Music className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Artist Services</h1>
              </div>
              <p className="text-muted-foreground max-w-lg">
                Grow your music career with professional services — from TikTok verification to blog features and video promotion.
              </p>
            </div>
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full -mr-8 -mt-8" />
          </div>

          {/* Services Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {artistServices.map((service) => {
              const Icon = service.icon;
              return (
                <Card 
                  key={service.id} 
                  className={`group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${service.borderColor}`}
                  onClick={() => navigate(service.route)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-12 h-12 rounded-xl ${service.bgColor} flex items-center justify-center ${service.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="secondary" className="text-xs">{service.tag}</Badge>
                    </div>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <CardDescription className="text-sm">{service.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" className="gap-2 p-0 h-auto text-primary group-hover:gap-3 transition-all">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Recent Service Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm capitalize">{order.service_type?.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">₦{order.price_paid?.toLocaleString()}</span>
                        <Badge variant="secondary" className={
                          order.status === 'completed' ? 'bg-success/10 text-success' :
                          order.status === 'processing' ? 'bg-primary/10 text-primary' :
                          'bg-warning/10 text-warning'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <MobileNavigation />
    </div>
  );
}
