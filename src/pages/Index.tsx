import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { 
  Music, 
  Camera, 
  Building, 
  Star, 
  Users, 
  TrendingUp,
  CheckCircle,
  Play,
  ArrowRight,
  Smartphone,
  Globe,
  DollarSign,
  Gift,
  Copy
} from 'lucide-react';
import heroImage from '@/assets/tikora-hero-image.jpg';
import tikoraLogo from '@/assets/tikora-logo.png';
import tikoraIcon from '@/assets/tikora-icon.png';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Index = () => {
  const { user, loading } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('referral_code').eq('user_id', user.id).single()
        .then(({ data }) => { if (data?.referral_code) setReferralCode(data.referral_code); });
    }
  }, [user]);

  const copyReferralLink = () => {
    if (referralCode) {
      navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${referralCode}`);
      toast.success('Referral link copied!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const features = [
    {
      icon: Music,
      title: 'Artists & Musicians',
      description: 'Get thousands of influencers to use your song on TikTok and Instagram',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: Camera,
      title: 'Content Creators',
      description: 'Monetize your content and collaborate with brands across Africa',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Building,
      title: 'Brands & Businesses', 
      description: 'Reach real people through creative campaigns by trusted influencers',
      color: 'bg-green-100 text-green-600',
    },
  ];

  const stats = [
    { label: 'Advert Views', value: '10M+', icon: TrendingUp },
    { label: 'App Downloads', value: '300K+', icon: Smartphone },
    { label: 'Active Creators', value: '50K+', icon: Users },
    { label: 'Countries', value: '15+', icon: Globe },
  ];

  const benefits = [
    'Easy campaign creation and management',
    'Secure payments with Kora Pay & Flutterwave',
    'Real-time analytics and insights',
    'Mobile-first experience',
    '5% referral commission on first orders',
    'Professional networking & follow system',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={tikoraIcon} alt="Tikora" className="w-9 h-9 rounded-lg" />
            <span className="font-bold text-xl text-foreground hidden sm:block">Tikora</span>
          </Link>
          
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="gradient" size="sm" asChild>
                  <Link to="/wallet">Wallet</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button variant="gradient" size="sm" asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/10 py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  🎁 Earn 5% Referral Commission
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  The Ultimate <span className="text-gradient-primary">Influencer</span> & Creator Marketplace
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg">
                  Tikora helps creators and brands go viral and grow fast. Connect, collaborate & get paid across Africa.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero" size="xl" className="group" asChild>
                  <Link to="/auth">
                    Create Free Account
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" className="gap-2" asChild>
                  <Link to="/auth">
                    <Play className="h-4 w-4" />
                    Watch Demo
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-light border-2 border-background flex items-center justify-center text-white text-sm font-medium">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">Trusted by 50K+ creators</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-glow bg-gradient-to-br from-primary/10 to-primary/5">
                <img 
                  src={heroImage} 
                  alt="Tikora creators and influencers" 
                  className="w-full h-auto"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
              </div>
              
              <Card className="absolute -bottom-6 -left-6 bg-background/95 backdrop-blur-sm border-primary/20 shadow-glow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-success flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">₦2.5M+</p>
                      <p className="text-xs text-muted-foreground">Paid to creators</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="absolute -top-6 -right-6 bg-background/95 backdrop-blur-sm border-primary/20 shadow-glow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">95%</p>
                      <p className="text-xs text-muted-foreground">Success rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Banner (logged-in users) */}
      {user && referralCode && (
        <section className="py-6 bg-gradient-to-r from-primary/10 to-accent/10 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Refer & Earn 5% Commission</p>
                  <p className="text-xs text-muted-foreground">Share your code and earn on every first order</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="px-3 py-1.5 bg-muted rounded-md text-sm font-mono font-semibold">
                  {referralCode}
                </code>
                <Button variant="outline" size="sm" onClick={copyReferralLink} className="gap-2">
                  <Copy className="h-3.5 w-3.5" />
                  Copy Link
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gradient-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">For Everyone</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for <span className="text-gradient-primary">All Creators</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're an artist, influencer, or business owner, Tikora has the tools you need to succeed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-medium hover:shadow-strong transition-shadow duration-300">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <Button variant="ghost" className="p-0 h-auto text-primary font-medium">
                    Learn more <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Program Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Gift className="h-3 w-3 mr-1" /> Referral Program
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Earn <span className="text-gradient-primary">5% Commission</span> on Every Referral
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Share your unique referral code with friends. When they sign up and complete their first campaign or order, you automatically earn 5% as a wallet bonus.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              {[
                { step: '1', title: 'Share Your Code', desc: 'Copy your unique referral link from your dashboard' },
                { step: '2', title: 'Friend Signs Up', desc: 'They create an account using your referral code' },
                { step: '3', title: 'Earn 5%', desc: 'Get credited automatically on their first order' },
              ].map((item) => (
                <Card key={item.step} className="border-0 shadow-medium">
                  <CardContent className="pt-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 font-bold">
                      {item.step}
                    </div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth">
                Start Earning Now <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">Why Choose Tikora</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Everything you need to <span className="text-gradient-primary">go viral</span>
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button variant="gradient" size="lg" asChild>
                  <Link to="/auth">Start Your Journey</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <Card className="border-0 shadow-glow bg-gradient-to-br from-background to-accent/10">
                <CardHeader>
                  <CardTitle className="text-center">Mobile-First Experience</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-muted-foreground">
                    Built specifically for mobile users with intuitive design and lightning-fast performance.
                  </p>
                  <div className="flex justify-center gap-4 pt-4">
                    <Badge variant="secondary">iOS</Badge>
                    <Badge variant="secondary">Android</Badge>
                    <Badge variant="secondary">Progressive Web App</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-light text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Creative Career?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of creators and brands who are already using Tikora to grow their audience and increase their earnings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="xl" asChild>
              <Link to="/auth">Create Free Account</Link>
            </Button>
            <Button variant="outline" size="xl" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link to="/auth">Already a user? Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img src={tikoraIcon} alt="Tikora" className="w-9 h-9 rounded-lg" />
                <span className="font-bold text-xl text-foreground">Tikora</span>
              </Link>
              <p className="text-muted-foreground text-sm mb-4">
                The ultimate influencer and creator marketplace connecting Africa's creative community.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/platform/artists" className="hover:text-primary">For Artists</Link></li>
                <li><Link to="/platform/influencers" className="hover:text-primary">For Influencers</Link></li>
                <li><Link to="/platform/businesses" className="hover:text-primary">For Businesses</Link></li>
                <li><Link to="/pricing" className="hover:text-primary">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/help-center" className="hover:text-primary">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-primary">Contact Us</Link></li>
                <li><Link to="/community" className="hover:text-primary">Community</Link></li>
                <li><Link to="/blog" className="hover:text-primary">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/legal/privacy" className="hover:text-primary">Privacy Policy</Link></li>
                <li><Link to="/legal/terms" className="hover:text-primary">Terms of Service</Link></li>
                <li><Link to="/legal/cookies" className="hover:text-primary">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Tikora. All rights reserved. Built with ❤️ for African creators.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
