import { MarketingPageShell } from '@/pages/marketing/MarketingPageShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Lightbulb, 
  Star, 
  ArrowRight,
  Music,
  Building,
  Camera,
  BookOpen,
  Award,
  Zap
} from 'lucide-react';

const communityFeatures = [
  {
    icon: MessageSquare,
    title: 'Discussion Forums',
    description: 'Connect with fellow creators and brands. Share tips, ask questions, and get advice from the community.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    status: 'Coming Soon'
  },
  {
    icon: BookOpen,
    title: 'Creator Academy',
    description: 'Free courses on content creation, campaign optimization, and growing your audience on TikTok & Instagram.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    status: 'Coming Soon'
  },
  {
    icon: Award,
    title: 'Top Creators Leaderboard',
    description: 'See the highest-performing influencers ranked by completion rate, ratings, and earnings.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    status: 'Coming Soon'
  },
  {
    icon: Zap,
    title: 'Weekly Challenges',
    description: 'Participate in weekly content challenges for bonus coins and visibility boosts.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    status: 'Coming Soon'
  }
];

const communityGroups = [
  { icon: Camera, title: 'Influencer Hub', members: '2.5K+', description: 'Tips on content quality, compliance, and how to win more gigs.', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { icon: Music, title: 'Artist Corner', members: '1.8K+', description: 'Music promotion strategies, TikTok sounds, and distribution tips.', color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { icon: Building, title: 'Business Network', members: '1.2K+', description: 'Campaign strategy, brief templates, and reporting benchmarks.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: TrendingUp, title: 'Growth Hackers', members: '3K+', description: 'Advanced strategies for scaling your presence and earnings on the platform.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
];

const testimonials = [
  { name: 'Chioma A.', role: 'Influencer', quote: 'Tikora helped me earn ₦250K in my first month. The community is super supportive!', rating: 5 },
  { name: 'Emeka O.', role: 'Artist', quote: 'Got my TikTok artist profile claimed in 48 hours. Now I\'m reaching 10x more listeners.', rating: 5 },
  { name: 'Fatima B.', role: 'Business Owner', quote: 'The GMB setup service brought 40% more walk-in customers to my store.', rating: 5 }
];

export default function Community() {
  return (
    <MarketingPageShell
      title="Community"
      subtitle="Join thousands of creators, artists, and brands building together on Tikora."
    >
      <div className="space-y-12">
        {/* Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Members', value: '8K+', icon: Users },
            { label: 'Campaigns Completed', value: '15K+', icon: TrendingUp },
            { label: 'Total Paid Out', value: '₦25M+', icon: Star },
            { label: 'Success Rate', value: '94%', icon: Lightbulb }
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="text-center">
              <CardContent className="pt-6 pb-4">
                <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Community Groups */}
        <div>
          <h2 className="text-xl font-bold mb-4">Community Groups</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {communityGroups.map((group) => {
              const Icon = group.icon;
              return (
                <Card key={group.title} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${group.bg} flex items-center justify-center ${group.color} shrink-0`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold">{group.title}</h3>
                          <Badge variant="secondary" className="text-xs">{group.members} members</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                        <Button variant="ghost" size="sm" className="gap-1 mt-2 p-0 h-auto text-primary">
                          Join Group <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Features Coming */}
        <div>
          <h2 className="text-xl font-bold mb-4">What's Coming</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {communityFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center ${feature.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{feature.title}</CardTitle>
                          <Badge variant="outline" className="text-xs">{feature.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Testimonials */}
        <div>
          <h2 className="text-xl font-bold mb-4">What Our Community Says</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-primary/10">
                <CardContent className="pt-6">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 text-center">
          <CardContent className="py-8">
            <h2 className="text-xl font-bold mb-2">Ready to Join?</h2>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Sign up today and start connecting with thousands of creators and brands on Tikora.
            </p>
            <Button variant="gradient" size="lg" asChild>
              <a href="/auth">Get Started Free</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </MarketingPageShell>
  );
}