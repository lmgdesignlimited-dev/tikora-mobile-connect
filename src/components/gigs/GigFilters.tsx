import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface GigFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  campaignType: string;
  onCampaignTypeChange: (value: string) => void;
  tier: string;
  onTierChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const CAMPAIGN_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'song_promotion', label: 'Song Promotion' },
  { value: 'product_review', label: 'Product Review' },
  { value: 'movie_promotion', label: 'Movie Promotion' },
  { value: 'app_promotion', label: 'App Promotion' },
  { value: 'paid_ad', label: 'Paid Ad' },
];

const TIERS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'starter', label: 'Starter' },
  { value: 'mid', label: 'Mid-Tier' },
  { value: 'top', label: 'Top Creator' },
  { value: 'super', label: 'Super Star' },
];

const CITIES = [
  { value: 'all', label: 'All Cities' },
  { value: 'Lagos', label: 'Lagos' },
  { value: 'Abuja', label: 'Abuja' },
  { value: 'Port Harcourt', label: 'Port Harcourt' },
  { value: 'Ibadan', label: 'Ibadan' },
  { value: 'Kano', label: 'Kano' },
  { value: 'Accra', label: 'Accra' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'highest_pay', label: 'Highest Pay' },
  { value: 'deadline', label: 'Deadline Soon' },
  { value: 'spots', label: 'Most Spots' },
];

export function GigFilters({
  searchTerm,
  onSearchChange,
  campaignType,
  onCampaignTypeChange,
  tier,
  onTierChange,
  city,
  onCityChange,
  sortBy,
  onSortChange,
  onClearFilters,
  hasActiveFilters,
}: GigFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search gigs..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-2">
        <Select value={campaignType} onValueChange={onCampaignTypeChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {CAMPAIGN_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tier} onValueChange={onTierChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            {TIERS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={city} onValueChange={onCityChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[140px]">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-1">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
