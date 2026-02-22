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
  Video,
  Newspaper,
  MapPin,
  Search,
  Building,
  ArrowRight,
  Clock,
  Globe,
  Megaphone,
  TrendingUp,
  Link2
} from 'lucide-react';

const businessServices = [
  {
    id: 'video_promo',
    title: 'Video Promotion & Ads',
    description: 'Boost your business videos with targeted ads. Two options: promote on our platform or link your social account for direct promotion.',
    icon: Video,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    route: '/promote',
    tag: 'Most Popular'
  },
  {
    id: 'blog_promo',
    title: 'Blog Promotion & PR',
    description: 'Get featured on business blogs, news sites, and publications. SEO-optimized articles that drive traffic.',
    icon: Newspaper,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    route: '/services',
    tag: 'PR & Press'
  },
  {
    id: 'gmb',
    title: 'Google My Business Setup',
    description: 'Professional GMB registration and optimization. Get found on Google Search and Maps by local customers.',
    icon: MapPin,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    route: '/services',
    tag: 'Local SEO'
  },
  {
    id: 'maps',
    title: 'Google Maps Optimization',
    description: 'Rank higher on Google Maps. Optimize your listing with reviews, photos, and proper categorization.',
    icon: Globe,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    route: '/services',
    tag: 'Visibility'
  },
  {
    id: 'seo',
    title: 'SEO Content & Strategy',
    description: 'AI-powered SEO content that ranks. Blog posts, landing pages, and keyword-optimized articles.',
    icon: Search,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    route: '/services',
    tag: 'Growth'
  },
  {
    id: 'social_linking',
    title: 'Social Account Ads',
    description: 'Link your TikTok or Instagram account and we run professional ad campaigns directly on your profile.',
    icon: Link2,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
    route: '/promote',
    tag: 'Advanced'
  }
];

export default function ExploreBusiness() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    const [orderRes, promoRes] = await Promise.all([
      supabase.from('service_orders').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('video_promotions').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(3)
    ]);
    if (orderRes.data) setRecentOrders(orderRes.data);
    if (promoRes.data) setPromotions(promoRes.data);
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600/20 via-primary/10 to-blue-500/10 border border-primary/20 p-6">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Business Growth Hub</h1>
              </div>
              <p className="text-muted-foreground max-w-lg">
                Professional marketing services to grow your business — video ads, Google presence, blog PR and more.
              </p>
            </div>
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full -mr-8 -mt-8" />
          </div>

          {/* Services Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {businessServices.map((service) => {
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

          {/* Activity Summary */}
          {(recentOrders.length > 0 || promotions.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {promotions.map((promo) => (
                    <div key={promo.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Megaphone className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{promo.title}</p>
                          <p className="text-xs text-muted-foreground">Video Promotion</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className={
                        promo.status === 'active' ? 'bg-success/10 text-success' :
                        promo.status === 'completed' ? 'bg-primary/10 text-primary' :
                        'bg-warning/10 text-warning'
                      }>
                        {promo.status}
                      </Badge>
                    </div>
                  ))}
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm capitalize">{order.service_type?.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">₦{order.price_paid?.toLocaleString()}</span>
                        <Badge variant="secondary">{order.status}</Badge>
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
