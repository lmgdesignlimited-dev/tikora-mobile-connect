import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MarketingPageShell } from './MarketingPageShell';

export default function ForInfluencers() {
  return (
    <MarketingPageShell
      title="For Influencers"
      subtitle="Find gigs that match your tier, submit content fast, and get paid transparently."
    >
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Find Gigs</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Discover campaigns based on your profile, location, and performance.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Visibility Boost</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Use coins to boost ranking and appear higher in selection lists.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fast Payouts</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Earn per task, track approvals, and withdraw when available.
          </CardContent>
        </Card>
      </div>

      <div className="mt-10">
        <Badge className="mb-3">What you’ll need</Badge>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>A public creator profile (TikTok/Instagram)</li>
          <li>Consistent quality delivery</li>
          <li>Valid links for submission and review</li>
        </ul>
      </div>
    </MarketingPageShell>
  );
}
