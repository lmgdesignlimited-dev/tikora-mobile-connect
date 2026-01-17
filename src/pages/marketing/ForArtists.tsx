import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MarketingPageShell } from './MarketingPageShell';

export default function ForArtists() {
  return (
    <MarketingPageShell
      title="For Artists"
      subtitle="Launch song campaigns, get creators using your sound, and track results end‑to‑end."
    >
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Song Promotion Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Create a campaign, define content style, set a budget, and get matched with creators.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Escrow‑style Payouts</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Funds are held securely and released after successful content review.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Growth Services</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Order premium services like blog placements, template packs, and profile claims.
          </CardContent>
        </Card>
      </div>

      <div className="mt-10">
        <Badge className="mb-3">Best for</Badge>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>Independent artists and labels launching new releases</li>
          <li>Creators building trends around a specific sound</li>
          <li>Campaigns that need clean reporting and compliance checks</li>
        </ul>
      </div>
    </MarketingPageShell>
  );
}
