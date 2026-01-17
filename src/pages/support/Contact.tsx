import { MarketingPageShell } from '@/pages/marketing/MarketingPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Contact() {
  return (
    <MarketingPageShell
      title="Contact Us"
      subtitle="Reach the Tikora team for support, partnerships, or enterprise onboarding."
    >
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Support</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2">
          <p>Email: support@tikora.example</p>
          <p>Response time: within 24–48 hours (business days)</p>
          <p>For urgent issues, include your account email and screenshots.</p>
        </CardContent>
      </Card>
    </MarketingPageShell>
  );
}
