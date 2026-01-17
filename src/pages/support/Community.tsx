import { MarketingPageShell } from '@/pages/marketing/MarketingPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Community() {
  return (
    <MarketingPageShell
      title="Community"
      subtitle="Join creators and brands sharing playbooks, best practices, and opportunities."
    >
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Creator Community</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Tips on content quality, compliance, and how to win more gigs.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Brand Community</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Campaign strategy, brief templates, and reporting benchmarks.
          </CardContent>
        </Card>
      </div>
    </MarketingPageShell>
  );
}
