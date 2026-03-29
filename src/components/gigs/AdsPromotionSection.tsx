import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Megaphone,
  Zap,
  Users,
  TrendingUp,
  Link as LinkIcon,
  Info,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';

interface AdsPromotionSectionProps {
  adBudget: number;
  basePayment: number;
  platform?: string;
  onSelectOption?: (option: 'tikora' | 'spark' | null) => void;
}

export function AdsPromotionSection({
  adBudget,
  basePayment,
  platform = 'TikTok',
  onSelectOption,
}: AdsPromotionSectionProps) {
  const [selected, setSelected] = useState<'tikora' | 'spark' | null>(null);

  const handleSelect = (option: 'tikora' | 'spark') => {
    const next = selected === option ? null : option;
    setSelected(next);
    onSelectOption?.(next);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-primary/10">
          <Megaphone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            Ads Promotion Available
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
              <Zap className="h-3 w-3 mr-0.5" /> Boost
            </Badge>
          </h3>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        The brand has allocated <span className="font-semibold text-primary">₦{adBudget.toLocaleString()}</span> to
        promote selected videos as paid ads. Your content could reach far more people than your organic following.
      </p>

      {/* Key Facts */}
      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
          <span>You earn your base <span className="font-medium text-foreground">₦{basePayment.toLocaleString()}</span> payment regardless of ads</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
          <span>Ads come with <span className="font-medium text-foreground">additional bonus payments</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
          <span>You will be notified before any ad goes live</span>
        </div>
      </div>

      <Separator />

      {/* Option A */}
      <OptionCard
        selected={selected === 'tikora'}
        onSelect={() => handleSelect('tikora')}
        label="Option A"
        emoji="📢"
        title="TIKORA Runs the Ads on Our Pages"
        description={`TIKORA promotes your video on our official ${platform} and Instagram pages as a branded ad. Your video credit is displayed. You don't need to do anything extra — we handle all ad management.`}
        stats={[
          { label: 'Bonus', value: '+₦1,000' },
          { label: 'Extra effort', value: 'Zero' },
          { label: 'Extra reach', value: '50K+' },
        ]}
      />

      {/* Option B */}
      <OptionCard
        selected={selected === 'spark'}
        onSelect={() => handleSelect('spark')}
        label="Option B"
        emoji="👤"
        title={`Ads Run on YOUR Account (Spark Ads / Partnership Ads)`}
        description={`The brand runs paid ads through your social media account ("Spark Ads" on ${platform} / "Partnership Ads" on Instagram). You generate a code from your app settings — your account stays fully in your control. You can revoke at any time.`}
        stats={[
          { label: 'Max bonus', value: '+₦5K' },
          { label: 'Setup', value: 'Simple' },
          { label: 'Your reach', value: 'Grows too' },
        ]}
      />

      {/* Spark Ads How-To (show when Option B selected) */}
      {selected === 'spark' && (
        <Card className="border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <CardContent className="p-4 space-y-3">
            <h4 className="text-sm font-semibold">How Spark Ads works:</h4>
            <ol className="space-y-2.5">
              {[
                `Post your video organically on ${platform} first`,
                `Go to ${platform} Creator Centre → generate Spark Ads code`,
                'Paste the code in your TIKORA dashboard when submitting',
                'Brand uses the code to promote your video — you stay in control',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
            <Button variant="outline" size="sm" className="gap-2 mt-1 border-primary/20 text-primary">
              <LinkIcon className="h-3.5 w-3.5" />
              Connect Social Account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info footer */}
      <Alert className="bg-muted/50 border-border">
        <Info className="h-4 w-4 text-muted-foreground" />
        <AlertDescription className="text-xs text-muted-foreground">
          Ads promotion is optional. Your base <span className="font-medium">₦{basePayment.toLocaleString()}</span> video
          payment is always guaranteed regardless of ads usage. TIKORA charges the brand for ad spend — not you.
        </AlertDescription>
      </Alert>
    </div>
  );
}

/* ── Option Card Sub-component ── */

interface OptionCardProps {
  selected: boolean;
  onSelect: () => void;
  label: string;
  emoji: string;
  title: string;
  description: string;
  stats: { label: string; value: string }[];
}

function OptionCard({ selected, onSelect, label, emoji, title, description, stats }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-xl border-2 p-4 transition-all duration-200',
        selected
          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
          : 'border-border hover:border-primary/30 hover:bg-accent/50'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <Badge variant="outline" className="text-[10px]">{label}</Badge>
        </div>
        <div className={cn(
          'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors',
          selected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
        )}>
          {selected && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
        </div>
      </div>

      <h4 className="text-sm font-semibold mb-1.5">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{description}</p>

      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center p-2 rounded-lg bg-background/80">
            <p className="text-sm font-bold text-primary">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </button>
  );
}
