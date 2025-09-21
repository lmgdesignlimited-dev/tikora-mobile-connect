import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Music, Package, Play, MapPin, Users } from 'lucide-react';

const campaignSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  campaign_type: z.enum(['song_promotion', 'product_promotion', 'video_only']),
  total_budget: z.number().min(1000, 'Minimum budget is ₦1,000'),
  max_influencers: z.number().min(1).max(100),
  videos_per_influencer: z.number().min(1).max(10),
  target_cities: z.array(z.string()).optional(),
  target_tiers: z.array(z.string()).optional(),
  content_guidelines: z.string().optional(),
  hashtags: z.string().optional(),
  // Song specific
  song_url: z.string().url().optional().or(z.literal('')),
  song_title: z.string().optional(),
  artist_name: z.string().optional(),
  // Product specific
  product_name: z.string().optional(),
  product_description: z.string().optional(),
  requires_product_delivery: z.boolean().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CreateCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userType: 'artist' | 'business';
  onSuccess: () => void;
}

export function CreateCampaignModal({ open, onOpenChange, userType, onSuccess }: CreateCampaignModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);

  const defaultCampaignType = userType === 'artist' ? 'song_promotion' : 'product_promotion';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      campaign_type: defaultCampaignType,
      max_influencers: 10,
      videos_per_influencer: 1,
      requires_product_delivery: false,
    },
  });

  const campaignType = watch('campaign_type');
  const totalBudget = watch('total_budget');
  const maxInfluencers = watch('max_influencers');

  const budgetPerInfluencer = totalBudget && maxInfluencers ? totalBudget / maxInfluencers : 0;

  const nigerianCities = [
    'Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 
    'Kaduna', 'Maiduguri', 'Zaria', 'Aba', 'Jos', 'Ilorin', 'Oyo', 'Enugu'
  ];

  const influencerTiers = [
    { value: 'basic', label: 'Basic (1K-10K followers)' },
    { value: 'rising_star', label: 'Rising Star (10K-100K followers)' },
    { value: 'super', label: 'Super (100K+ followers)' }
  ];

  const onSubmit = async (data: CampaignFormData) => {
    setIsLoading(true);
    try {
      const hashtags = data.hashtags ? data.hashtags.split(',').map(tag => tag.trim()) : [];
      
      const campaignData = {
        creator_id: user?.id,
        title: data.title,
        description: data.description,
        campaign_type: data.campaign_type,
        total_budget: data.total_budget,
        budget_per_influencer: budgetPerInfluencer,
        budget: data.total_budget,
        max_influencers: data.max_influencers,
        videos_per_influencer: data.videos_per_influencer,
        target_cities: selectedCities,
        target_tiers: selectedTiers,
        content_guidelines: data.content_guidelines,
        hashtags,
        status: 'active',
        // Song specific fields
        ...(data.campaign_type === 'song_promotion' && {
          song_url: data.song_url,
          song_title: data.song_title,
          artist_name: data.artist_name,
        }),
        // Product specific fields
        ...(data.campaign_type !== 'song_promotion' && {
          product_name: data.product_name,
          product_description: data.product_description,
          requires_product_delivery: data.requires_product_delivery,
        }),
      };

      const { error } = await supabase
        .from('campaigns')
        .insert([campaignData]);

      if (error) throw error;

      toast.success('Campaign created successfully!');
      onSuccess();
      onOpenChange(false);
      reset();
      setSelectedCities([]);
      setSelectedTiers([]);
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCityToggle = (city: string) => {
    const updated = selectedCities.includes(city)
      ? selectedCities.filter(c => c !== city)
      : [...selectedCities, city];
    setSelectedCities(updated);
  };

  const handleTierToggle = (tier: string) => {
    const updated = selectedTiers.includes(tier)
      ? selectedTiers.filter(t => t !== tier)
      : [...selectedTiers, tier];
    setSelectedTiers(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {campaignType === 'song_promotion' ? (
              <Music className="h-5 w-5" />
            ) : campaignType === 'product_promotion' ? (
              <Package className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
            Create New Campaign
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Campaign Type - only show for business users */}
          {userType === 'business' && (
            <div className="space-y-2">
              <Label>Campaign Type</Label>
              <Select 
                value={campaignType} 
                onValueChange={(value) => setValue('campaign_type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product_promotion">Product Promotion</SelectItem>
                  <SelectItem value="video_only">Video Only Campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Basic Details */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Campaign Title</Label>
              <Input 
                placeholder="Enter campaign title"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Describe your campaign goals and requirements"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Song Promotion Fields */}
          {campaignType === 'song_promotion' && (
            <div className="space-y-4 p-4 border rounded-lg bg-primary/5">
              <h3 className="font-medium flex items-center gap-2">
                <Music className="h-4 w-4" />
                Song Details
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Song URL (TikTok/Spotify/YouTube)</Label>
                  <Input 
                    placeholder="https://..."
                    {...register('song_url')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Song Title</Label>
                    <Input 
                      placeholder="Song name"
                      {...register('song_title')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Artist Name</Label>
                    <Input 
                      placeholder="Artist name"
                      {...register('artist_name')}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Product Promotion Fields */}
          {campaignType !== 'song_promotion' && (
            <div className="space-y-4 p-4 border rounded-lg bg-primary/5">
              <h3 className="font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Product Details
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input 
                    placeholder="Product or service name"
                    {...register('product_name')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Product Description</Label>
                  <Textarea 
                    placeholder="Describe your product or service"
                    {...register('product_description')}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="requires_delivery"
                    checked={watch('requires_product_delivery')}
                    onCheckedChange={(checked) => setValue('requires_product_delivery', !!checked)}
                  />
                  <Label htmlFor="requires_delivery">
                    Requires physical product delivery to influencers
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Budget & Targeting */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Budget (₦)</Label>
              <Input 
                type="number"
                placeholder="10000"
                {...register('total_budget', { valueAsNumber: true })}
              />
              {errors.total_budget && (
                <p className="text-sm text-destructive">{errors.total_budget.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Max Influencers</Label>
              <Input 
                type="number"
                min="1"
                max="100"
                {...register('max_influencers', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>Videos per Influencer</Label>
              <Input 
                type="number"
                min="1"
                max="10"
                {...register('videos_per_influencer', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>Budget per Influencer</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm">
                ₦{budgetPerInfluencer.toLocaleString() || '0'}
              </div>
            </div>
          </div>

          {/* Target Cities */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Target Cities (select multiple)
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {nigerianCities.map(city => (
                <div key={city} className="flex items-center space-x-2">
                  <Checkbox
                    id={city}
                    checked={selectedCities.includes(city)}
                    onCheckedChange={() => handleCityToggle(city)}
                  />
                  <Label htmlFor={city} className="text-sm">{city}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Target Tiers */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Target Influencer Tiers
            </Label>
            <div className="space-y-2">
              {influencerTiers.map(tier => (
                <div key={tier.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={tier.value}
                    checked={selectedTiers.includes(tier.value)}
                    onCheckedChange={() => handleTierToggle(tier.value)}
                  />
                  <Label htmlFor={tier.value} className="text-sm">{tier.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Content Guidelines */}
          <div className="space-y-2">
            <Label>Content Guidelines</Label>
            <Textarea 
              placeholder="Specify how influencers should create content (style, tone, key messages, etc.)"
              {...register('content_guidelines')}
            />
          </div>

          <div className="space-y-2">
            <Label>Hashtags (comma separated)</Label>
            <Input 
              placeholder="#tikora, #promotion, #music"
              {...register('hashtags')}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}