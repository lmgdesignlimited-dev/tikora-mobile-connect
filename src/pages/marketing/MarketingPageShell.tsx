import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import tikoraIcon from '@/assets/tikora-icon.png';

export function MarketingPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={tikoraIcon} alt="Tikora" className="w-9 h-9 rounded-lg" />
            <span className="font-bold text-xl text-foreground">Tikora</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button variant="gradient" size="sm" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <header className="max-w-3xl">
          <Badge className="mb-3">Tikora Platform</Badge>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>
          ) : null}
        </header>

        <section className="mt-10">{children}</section>

        <section className="mt-16 border-t pt-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Ready to get started?</h2>
              <p className="text-muted-foreground mt-1">
                Create an account and complete onboarding in minutes.
              </p>
            </div>
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth">Create Free Account</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
