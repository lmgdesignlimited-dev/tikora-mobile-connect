import { MarketingPageShell } from '@/pages/marketing/MarketingPageShell';

export default function CookiePolicy() {
  return (
    <MarketingPageShell
      title="Cookie Policy"
      subtitle="How cookies are used to improve your experience."
    >
      <div className="prose prose-neutral max-w-none">
        <p className="text-muted-foreground">
          This is a starter cookie policy. Replace with your legal text before production.
        </p>
        <h2>What are cookies?</h2>
        <p>
          Cookies are small files stored on your device to help websites remember settings and sessions.
        </p>
        <h2>How we use cookies</h2>
        <ul>
          <li>Authentication/session persistence</li>
          <li>Security and abuse prevention</li>
          <li>Basic performance analytics</li>
        </ul>
      </div>
    </MarketingPageShell>
  );
}
