import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Music, Package, Film, Calendar, Smartphone, Globe, Video,
  MapPin, Users, ArrowLeft, ArrowRight, Check, DollarSign,
  Truck, Camera
} from 'lucide-react';

// Campaign types configuration
const CAMPAIGN_TYPES = [
  { value: 'music', label: 'Music Promotion', icon: Music, description: 'Promote songs and sounds' },
  { value: 'movie', label: 'Movie/Film', icon: Film, description: 'Trailer & movie promotion' },
  { value: 'event', label: 'Event', icon: Calendar, description: 'Event announcements & hype' },
  { value: 'app', label: 'App Install', icon: Smartphone, description: 'App demos & downloads' },
  { value: 'website', label: 'Website/Digital', icon: Globe, description: 'Website traffic & signups' },
  { value: 'product', label: 'Physical Product', icon: Package, description: 'Product reviews & unboxing' },
  { value: 'production', label: 'Physical Coverage', icon: Camera, description: 'Professional video production' },
];

const CONTENT_STYLES: Record<string, { value: string; label: string }[]> = {
  music: [
    { value: 'dance', label: 'Dance' },
    { value: 'lip_sync', label: 'Lip Sync' },
    { value: 'skit', label: 'Skit/Comedy' },
    { value: 'cinematic', label: 'Cinematic' },
  ],
  movie: [
    { value: 'trailer', label: 'Trailer Promotion' },
    { value: 'review', label: 'Review/Hype' },
    { value: 'reaction', label: 'Reaction Video' },
  ],
  event: [
    { value: 'announcement', label: 'Announcement' },
    { value: 'hype', label: 'Countdown/Hype' },
    { value: 'coverage', label: 'Event Coverage' },
  ],
  app: [
    { value: 'demo', label: 'App Demo' },
    { value: 'tutorial', label: 'Tutorial' },
    { value: 'review', label: 'Review' },
  ],
  website: [
    { value: 'promo', label: 'Promo/Awareness' },
    { value: 'tutorial', label: 'How-to/Tutorial' },
    { value: 'testimonial', label: 'Testimonial' },
  ],
  product: [
    { value: 'review', label: 'Product Review' },
    { value: 'unboxing', label: 'Unboxing' },
    { value: 'demo', label: 'Demo/Tutorial' },
  ],
  production: [
    { value: 'event', label: 'Event Coverage' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'documentary', label: 'Documentary' },
  ],
};

const PLATFORMS = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
];

const INFLUENCER_TIERS = [
  { value: 'starter', label: 'Starter (1K-10K)', description: 'Budget-friendly reach' },
  { value: 'mid', label: 'Mid (10K-100K)', description: 'Balanced reach & engagement' },
  { value: 'top', label: 'Top (100K-500K)', description: 'High impact campaigns' },
  { value: 'super', label: 'Super (500K+)', description: 'Maximum visibility' },
];

const NIGERIAN_CITIES = [
  'Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 
  'Kaduna', 'Maiduguri', 'Zaria', 'Aba', 'Jos', 'Ilorin', 'Oyo', 'Enugu'
];

const campaignSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  campaign_type: z.string().min(1, 'Campaign type is required'),
  content_style: z.string().min(1, 'Content style is required'),
  platform: z.string().min(1, 'Platform is required'),
  influencer_tier: z.string().min(1, 'Influencer tier is required'),
  total_budget: z.number().min(1000, 'Minimum budget is ₦1,000'),
  max_influencers: z.number().min(1).max(100),
  content_guidelines: z.string().optional(),
  hashtags: z.string().optional(),
  // Music specific
  song_url: z.string().optional(),
  // Movie specific
  movie_title: z.string().optional(),
  trailer_url: z.string().optional(),
  streaming_link: z.string().optional(),
  // Event specific
  event_date: z.string().optional(),
  event_location: z.string().optional(),
  // App specific
  app_name: z.string().optional(),
  app_store_url: z.string().optional(),
  // Website specific
  website_url: z.string().optional(),
  // Product specific
  requires_physical_product: z.boolean().optional(),
  product_name: z.string().optional(),
  product_description: z.string().optional(),
  // Production specific
  production_package: z.string().optional(),
  production_location: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userType: 'artist' | 'business';
  onSuccess: () => void;
}

export function CampaignWizard({ open, onOpenChange, userType, onSuccess }: CampaignWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [productionPackages, setProductionPackages] = useState<any[]>([]);
  const [campaignPricing, setCampaignPricing] = useState<any[]>([]);

  const totalSteps = 4;

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
      campaign_type: userType === 'artist' ? 'music' : 'product',
      content_style: 'dance',
      platform: 'tiktok',
      influencer_tier: 'starter',
      max_influencers: 10,
      requires_physical_product: false,
    },
  });

  const campaignType = watch('campaign_type');
  const contentStyle = watch('content_style');
  const influencerTier = watch('influencer_tier');
  const totalBudget = watch('total_budget');
  const maxInfluencers = watch('max_influencers');
  const requiresPhysicalProduct = watch('requires_physical_product');
  const productionPackage = watch('production_package');

  const budgetPerInfluencer = totalBudget && maxInfluencers ? totalBudget / maxInfluencers : 0;

  useEffect(() => {
    fetchProductionPackages();
    fetchCampaignPricing();
  }, []);

  useEffect(() => {
    // Reset content style when campaign type changes
    const styles = CONTENT_STYLES[campaignType];
    if (styles && styles.length > 0) {
      setValue('content_style', styles[0].value);
    }
  }, [campaignType, setValue]);

  const fetchProductionPackages = async () => {
    const { data } = await supabase
      .from('production_packages')
      .select('*')
      .eq('is_active', true)
      .order('price');
    setProductionPackages(data || []);
  };

  const fetchCampaignPricing = async () => {
    const { data } = await supabase
      .from('campaign_pricing')
      .select('*')
      .eq('is_active', true);
    setCampaignPricing(data || []);
  };

  const getSuggestedPrice = () => {
    const pricing = campaignPricing.find(
      p => p.campaign_type === campaignType && 
           p.content_style === contentStyle && 
           p.influencer_tier === influencerTier
    );
    return pricing?.base_price || 1000;
  };

  const onSubmit = async (data: CampaignFormData) => {
    setIsLoading(true);
    try {
      const hashtags = data.hashtags ? data.hashtags.split(',').map(tag => tag.trim()) : [];
      
      const campaignData: any = {
        creator_id: user?.id,
        title: data.title,
        description: data.description,
        campaign_type: data.campaign_type,
        content_style: data.content_style,
        platform: data.platform,
        influencer_tier: data.influencer_tier,
        budget: data.total_budget,
        budget_per_influencer: budgetPerInfluencer,
        max_influencers: data.max_influencers,
        target_cities: selectedCities,
        content_guidelines: data.content_guidelines,
        hashtags,
        status: 'active',
        escrow_amount: data.total_budget,
        escrow_status: 'held',
      };

      // Add type-specific fields
      switch (data.campaign_type) {
        case 'music':
          campaignData.song_url = data.song_url;
          break;
        case 'movie':
          campaignData.movie_title = data.movie_title;
          campaignData.trailer_url = data.trailer_url;
          campaignData.streaming_link = data.streaming_link;
          break;
        case 'event':
          campaignData.event_date = data.event_date;
          campaignData.event_location = data.event_location;
          break;
        case 'app':
          campaignData.app_name = data.app_name;
          campaignData.app_store_url = data.app_store_url;
          break;
        case 'website':
          campaignData.website_url = data.website_url;
          break;
        case 'product':
          campaignData.requires_physical_product = data.requires_physical_product;
          campaignData.product_details = {
            name: data.product_name,
            description: data.product_description,
          };
          break;
        case 'production':
          campaignData.requires_physical_coverage = true;
          campaignData.production_package = data.production_package;
          campaignData.production_location = data.production_location;
          break;
      }

      const { error } = await supabase
        .from('campaigns')
        .insert([campaignData]);

      if (error) throw error;

      toast.success('Campaign created successfully! Budget held in escrow.');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep(1);
    reset();
    setSelectedCities([]);
  };

  const handleCityToggle = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const getCampaignTypeIcon = (type: string) => {
    const found = CAMPAIGN_TYPES.find(t => t.value === type);
    return found ? found.icon : Package;
  };

  const TypeIcon = getCampaignTypeIcon(campaignType);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className="h-5 w-5 text-primary" />
            Create Campaign
          </DialogTitle>
          <div className="pt-2">
            <Progress value={(step / totalSteps) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {step} of {totalSteps}
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Campaign Type Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">What type of campaign?</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CAMPAIGN_TYPES.filter(t => 
                  userType === 'artist' ? ['music', 'event'].includes(t.value) : true
                ).map((type) => (
                  <Card 
                    key={type.value}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      campaignType === type.value ? 'border-primary bg-primary/5 ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setValue('campaign_type', type.value)}
                  >
                    <CardContent className="p-4 text-center">
                      <type.icon className={`h-8 w-8 mx-auto mb-2 ${
                        campaignType === type.value ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-4">
                <Label>Content Style</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(CONTENT_STYLES[campaignType] || []).map((style) => (
                    <Button
                      key={style.value}
                      type="button"
                      variant={contentStyle === style.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setValue('content_style', style.value)}
                    >
                      {style.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Platform</Label>
                <div className="flex gap-2">
                  {PLATFORMS.map((platform) => (
                    <Button
                      key={platform.value}
                      type="button"
                      variant={watch('platform') === platform.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setValue('platform', platform.value)}
                    >
                      {platform.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Campaign Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Campaign Details</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Campaign Title *</Label>
                  <Input 
                    placeholder="Enter a compelling title"
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea 
                    placeholder="Describe your campaign goals and what you want influencers to create"
                    rows={4}
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>

                {/* Type-specific fields */}
                {campaignType === 'music' && (
                  <div className="p-4 border rounded-lg bg-primary/5 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Music className="h-4 w-4" /> Song Details
                    </h4>
                    <div className="space-y-2">
                      <Label>Song/Sound URL (TikTok, Spotify, or YouTube)</Label>
                      <Input placeholder="https://..." {...register('song_url')} />
                    </div>
                  </div>
                )}

                {campaignType === 'movie' && (
                  <div className="p-4 border rounded-lg bg-primary/5 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Film className="h-4 w-4" /> Movie Details
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label>Movie Title</Label>
                        <Input placeholder="Movie name" {...register('movie_title')} />
                      </div>
                      <div className="space-y-2">
                        <Label>Trailer URL</Label>
                        <Input placeholder="https://youtube.com/..." {...register('trailer_url')} />
                      </div>
                      <div className="space-y-2">
                        <Label>Streaming/Cinema Link (optional)</Label>
                        <Input placeholder="Where to watch" {...register('streaming_link')} />
                      </div>
                    </div>
                  </div>
                )}

                {campaignType === 'event' && (
                  <div className="p-4 border rounded-lg bg-primary/5 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Event Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Event Date</Label>
                        <Input type="date" {...register('event_date')} />
                      </div>
                      <div className="space-y-2">
                        <Label>Event Location</Label>
                        <Input placeholder="City, Venue" {...register('event_location')} />
                      </div>
                    </div>
                  </div>
                )}

                {campaignType === 'app' && (
                  <div className="p-4 border rounded-lg bg-primary/5 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Smartphone className="h-4 w-4" /> App Details
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label>App Name</Label>
                        <Input placeholder="Your app name" {...register('app_name')} />
                      </div>
                      <div className="space-y-2">
                        <Label>App Store URL</Label>
                        <Input placeholder="Play Store or App Store link" {...register('app_store_url')} />
                      </div>
                    </div>
                  </div>
                )}

                {campaignType === 'website' && (
                  <div className="p-4 border rounded-lg bg-primary/5 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Globe className="h-4 w-4" /> Website Details
                    </h4>
                    <div className="space-y-2">
                      <Label>Website URL</Label>
                      <Input placeholder="https://yourwebsite.com" {...register('website_url')} />
                    </div>
                  </div>
                )}

                {campaignType === 'product' && (
                  <div className="p-4 border rounded-lg bg-primary/5 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" /> Product Details
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label>Product Name</Label>
                        <Input placeholder="Product name" {...register('product_name')} />
                      </div>
                      <div className="space-y-2">
                        <Label>Product Description</Label>
                        <Textarea placeholder="Describe your product" {...register('product_description')} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="requires_delivery"
                          checked={requiresPhysicalProduct}
                          onCheckedChange={(checked) => setValue('requires_physical_product', !!checked)}
                        />
                        <Label htmlFor="requires_delivery" className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Requires physical product delivery to influencers
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {campaignType === 'production' && (
                  <div className="p-4 border rounded-lg bg-primary/5 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Camera className="h-4 w-4" /> Production Package
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {productionPackages.map((pkg) => (
                        <Card 
                          key={pkg.id}
                          className={`cursor-pointer transition-all ${
                            productionPackage === pkg.id ? 'border-primary ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setValue('production_package', pkg.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium">{pkg.name}</h5>
                                <p className="text-sm text-muted-foreground">{pkg.description}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {pkg.includes?.map((item: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">₦{pkg.price.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">{pkg.delivery_days} days</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label>Production Location</Label>
                      <Input placeholder="City, Address" {...register('production_location')} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Targeting & Budget */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Budget & Targeting</h3>

              {/* Influencer Tier Selection */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Influencer Tier
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {INFLUENCER_TIERS.map((tier) => (
                    <Card 
                      key={tier.value}
                      className={`cursor-pointer transition-all ${
                        influencerTier === tier.value ? 'border-primary ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setValue('influencer_tier', tier.value)}
                    >
                      <CardContent className="p-4">
                        <p className="font-medium">{tier.label}</p>
                        <p className="text-xs text-muted-foreground">{tier.description}</p>
                        <p className="text-sm font-medium text-primary mt-2">
                          From ₦{getSuggestedPrice().toLocaleString()}/video
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Total Budget (₦)
                  </Label>
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
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex justify-between items-center">
                  <span>Budget per Influencer</span>
                  <span className="font-bold text-lg">₦{budgetPerInfluencer.toLocaleString()}</span>
                </div>
                {budgetPerInfluencer < getSuggestedPrice() && budgetPerInfluencer > 0 && (
                  <p className="text-sm text-warning mt-2">
                    ⚠️ Budget below suggested rate. You may get fewer applications.
                  </p>
                )}
              </div>

              {/* Target Cities */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Target Cities (optional)
                </Label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {NIGERIAN_CITIES.map(city => (
                    <div key={city} className="flex items-center space-x-2">
                      <Checkbox
                        id={city}
                        checked={selectedCities.includes(city)}
                        onCheckedChange={() => handleCityToggle(city)}
                      />
                      <Label htmlFor={city} className="text-sm cursor-pointer">{city}</Label>
                    </div>
                  ))}
                </div>
                {selectedCities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedCities.map(city => (
                      <Badge key={city} variant="secondary">{city}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Guidelines & Review */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Content Guidelines & Review</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Content Guidelines</Label>
                  <Textarea 
                    placeholder="Specify how influencers should create content (style, tone, key messages, do's and don'ts)"
                    rows={4}
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
              </div>

              {/* Campaign Summary */}
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-medium">Campaign Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-2 font-medium capitalize">{campaignType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Style:</span>
                      <span className="ml-2 font-medium capitalize">{contentStyle?.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Platform:</span>
                      <span className="ml-2 font-medium capitalize">{watch('platform')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tier:</span>
                      <span className="ml-2 font-medium capitalize">{influencerTier}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="ml-2 font-medium">₦{totalBudget?.toLocaleString() || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Influencers:</span>
                      <span className="ml-2 font-medium">{maxInfluencers}</span>
                    </div>
                    {selectedCities.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Target Cities:</span>
                        <span className="ml-2 font-medium">{selectedCities.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Per Influencer:</span>
                      <span className="font-bold">₦{budgetPerInfluencer.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      💰 Budget will be held in escrow until content is approved
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={step === 1 ? handleClose : prevStep}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>

            {step < totalSteps ? (
              <Button type="button" onClick={nextStep} className="gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" variant="gradient" disabled={isLoading} className="gap-2">
                {isLoading ? 'Creating...' : 'Launch Campaign'}
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
