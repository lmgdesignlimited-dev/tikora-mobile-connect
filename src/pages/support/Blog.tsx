import { MarketingPageShell } from '@/pages/marketing/MarketingPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Blog() {
  return (
    <MarketingPageShell
      title="Blog"
      subtitle="Guides, case studies, and product updates for creators and brands."
    >
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              We’ll publish campaign playbooks, growth tactics, and marketplace insights here.
            </CardContent>
          </Card>
        ))}
      </div>
    </MarketingPageShell>
  );
}
