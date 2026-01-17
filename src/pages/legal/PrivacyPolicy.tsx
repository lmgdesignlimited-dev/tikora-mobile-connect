import { MarketingPageShell } from '@/pages/marketing/MarketingPageShell';

export default function PrivacyPolicy() {
  return (
    <MarketingPageShell
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your information."
    >
      <div className="prose prose-neutral max-w-none">
        <p className="text-muted-foreground">
          This is a starter policy page. Replace with your legal text before production.
        </p>
        <h2>Data we collect</h2>
        <ul>
          <li>Account details (email, name, role)</li>
          <li>Profile information and social links you provide</li>
          <li>Transactional data for wallet operations</li>
        </ul>
        <h2>How we use data</h2>
        <ul>
          <li>Operate the marketplace and complete transactions</li>
          <li>Prevent fraud and enforce compliance</li>
          <li>Improve product experience</li>
        </ul>
      </div>
    </MarketingPageShell>
  );
}
