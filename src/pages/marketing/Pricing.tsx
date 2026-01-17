import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MarketingPageShell } from './MarketingPageShell';

export default function Pricing() {
  return (
    <MarketingPageShell
      title="Pricing"
      subtitle="Simple entry, scalable growth. Pay for what you use, and unlock premium services when you need them."
    >
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Starter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>Best for first-time creators & small campaigns.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Basic onboarding</li>
              <li>Campaign discovery</li>
              <li>Standard moderation</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Pro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>For brands launching frequent campaigns.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Creator ranking + boosts</li>
              <li>Priority support</li>
              <li>Advanced reporting</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enterprise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>For teams requiring governance and workflow controls.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Admin command center</li>
              <li>Role-based access</li>
              <li>Audit logs</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10">
        <Badge className="mb-3">Note</Badge>
        <p className="text-muted-foreground">
          Package prices for boosts, services, and campaigns are managed from the admin tools
          and can change based on region and tier.
        </p>
        <div className="mt-6">
          <Button variant="outline" asChild>
            <Link to="/auth">Create account to view packages</Link>
          </Button>
        </div>
      </div>
    </MarketingPageShell>
  );
}
