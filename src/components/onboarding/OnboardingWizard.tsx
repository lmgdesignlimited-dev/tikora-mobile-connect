import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Music, User, Briefcase, MapPin, Link as LinkIcon, Camera, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface OnboardingWizardProps {
  userType: 'artist' | 'influencer' | 'business';
  onComplete: () => void;
}

const artistSteps = [
  { id: 'profile', title: 'Profile Setup', description: 'Basic info and bio' },
  { id: 'music', title: 'Music Links', description: 'Spotify, Apple Music, etc.' },
  { id: 'social', title: 'Social Media', description: 'Connect your accounts' },
  { id: 'verification', title: 'Verification', description: 'Verify your identity' },
];

const influencerSteps = [
  { id: 'profile', title: 'Profile Setup', description: 'Basic info and bio' },
  { id: 'tiktok', title: 'TikTok Verification', description: 'Connect your TikTok' },
  { id: 'social', title: 'Other Platforms', description: 'Instagram, YouTube, etc.' },
  { id: 'preferences', title: 'Preferences', description: 'Content preferences' },
];

const businessSteps = [
  { id: 'profile', title: 'Business Profile', description: 'Company info' },
  { id: 'brand', title: 'Brand Details', description: 'Logo and description' },
  { id: 'category', title: 'Category', description: 'Industry and focus' },
  { id: 'goals', title: 'Goals', description: 'Marketing objectives' },
];

export function OnboardingWizard({ userType, onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const steps = userType === 'artist' 
    ? artistSteps 
    : userType === 'influencer' 
      ? influencerSteps 
      : businessSteps;

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      // Update profile with onboarding data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          bio: formData.bio,
          location: formData.location,
          city: formData.city,
          country: formData.country,
          social_links: {
            tiktok: formData.tiktok,
            instagram: formData.instagram,
            youtube: formData.youtube,
            spotify: formData.spotify,
            twitter: formData.twitter,
            website: formData.website,
          },
        })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      // Mark onboarding as complete
      const { error: onboardingError } = await supabase
        .from('onboarding_progress')
        .upsert({
          user_id: user?.id,
          user_type: userType,
          current_step: steps.length,
          total_steps: steps.length,
          is_completed: true,
          profile_completed: true,
        });

      if (onboardingError) throw onboardingError;

      toast.success('Onboarding complete! Welcome to Tikora!');
      onComplete();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    if (step.id === 'profile') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              placeholder={`Tell us about yourself as ${userType === 'business' ? 'a brand' : `an ${userType}`}...`}
              value={formData.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                placeholder="Your city"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Select
                value={formData.country || ''}
                onValueChange={(value) => handleInputChange('country', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nigeria">Nigeria</SelectItem>
                  <SelectItem value="Ghana">Ghana</SelectItem>
                  <SelectItem value="Kenya">Kenya</SelectItem>
                  <SelectItem value="South Africa">South Africa</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );
    }

    if (step.id === 'music' || step.id === 'tiktok') {
      return (
        <div className="space-y-4">
          {userType === 'artist' && (
            <>
              <div className="space-y-2">
                <Label>Spotify Artist Link</Label>
                <Input
                  placeholder="https://open.spotify.com/artist/..."
                  value={formData.spotify || ''}
                  onChange={(e) => handleInputChange('spotify', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>TikTok Sound URL</Label>
                <Input
                  placeholder="https://www.tiktok.com/music/..."
                  value={formData.tiktok_sound || ''}
                  onChange={(e) => handleInputChange('tiktok_sound', e.target.value)}
                />
              </div>
            </>
          )}
          {userType === 'influencer' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>TikTok Username</Label>
                <Input
                  placeholder="@yourusername"
                  value={formData.tiktok || ''}
                  onChange={(e) => handleInputChange('tiktok', e.target.value)}
                />
              </div>
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">How to verify:</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Make sure your TikTok profile is public</li>
                  <li>Add "Tikora Creator" to your bio temporarily</li>
                  <li>We'll verify your followers and engagement</li>
                </ol>
              </div>
              <Button variant="outline" className="w-full">
                <Smartphone className="h-4 w-4 mr-2" />
                Verify TikTok Account
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (step.id === 'social') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>TikTok</Label>
            <Input
              placeholder="@yourusername"
              value={formData.tiktok || ''}
              onChange={(e) => handleInputChange('tiktok', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Instagram</Label>
            <Input
              placeholder="@yourusername"
              value={formData.instagram || ''}
              onChange={(e) => handleInputChange('instagram', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>YouTube</Label>
            <Input
              placeholder="Channel URL"
              value={formData.youtube || ''}
              onChange={(e) => handleInputChange('youtube', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Twitter/X</Label>
            <Input
              placeholder="@yourusername"
              value={formData.twitter || ''}
              onChange={(e) => handleInputChange('twitter', e.target.value)}
            />
          </div>
        </div>
      );
    }

    if (step.id === 'brand') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              placeholder="https://yourcompany.com"
              value={formData.website || ''}
              onChange={(e) => handleInputChange('website', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Brand Description</Label>
            <Textarea
              placeholder="Describe your brand and what you do..."
              value={formData.brand_description || ''}
              onChange={(e) => handleInputChange('brand_description', e.target.value)}
              rows={3}
            />
          </div>
        </div>
      );
    }

    if (step.id === 'category') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Industry</Label>
            <Select
              value={formData.industry || ''}
              onValueChange={(value) => handleInputChange('industry', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fashion">Fashion & Beauty</SelectItem>
                <SelectItem value="food">Food & Beverage</SelectItem>
                <SelectItem value="tech">Technology</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="health">Health & Wellness</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    if (step.id === 'verification' || step.id === 'preferences' || step.id === 'goals') {
      return (
        <div className="space-y-4 text-center py-6">
          <Check className="h-16 w-16 text-success mx-auto" />
          <div>
            <h3 className="font-semibold text-lg">Almost Done!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Click "Complete" to finish your onboarding and start exploring Tikora.
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  const getStepIcon = () => {
    if (userType === 'artist') return <Music className="h-6 w-6" />;
    if (userType === 'influencer') return <User className="h-6 w-6" />;
    return <Briefcase className="h-6 w-6" />;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            {getStepIcon()}
          </div>
          <CardTitle>Welcome to Tikora!</CardTitle>
          <CardDescription>
            Let's set up your {userType} profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="font-medium">{steps[currentStep].title}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : index === currentStep
                        ? 'border-2 border-primary'
                        : 'border-2 border-muted'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[200px]">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={isLoading}
              variant="gradient"
            >
              {isLoading ? (
                'Processing...'
              ) : currentStep === steps.length - 1 ? (
                'Complete'
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
