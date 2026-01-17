import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarketingPageShell } from '@/pages/marketing/MarketingPageShell';

export default function HelpCenter() {
  return (
    <MarketingPageShell
      title="Help Center"
      subtitle="Answers to the most common questions about onboarding, campaigns, payments, and moderation."
    >
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2">
            <p>• Creating an account</p>
            <p>• Completing onboarding</p>
            <p>• Setting up your profile</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payments & Wallet</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2">
            <p>• Funding your wallet</p>
            <p>• Withdrawals</p>
            <p>• Transaction statuses</p>
          </CardContent>
        </Card>
      </div>
    </MarketingPageShell>
  );
}
