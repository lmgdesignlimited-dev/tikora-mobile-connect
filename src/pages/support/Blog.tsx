import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MarketingPageShell } from '@/pages/marketing/MarketingPageShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  TrendingUp, 
  Calendar, 
  ArrowRight, 
  Eye,
  Music,
  Building,
  Camera,
  Sparkles,
  Shield,
  Wallet
} from 'lucide-react';

const defaultArticles = [
  {
    title: 'How to Create Viral TikTok Content for Brand Campaigns',
    excerpt: 'Learn the proven strategies that top influencers use to create engaging content that brands love and audiences share.',
    category: 'Creator Tips',
    icon: Camera,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    readTime: '5 min read',
    date: 'Feb 20, 2026'
  },
  {
    title: 'Artist Guide: Getting Your TikTok Profile Verified',
    excerpt: 'Step-by-step guide to claiming your official TikTok artist profile and leveraging it for music promotion.',
    category: 'Artist Growth',
    icon: Music,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    readTime: '4 min read',
    date: 'Feb 18, 2026'
  },
  {
    title: 'Google My Business: The Ultimate Setup Guide for Nigerian Businesses',
    excerpt: 'Why every local business needs a GMB profile and how to optimize it for maximum visibility on Google Search and Maps.',
    category: 'Business Growth',
    icon: Building,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    readTime: '7 min read',
    date: 'Feb 15, 2026'
  },
  {
    title: '5 Ways to Maximize Your Earnings as a Tikora Influencer',
    excerpt: 'From visibility boosts to referral commissions — discover all the ways you can earn more on the platform.',
    category: 'Earnings',
    icon: Wallet,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    readTime: '6 min read',
    date: 'Feb 12, 2026'
  },
  {
    title: 'Understanding Campaign Types: Which One is Right for You?',
    excerpt: 'A deep dive into music promotions, product reviews, event coverage, and more — find the best campaign format.',
    category: 'Platform Guide',
    icon: Sparkles,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    readTime: '5 min read',
    date: 'Feb 10, 2026'
  },
  {
    title: 'Platform Security: How We Keep Your Data and Earnings Safe',
    excerpt: 'Learn about our escrow system, wallet security, and data protection measures that keep your account safe.',
    category: 'Security',
    icon: Shield,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    readTime: '4 min read',
    date: 'Feb 8, 2026'
  }
];

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('blog_posts').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setPosts(data); });
  }, []);

  return (
    <MarketingPageShell
      title="Blog & Resources"
      subtitle="Guides, case studies, and product updates for creators, artists, and brands."
    >
      <div className="space-y-8">
        {/* Featured Article */}
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-6 md:p-8">
            <Badge className="bg-primary/10 text-primary mb-3">Featured</Badge>
            <h2 className="text-2xl font-bold mb-2">{defaultArticles[0].title}</h2>
            <p className="text-muted-foreground mb-4 max-w-2xl">{defaultArticles[0].excerpt}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{defaultArticles[0].date}</span>
              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{defaultArticles[0].readTime}</span>
            </div>
            <Button variant="gradient" className="gap-2">
              Read Article <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Articles Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Latest Articles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {defaultArticles.slice(1).map((article) => {
              const Icon = article.icon;
              return (
                <Card key={article.title} className="hover:shadow-md transition-shadow group cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg ${article.bg} flex items-center justify-center ${article.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-xs">{article.category}</Badge>
                    </div>
                    <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm mb-3 line-clamp-2">{article.excerpt}</CardDescription>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{article.date}</span>
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{article.readTime}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Published Blog Posts from DB */}
        {posts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Community Posts</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      {post.category && <Badge variant="outline" className="text-xs">{post.category}</Badge>}
                      {post.is_featured && <Badge className="bg-amber-500/10 text-amber-500 text-xs">Featured</Badge>}
                    </div>
                    <CardTitle className="text-base">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.view_count || 0} views</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Card className="text-center bg-muted/50">
          <CardContent className="py-8">
            <BookOpen className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-2">Want to Contribute?</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Share your success story or expertise with the Tikora community. Published authors earn visibility boosts!
            </p>
            <Button variant="outline" asChild>
              <a href="/contact">Contact Us</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </MarketingPageShell>
  );
}