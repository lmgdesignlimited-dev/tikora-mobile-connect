import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MarketingPageShell } from './MarketingPageShell';

export default function ForBusinesses() {
  return (
    <MarketingPageShell
      title="For Businesses"
      subtitle="Run creator campaigns for products, apps, events, and paid video ads — with real accountability."
    >
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Creator Selection</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Pick creators by tier, city, niche, and performance indicators.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Campaign Wizard</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Define deliverables, content style, and platform requirements step‑by‑step.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Moderation & Reporting</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Content is reviewed for brief compliance before payouts are released.
          </CardContent>
        </Card>
      </div>

      <div className="mt-10">
        <Badge className="mb-3">Common use cases</Badge>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>Product reviews and unboxings</li>
          <li>App installs and paid video ads</li>
          <li>Event coverage and venue promotions</li>
        </ul>
      </div>
    </MarketingPageShell>
  );
}
