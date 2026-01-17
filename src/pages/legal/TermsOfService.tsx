import { MarketingPageShell } from '@/pages/marketing/MarketingPageShell';

export default function TermsOfService() {
  return (
    <MarketingPageShell
      title="Terms of Service"
      subtitle="Rules and conditions for using Tikora."
    >
      <div className="prose prose-neutral max-w-none">
        <p className="text-muted-foreground">
          This is a starter terms page. Replace with your legal text before production.
        </p>
        <h2>Eligibility</h2>
        <p>Users must provide accurate information and comply with platform rules.</p>
        <h2>Marketplace rules</h2>
        <ul>
          <li>No fraudulent submissions</li>
          <li>Respect campaign briefs and content guidelines</li>
          <li>Follow local laws and platform policies</li>
        </ul>
      </div>
    </MarketingPageShell>
  );
}
