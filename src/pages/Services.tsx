import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserLayout } from '@/components/layout/UserLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { 
  Sparkles, 
  Music, 
  Building, 
  Crown,
  Headphones,
  FileVideo,
  Newspaper,
  MapPin,
  Globe,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Wallet,
  Star,
  Package,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

type ServiceType = 
  | 'tiktok_artist_claim'
  | 'audiomack_monetization'
  | 'capcut_template'
  | 'music_blog_basic'
  | 'music_blog_pro'
  | 'music_blog_premium'
  | 'gmb_setup'
  | 'google_maps_optimization'
  | 'business_blog_basic'
  | 'business_blog_pro'
  | 'business_blog_premium'
  | 'seo_content';

interface ServicePackage {
  id: string;
  service_type: ServiceType;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  features: string[] | null;
  category: string;
  delivery_days: number | null;
  is_active: boolean;
}

interface ServiceOrder {
  id: string;
  service_type: ServiceType;
  price_paid: number;
  status: string;
  created_at: string;
  submission_data: any;
}

interface RequiredField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'textarea' | 'file' | 'select' | 'url' | 'email' | 'tel';
  required?: boolean;
  options?: string[];
  helpText?: string;
}

export default function Services() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [submissionData, setSubmissionData] = useState<Record<string, string>>({});

  const urlParams = new URLSearchParams(window.location.search);
  const defaultTab = urlParams.get('tab') === 'business' ? 'business' : 'artist';

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProfile(), fetchPackages(), fetchOrders()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user?.id).maybeSingle();
    setProfile(data);
  };

  const fetchPackages = async () => {
    const { data, error } = await supabase.from('service_packages').select('*').eq('is_active', true).order('price', { ascending: true });
    if (!error && data) setPackages(data as ServicePackage[]);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('service_orders').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    if (!error && data) setOrders(data as ServiceOrder[]);
  };

  const validateRequiredFields = (): boolean => {
    if (!selectedPackage) return false;
    const fields = getRequiredFields(selectedPackage.service_type);
    const missing = fields.filter(f => f.required !== false && !submissionData[f.key]?.trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map(f => f.label).join(', ')}`);
      return false;
    }
    return true;
  };

  const handleOrderService = async () => {
    if (!selectedPackage) return;
    if (!validateRequiredFields()) return;

    if (selectedPackage.price > (profile?.wallet_balance || 0)) {
      toast.error('Insufficient wallet balance');
      return;
    }

    setOrderLoading(true);
    try {
      const { error: orderError } = await supabase.from('service_orders').insert({
        user_id: user?.id,
        service_type: selectedPackage.service_type,
        package_id: selectedPackage.id,
        price_paid: selectedPackage.price,
        currency: selectedPackage.currency,
        submission_data: submissionData,
        status: 'pending'
      });

      if (orderError) throw orderError;

      const { error: walletError } = await supabase.from('profiles').update({ 
        wallet_balance: (profile?.wallet_balance || 0) - selectedPackage.price 
      }).eq('user_id', user?.id);

      if (walletError) throw walletError;

      await supabase.from('wallet_transactions').insert({
        user_id: user?.id,
        transaction_type: 'payment',
        amount: selectedPackage.price,
        description: `Service: ${selectedPackage.name}`,
        status: 'completed',
        reference_id: `SVC-${Date.now()}`
      });

      toast.success('Service ordered successfully! We will process it shortly.');
      setOrderModalOpen(false);
      setSelectedPackage(null);
      setSubmissionData({});
      loadData();
    } catch (error) {
      console.error('Error ordering service:', error);
      toast.error('Failed to order service');
    } finally {
      setOrderLoading(false);
    }
  };

  const getServiceIcon = (type: ServiceType) => {
    switch (type) {
      case 'tiktok_artist_claim': return <Crown className="h-5 w-5" />;
      case 'audiomack_monetization': return <Headphones className="h-5 w-5" />;
      case 'capcut_template': return <FileVideo className="h-5 w-5" />;
      case 'music_blog_basic':
      case 'music_blog_pro':
      case 'music_blog_premium':
      case 'business_blog_basic':
      case 'business_blog_pro':
      case 'business_blog_premium':
        return <Newspaper className="h-5 w-5" />;
      case 'gmb_setup': return <Building className="h-5 w-5" />;
      case 'google_maps_optimization': return <MapPin className="h-5 w-5" />;
      case 'seo_content': return <Search className="h-5 w-5" />;
      default: return <Sparkles className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'processing': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending':
      case 'in_review': return 'bg-warning/10 text-warning border-warning/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getRequiredFields = (type: ServiceType): RequiredField[] => {
    switch (type) {
      case 'tiktok_artist_claim':
        return [
          { key: 'tiktok_username', label: 'TikTok Username', placeholder: '@username', type: 'text', required: true },
          { key: 'artist_name', label: 'Artist/Stage Name', placeholder: 'Your artist name', type: 'text', required: true },
          { key: 'real_name', label: 'Legal Full Name (as on ID)', placeholder: 'John Doe', type: 'text', required: true },
          { key: 'email', label: 'Email Address', placeholder: 'email@example.com', type: 'email', required: true },
          { key: 'phone', label: 'Phone Number (with country code)', placeholder: '+234 800 123 4567', type: 'tel', required: true },
          { key: 'date_of_birth', label: 'Date of Birth', placeholder: 'DD/MM/YYYY', type: 'text', required: true },
          { key: 'country', label: 'Country of Residence', placeholder: 'Nigeria', type: 'text', required: true },
          { key: 'spotify_link', label: 'Spotify Artist Profile Link', placeholder: 'https://open.spotify.com/artist/...', type: 'url', required: true, helpText: 'Must have at least 1 released track on Spotify' },
          { key: 'apple_music_link', label: 'Apple Music Artist Link', placeholder: 'https://music.apple.com/artist/...', type: 'url', required: true },
          { key: 'distributor', label: 'Music Distributor', placeholder: 'DistroKid, TuneCore, CD Baby, etc.', type: 'select', required: true, options: ['DistroKid', 'TuneCore', 'CD Baby', 'Ditto Music', 'United Masters', 'Amuse', 'LANDR', 'RouteNote', 'ONErpm', 'Other'] },
          { key: 'distributor_email', label: 'Distributor Account Email', placeholder: 'Account email used on distributor', type: 'email', required: true, helpText: 'Email registered with your distributor' },
          { key: 'genre', label: 'Primary Music Genre', placeholder: 'Afrobeats, Hip-Hop, etc.', type: 'select', required: true, options: ['Afrobeats', 'Afropop', 'Amapiano', 'Hip-Hop/Rap', 'R&B', 'Dancehall', 'Gospel', 'Highlife', 'Fuji', 'Pop', 'Reggae', 'Other'] },
          { key: 'instagram_handle', label: 'Instagram Handle', placeholder: '@username', type: 'text', required: true },
          { key: 'twitter_handle', label: 'Twitter/X Handle', placeholder: '@username', type: 'text', required: false },
          { key: 'youtube_channel', label: 'YouTube Channel URL', placeholder: 'https://youtube.com/c/...', type: 'url', required: false },
          { key: 'number_of_releases', label: 'Total Number of Releases', placeholder: '5', type: 'text', required: true, helpText: 'Total songs/albums released across all platforms' },
          { key: 'tiktok_follower_count', label: 'Current TikTok Follower Count', placeholder: '10000', type: 'text', required: true },
          { key: 'top_song_name', label: 'Name of Your Most Popular Song', placeholder: 'Song title', type: 'text', required: true },
          { key: 'top_song_link', label: 'Link to Most Popular Song', placeholder: 'https://...', type: 'url', required: true },
          { key: 'id_document', label: 'Government-Issued ID (Passport/National ID)', placeholder: '', type: 'file', required: true, helpText: 'Clear photo or scan, must match legal name' },
          { key: 'artist_photo', label: 'Professional Artist Photo', placeholder: '', type: 'file', required: true, helpText: 'High-quality photo, min 500x500px' },
          { key: 'additional_notes', label: 'Additional Notes', placeholder: 'Any other info we should know...', type: 'textarea', required: false },
        ];

      case 'audiomack_monetization':
        return [
          { key: 'audiomack_profile_url', label: 'Audiomack Profile URL', placeholder: 'https://audiomack.com/username', type: 'url', required: true },
          { key: 'audiomack_username', label: 'Audiomack Username', placeholder: 'username', type: 'text', required: true },
          { key: 'artist_name', label: 'Artist/Display Name', placeholder: 'Your artist name', type: 'text', required: true },
          { key: 'real_name', label: 'Legal Full Name', placeholder: 'As shown on ID', type: 'text', required: true },
          { key: 'email', label: 'Email Address (linked to Audiomack)', placeholder: 'email@example.com', type: 'email', required: true },
          { key: 'phone', label: 'Phone Number', placeholder: '+234 800 123 4567', type: 'tel', required: true },
          { key: 'country', label: 'Country of Residence', placeholder: 'Nigeria', type: 'text', required: true },
          { key: 'date_of_birth', label: 'Date of Birth', placeholder: 'DD/MM/YYYY', type: 'text', required: true },
          { key: 'total_plays', label: 'Current Total Plays on Audiomack', placeholder: '50000', type: 'text', required: true, helpText: 'Approximate total plays across all tracks' },
          { key: 'total_tracks', label: 'Number of Tracks Uploaded', placeholder: '10', type: 'text', required: true },
          { key: 'genre', label: 'Primary Genre', placeholder: 'Afrobeats', type: 'select', required: true, options: ['Afrobeats', 'Afropop', 'Hip-Hop/Rap', 'R&B', 'Dancehall', 'Gospel', 'Amapiano', 'Pop', 'Other'] },
          { key: 'payment_email', label: 'PayPal/Payment Email', placeholder: 'payment@email.com', type: 'email', required: true, helpText: 'Email for receiving monetization payouts' },
          { key: 'bank_name', label: 'Bank Name', placeholder: 'GTBank, Access Bank, etc.', type: 'text', required: true },
          { key: 'bank_account_number', label: 'Bank Account Number', placeholder: '0123456789', type: 'text', required: true },
          { key: 'bank_account_name', label: 'Bank Account Name', placeholder: 'Full name on account', type: 'text', required: true },
          { key: 'id_document', label: 'Government-Issued ID', placeholder: '', type: 'file', required: true, helpText: 'Passport, National ID, or Driver License' },
          { key: 'profile_screenshot', label: 'Audiomack Profile Screenshot', placeholder: '', type: 'file', required: true, helpText: 'Screenshot showing your profile and stats' },
          { key: 'additional_notes', label: 'Additional Notes', placeholder: 'Any extra details...', type: 'textarea', required: false },
        ];

      case 'capcut_template':
        return [
          { key: 'template_style', label: 'Template Style', placeholder: 'Select style', type: 'select', required: true, options: ['Dance Challenge', 'Lyric Video', 'Transition/Edit', 'Skit/Comedy', 'Music Video Montage', 'Product Showcase', 'Before & After', 'Countdown/Top List', 'Tutorial/How-To', 'Other'] },
          { key: 'song_name', label: 'Song/Audio Name', placeholder: 'Name of the song or audio', type: 'text', required: true },
          { key: 'artist_name', label: 'Artist Name', placeholder: 'Who made the song', type: 'text', required: true },
          { key: 'song_duration', label: 'Desired Template Duration', placeholder: 'Select duration', type: 'select', required: true, options: ['15 seconds', '30 seconds', '60 seconds', '90 seconds', 'Full song'] },
          { key: 'target_platform', label: 'Target Platform', placeholder: 'Select platform', type: 'select', required: true, options: ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'All Platforms'] },
          { key: 'mood_vibe', label: 'Mood/Vibe', placeholder: 'Select mood', type: 'select', required: true, options: ['Energetic/Hype', 'Chill/Smooth', 'Dark/Moody', 'Happy/Fun', 'Romantic', 'Aggressive/Hard', 'Emotional/Sad', 'Luxury/Premium'] },
          { key: 'color_scheme', label: 'Preferred Color Scheme', placeholder: 'e.g., Warm tones, Neon, Black & Gold', type: 'text', required: false },
          { key: 'text_overlay', label: 'Text/Lyrics to Display', placeholder: 'Key lyrics or text for the template', type: 'textarea', required: false, helpText: 'Include specific lyrics or text overlays you want' },
          { key: 'reference_video_url', label: 'Reference Video URL (optional)', placeholder: 'https://tiktok.com/...', type: 'url', required: false, helpText: 'Link to a template or video style you like' },
          { key: 'audio_file', label: 'Upload Audio/Music File', placeholder: '', type: 'file', required: true, helpText: 'MP3, WAV, or M4A format' },
          { key: 'reference_video_file', label: 'Upload Reference Video (optional)', placeholder: '', type: 'file', required: false },
          { key: 'brand_assets', label: 'Upload Logo/Brand Assets (optional)', placeholder: '', type: 'file', required: false },
          { key: 'special_requests', label: 'Special Effects & Requests', placeholder: 'Describe specific transitions, effects, or styles you want...', type: 'textarea', required: false },
          { key: 'deadline_preference', label: 'Deadline Preference', placeholder: 'Select urgency', type: 'select', required: false, options: ['Standard (5-7 days)', 'Rush (2-3 days)', 'No rush'] },
        ];

      case 'music_blog_basic':
        return [
          { key: 'artist_name', label: 'Artist Name', placeholder: 'Your artist name', type: 'text', required: true },
          { key: 'song_title', label: 'Song/Project Title', placeholder: 'Name of the song or album', type: 'text', required: true },
          { key: 'release_date', label: 'Release Date', placeholder: 'DD/MM/YYYY', type: 'text', required: true },
          { key: 'genre', label: 'Genre', placeholder: 'Afrobeats, Hip-Hop, etc.', type: 'select', required: true, options: ['Afrobeats', 'Afropop', 'Hip-Hop/Rap', 'R&B', 'Amapiano', 'Pop', 'Gospel', 'Other'] },
          { key: 'streaming_link', label: 'Primary Streaming Link', placeholder: 'https://...', type: 'url', required: true, helpText: 'Spotify, Apple Music, or Audiomack link' },
          { key: 'song_story', label: 'Story Behind the Song', placeholder: 'Tell us the inspiration and story behind this music...', type: 'textarea', required: true, helpText: 'This helps create more engaging blog content' },
          { key: 'target_audience', label: 'Target Audience', placeholder: 'Who should read this?', type: 'text', required: true },
          { key: 'artist_bio', label: 'Short Artist Bio', placeholder: '2-3 sentences about yourself', type: 'textarea', required: true },
          { key: 'social_links', label: 'Social Media Links', placeholder: 'Instagram, Twitter, TikTok URLs', type: 'textarea', required: true },
          { key: 'artwork', label: 'Upload Song/Album Artwork', placeholder: '', type: 'file', required: true, helpText: 'High-res cover art (min 1000x1000px)' },
          { key: 'press_photo', label: 'Upload Press Photo', placeholder: '', type: 'file', required: true },
          { key: 'additional_notes', label: 'Additional Notes', placeholder: 'Any other info for the blog writer...', type: 'textarea', required: false },
        ];

      case 'music_blog_pro':
        return [
          { key: 'artist_name', label: 'Artist Name', placeholder: 'Your artist name', type: 'text', required: true },
          { key: 'song_title', label: 'Song/Project Title', placeholder: 'Name of the song or album', type: 'text', required: true },
          { key: 'project_type', label: 'Project Type', placeholder: 'Select type', type: 'select', required: true, options: ['Single', 'EP', 'Album', 'Mixtape', 'Collaboration'] },
          { key: 'release_date', label: 'Release Date', placeholder: 'DD/MM/YYYY', type: 'text', required: true },
          { key: 'genre', label: 'Genre', placeholder: 'Primary genre', type: 'select', required: true, options: ['Afrobeats', 'Afropop', 'Hip-Hop/Rap', 'R&B', 'Amapiano', 'Pop', 'Gospel', 'Dancehall', 'Highlife', 'Other'] },
          { key: 'streaming_links', label: 'All Streaming Links', placeholder: 'Spotify, Apple Music, Audiomack, YouTube, etc.', type: 'textarea', required: true, helpText: 'List all platform links, one per line' },
          { key: 'song_story', label: 'Detailed Story/Background', placeholder: 'The inspiration, recording process, featured artists, meaning...', type: 'textarea', required: true },
          { key: 'featured_artists', label: 'Featured Artists (if any)', placeholder: 'Name of featured artists', type: 'text', required: false },
          { key: 'producer_credits', label: 'Producer/Engineer Credits', placeholder: 'Produced by...', type: 'text', required: true },
          { key: 'target_audience', label: 'Target Audience', placeholder: 'Who should read this?', type: 'text', required: true },
          { key: 'target_blogs', label: 'Preferred Blog/Publication Type', placeholder: 'Select type', type: 'select', required: true, options: ['Music Industry Blogs', 'Entertainment News', 'Culture/Lifestyle', 'Regional/Local Press', 'Any/All Available'] },
          { key: 'key_message', label: 'Key Message/Angle', placeholder: 'What should the article emphasize?', type: 'textarea', required: true },
          { key: 'artist_bio', label: 'Full Artist Bio', placeholder: 'Comprehensive biography...', type: 'textarea', required: true },
          { key: 'social_links', label: 'All Social Media Links', placeholder: 'Instagram, Twitter, TikTok, YouTube, Facebook...', type: 'textarea', required: true },
          { key: 'past_press', label: 'Previous Press/Features', placeholder: 'Links to past articles or features', type: 'textarea', required: false },
          { key: 'artwork', label: 'Upload Song/Album Artwork', placeholder: '', type: 'file', required: true },
          { key: 'press_photos', label: 'Upload Press Photos (2-3)', placeholder: '', type: 'file', required: true },
          { key: 'music_video_link', label: 'Music Video Link (if available)', placeholder: 'https://youtube.com/...', type: 'url', required: false },
          { key: 'additional_notes', label: 'Additional Notes & Keywords', placeholder: 'SEO keywords, specific blogs to target, etc.', type: 'textarea', required: false },
        ];

      case 'music_blog_premium':
        return [
          { key: 'artist_name', label: 'Artist Name', placeholder: 'Your artist name', type: 'text', required: true },
          { key: 'song_title', label: 'Song/Project Title', placeholder: 'Name of the song or album', type: 'text', required: true },
          { key: 'project_type', label: 'Project Type', placeholder: 'Select type', type: 'select', required: true, options: ['Single', 'EP', 'Album', 'Mixtape', 'Collaboration', 'Deluxe Edition'] },
          { key: 'release_date', label: 'Release Date', placeholder: 'DD/MM/YYYY', type: 'text', required: true },
          { key: 'genre', label: 'Primary Genre', placeholder: 'Select genre', type: 'select', required: true, options: ['Afrobeats', 'Afropop', 'Hip-Hop/Rap', 'R&B', 'Amapiano', 'Pop', 'Gospel', 'Dancehall', 'Highlife', 'Fuji', 'Other'] },
          { key: 'sub_genre', label: 'Sub-Genre (if applicable)', placeholder: 'e.g., Drill, Lo-fi, etc.', type: 'text', required: false },
          { key: 'streaming_links', label: 'All Streaming Platform Links', placeholder: 'List all platform links...', type: 'textarea', required: true },
          { key: 'song_story', label: 'Full Press Release / Story', placeholder: 'Comprehensive story, inspiration, vision, impact...', type: 'textarea', required: true, helpText: 'The more detail you provide, the better the article will be' },
          { key: 'featured_artists', label: 'Featured Artists & Collaborators', placeholder: 'Names and roles', type: 'text', required: false },
          { key: 'producer_credits', label: 'Full Production Credits', placeholder: 'Producers, engineers, mixers, masters...', type: 'textarea', required: true },
          { key: 'record_label', label: 'Record Label (if any)', placeholder: 'Label name', type: 'text', required: false },
          { key: 'management', label: 'Management Contact', placeholder: 'Manager name & email', type: 'text', required: false },
          { key: 'target_audience', label: 'Target Audience & Demographics', placeholder: 'Age range, location, interests...', type: 'textarea', required: true },
          { key: 'campaign_goal', label: 'Campaign Goal', placeholder: 'What do you want to achieve?', type: 'select', required: true, options: ['Build Awareness', 'Drive Streams', 'Build Credibility', 'Expand Fanbase', 'Industry Recognition', 'All of the Above'] },
          { key: 'target_publications', label: 'Target Publications/Blogs', placeholder: 'Specific blogs or types you want', type: 'textarea', required: true },
          { key: 'key_messages', label: 'Key Messages / PR Angles', placeholder: 'What narratives should the articles push?', type: 'textarea', required: true },
          { key: 'artist_bio', label: 'Full Artist Biography', placeholder: 'Complete biography for press...', type: 'textarea', required: true },
          { key: 'achievements', label: 'Notable Achievements/Milestones', placeholder: 'Awards, chart positions, notable features...', type: 'textarea', required: true },
          { key: 'social_links', label: 'All Social Media Links', placeholder: 'Every social platform...', type: 'textarea', required: true },
          { key: 'past_press', label: 'Previous Press Coverage', placeholder: 'Links to past articles, interviews, features', type: 'textarea', required: false },
          { key: 'artwork', label: 'Upload Official Artwork', placeholder: '', type: 'file', required: true },
          { key: 'press_kit', label: 'Upload Press Kit / EPK', placeholder: '', type: 'file', required: true, helpText: 'PDF or ZIP with photos, bio, and press materials' },
          { key: 'press_photos', label: 'Upload High-Res Press Photos', placeholder: '', type: 'file', required: true },
          { key: 'music_video_link', label: 'Music Video / Visualizer Link', placeholder: 'https://youtube.com/...', type: 'url', required: false },
          { key: 'behind_scenes', label: 'Behind-the-Scenes Content (optional)', placeholder: '', type: 'file', required: false },
          { key: 'seo_keywords', label: 'SEO Keywords to Target', placeholder: 'Comma-separated keywords', type: 'text', required: false },
          { key: 'additional_notes', label: 'Additional Instructions', placeholder: 'Special requests, deadlines, or directions...', type: 'textarea', required: false },
        ];

      case 'gmb_setup':
        return [
          { key: 'business_name', label: 'Business Name (Exact)', placeholder: 'Your Business Name', type: 'text', required: true, helpText: 'Must match your official business name exactly' },
          { key: 'business_category', label: 'Business Category', placeholder: 'Select category', type: 'select', required: true, options: ['Restaurant/Food', 'Beauty Salon/Spa', 'Retail Store', 'Hotel/Hospitality', 'Medical/Health', 'Auto Services', 'Real Estate', 'Professional Services', 'Education/Training', 'Fitness/Gym', 'Tech/IT Services', 'Other'] },
          { key: 'business_address', label: 'Full Business Address', placeholder: '123 Main Street, Victoria Island, Lagos', type: 'text', required: true },
          { key: 'city', label: 'City', placeholder: 'Lagos', type: 'text', required: true },
          { key: 'state', label: 'State', placeholder: 'Lagos', type: 'text', required: true },
          { key: 'country', label: 'Country', placeholder: 'Nigeria', type: 'text', required: true },
          { key: 'postal_code', label: 'Postal/ZIP Code', placeholder: '100001', type: 'text', required: false },
          { key: 'phone', label: 'Business Phone Number', placeholder: '+234 800 123 4567', type: 'tel', required: true },
          { key: 'whatsapp', label: 'WhatsApp Number (if different)', placeholder: '+234...', type: 'tel', required: false },
          { key: 'email', label: 'Business Email', placeholder: 'info@business.com', type: 'email', required: true },
          { key: 'website', label: 'Website URL (if any)', placeholder: 'https://www.mybusiness.com', type: 'url', required: false },
          { key: 'business_hours_weekday', label: 'Weekday Hours', placeholder: 'Mon-Fri: 9:00 AM - 6:00 PM', type: 'text', required: true },
          { key: 'business_hours_weekend', label: 'Weekend Hours', placeholder: 'Sat: 10AM-4PM, Sun: Closed', type: 'text', required: true },
          { key: 'business_description', label: 'Business Description', placeholder: 'What does your business do? What products/services do you offer?', type: 'textarea', required: true, helpText: 'Will be used as your GMB description (max 750 chars)' },
          { key: 'services_offered', label: 'List of Services/Products', placeholder: 'Service 1, Service 2, Service 3...', type: 'textarea', required: true },
          { key: 'target_keywords', label: 'Keywords Customers Search For', placeholder: 'e.g., best restaurant in Lagos, hair salon near me', type: 'textarea', required: true },
          { key: 'google_account_email', label: 'Google Account Email (for GMB)', placeholder: 'youremail@gmail.com', type: 'email', required: true, helpText: 'Must be a Gmail or Google Workspace email' },
          { key: 'verification_method', label: 'Preferred Verification Method', placeholder: 'Select method', type: 'select', required: true, options: ['Postcard (Mail)', 'Phone Call', 'Email', 'Video Verification', 'Not Sure'] },
          { key: 'business_logo', label: 'Upload Business Logo', placeholder: '', type: 'file', required: true, helpText: 'PNG or JPG, min 250x250px' },
          { key: 'business_photos', label: 'Upload Business Photos (3-5)', placeholder: '', type: 'file', required: true, helpText: 'Interior, exterior, products, team photos' },
          { key: 'business_registration', label: 'Upload Business Registration Document', placeholder: '', type: 'file', required: false, helpText: 'CAC Certificate or business permit' },
          { key: 'additional_notes', label: 'Special Instructions', placeholder: 'Any specific requirements or preferences...', type: 'textarea', required: false },
        ];

      case 'google_maps_optimization':
        return [
          { key: 'gmb_listing_url', label: 'Google My Business Listing URL', placeholder: 'https://g.page/...', type: 'url', required: true, helpText: 'Your existing GMB listing link' },
          { key: 'business_name', label: 'Business Name', placeholder: 'Your Business Name', type: 'text', required: true },
          { key: 'business_category', label: 'Business Category', placeholder: 'Select category', type: 'select', required: true, options: ['Restaurant/Food', 'Beauty Salon/Spa', 'Retail Store', 'Hotel/Hospitality', 'Medical/Health', 'Auto Services', 'Real Estate', 'Professional Services', 'Education/Training', 'Fitness/Gym', 'Tech/IT Services', 'Other'] },
          { key: 'business_address', label: 'Full Business Address', placeholder: 'Complete address', type: 'text', required: true },
          { key: 'phone', label: 'Business Phone', placeholder: '+234 800 123 4567', type: 'tel', required: true },
          { key: 'website', label: 'Website URL', placeholder: 'https://...', type: 'url', required: false },
          { key: 'current_reviews', label: 'Current Number of Reviews', placeholder: '15', type: 'text', required: true },
          { key: 'current_rating', label: 'Current Google Rating', placeholder: '4.2', type: 'text', required: true },
          { key: 'target_keywords', label: 'Keywords You Want to Rank For', placeholder: 'e.g., best pizza in Lekki, hair braiding near me', type: 'textarea', required: true },
          { key: 'competitors', label: 'Top 3 Competitors', placeholder: 'List competitor names or Google Maps links', type: 'textarea', required: true, helpText: 'We will analyze their strategy' },
          { key: 'target_areas', label: 'Target Service Areas', placeholder: 'Areas/neighborhoods you serve', type: 'textarea', required: true },
          { key: 'business_description', label: 'Updated Business Description', placeholder: 'Current or ideal business description...', type: 'textarea', required: true },
          { key: 'services_list', label: 'Complete Services/Products List', placeholder: 'All services with descriptions', type: 'textarea', required: true },
          { key: 'business_hours', label: 'Business Hours', placeholder: 'Mon-Fri 9AM-5PM, Sat 10AM-2PM', type: 'text', required: true },
          { key: 'google_account_email', label: 'Google Account Email', placeholder: 'email@gmail.com', type: 'email', required: true },
          { key: 'updated_photos', label: 'Upload New Business Photos (5+)', placeholder: '', type: 'file', required: true, helpText: 'Fresh interior/exterior, product, team, and action photos' },
          { key: 'additional_notes', label: 'Specific Goals & Notes', placeholder: 'What ranking or visibility goals do you have?', type: 'textarea', required: false },
        ];

      case 'business_blog_basic':
        return [
          { key: 'business_name', label: 'Business Name', placeholder: 'Your Business', type: 'text', required: true },
          { key: 'industry', label: 'Industry/Sector', placeholder: 'Select industry', type: 'select', required: true, options: ['Food & Beverage', 'Beauty & Fashion', 'Technology', 'Health & Wellness', 'Real Estate', 'Education', 'Finance', 'Retail/E-commerce', 'Agriculture', 'Entertainment', 'Other'] },
          { key: 'article_topic', label: 'Article Topic/Title', placeholder: 'What should the article be about?', type: 'text', required: true },
          { key: 'key_points', label: 'Key Points to Cover', placeholder: 'Main topics, features, benefits to highlight...', type: 'textarea', required: true },
          { key: 'target_audience', label: 'Target Audience', placeholder: 'Who should read this?', type: 'text', required: true },
          { key: 'website_url', label: 'Business Website', placeholder: 'https://...', type: 'url', required: false },
          { key: 'social_links', label: 'Social Media Links', placeholder: 'Instagram, Facebook, Twitter...', type: 'textarea', required: true },
          { key: 'brand_voice', label: 'Brand Voice/Tone', placeholder: 'Select tone', type: 'select', required: true, options: ['Professional', 'Casual/Friendly', 'Authoritative', 'Inspirational', 'Humorous', 'Luxury/Premium'] },
          { key: 'company_logo', label: 'Upload Company Logo', placeholder: '', type: 'file', required: true },
          { key: 'product_photos', label: 'Upload Product/Service Photos', placeholder: '', type: 'file', required: false },
          { key: 'additional_notes', label: 'Additional Notes', placeholder: 'Any other info...', type: 'textarea', required: false },
        ];

      case 'business_blog_pro':
        return [
          { key: 'business_name', label: 'Business Name', placeholder: 'Your Business', type: 'text', required: true },
          { key: 'industry', label: 'Industry/Sector', placeholder: 'Select industry', type: 'select', required: true, options: ['Food & Beverage', 'Beauty & Fashion', 'Technology', 'Health & Wellness', 'Real Estate', 'Education', 'Finance', 'Retail/E-commerce', 'Agriculture', 'Entertainment', 'Other'] },
          { key: 'number_of_articles', label: 'Number of Articles', placeholder: 'How many articles?', type: 'select', required: true, options: ['1 Article', '2 Articles', '3 Articles', '5 Articles'] },
          { key: 'article_topics', label: 'Article Topics/Titles', placeholder: 'List each article topic on a new line', type: 'textarea', required: true },
          { key: 'key_points', label: 'Key Messages & Value Props', placeholder: 'Main selling points, unique advantages...', type: 'textarea', required: true },
          { key: 'target_audience', label: 'Target Audience & Demographics', placeholder: 'Age, location, interests...', type: 'textarea', required: true },
          { key: 'seo_keywords', label: 'SEO Keywords to Target', placeholder: 'Comma-separated keywords', type: 'text', required: true },
          { key: 'target_publications', label: 'Preferred Blog/Publication Type', placeholder: 'Select type', type: 'select', required: true, options: ['Business/Industry', 'Lifestyle/Culture', 'Technology', 'News/Media', 'Niche/Specialized', 'Any Available'] },
          { key: 'website_url', label: 'Business Website', placeholder: 'https://...', type: 'url', required: true },
          { key: 'social_links', label: 'All Social Media Links', placeholder: 'Instagram, Facebook, Twitter, LinkedIn...', type: 'textarea', required: true },
          { key: 'brand_voice', label: 'Brand Voice/Tone', placeholder: 'Select tone', type: 'select', required: true, options: ['Professional', 'Casual/Friendly', 'Authoritative', 'Inspirational', 'Humorous', 'Luxury/Premium'] },
          { key: 'company_bio', label: 'Company Description/Bio', placeholder: 'About your business...', type: 'textarea', required: true },
          { key: 'company_logo', label: 'Upload Company Logo', placeholder: '', type: 'file', required: true },
          { key: 'brand_assets', label: 'Upload Brand Photos/Assets', placeholder: '', type: 'file', required: true },
          { key: 'additional_notes', label: 'Additional Instructions', placeholder: 'Special requests, CTA to include, etc.', type: 'textarea', required: false },
        ];

      case 'business_blog_premium':
        return [
          { key: 'business_name', label: 'Business Name', placeholder: 'Your Business', type: 'text', required: true },
          { key: 'industry', label: 'Industry/Sector', placeholder: 'Select industry', type: 'select', required: true, options: ['Food & Beverage', 'Beauty & Fashion', 'Technology', 'Health & Wellness', 'Real Estate', 'Education', 'Finance', 'Retail/E-commerce', 'Agriculture', 'Entertainment', 'Other'] },
          { key: 'campaign_objective', label: 'Campaign Objective', placeholder: 'Select objective', type: 'select', required: true, options: ['Brand Awareness', 'Lead Generation', 'Product Launch', 'Thought Leadership', 'Crisis Management/PR', 'Reputation Building'] },
          { key: 'number_of_articles', label: 'Number of Articles', placeholder: 'How many articles?', type: 'select', required: true, options: ['3 Articles', '5 Articles', '7 Articles', '10 Articles'] },
          { key: 'article_topics', label: 'Article Topics & Angles', placeholder: 'Detailed topics for each article...', type: 'textarea', required: true },
          { key: 'key_messages', label: 'Key Messages & Narratives', placeholder: 'Core messages to push across all articles...', type: 'textarea', required: true },
          { key: 'target_audience', label: 'Target Audience & Demographics', placeholder: 'Detailed audience profile...', type: 'textarea', required: true },
          { key: 'seo_keywords', label: 'SEO Keywords & Phrases', placeholder: 'Primary and secondary keywords...', type: 'textarea', required: true },
          { key: 'target_publications', label: 'Target Publications', placeholder: 'Specific blogs, news sites, or types', type: 'textarea', required: true },
          { key: 'website_url', label: 'Business Website', placeholder: 'https://...', type: 'url', required: true },
          { key: 'landing_page', label: 'Landing Page for CTA', placeholder: 'https://...', type: 'url', required: false },
          { key: 'social_links', label: 'All Social Media Links', placeholder: 'Every platform...', type: 'textarea', required: true },
          { key: 'brand_voice', label: 'Brand Voice & Guidelines', placeholder: 'Tone, style, do/don\'t...', type: 'textarea', required: true },
          { key: 'company_bio', label: 'Full Company Profile', placeholder: 'Comprehensive company overview...', type: 'textarea', required: true },
          { key: 'founder_bio', label: 'Founder/CEO Bio', placeholder: 'For thought leadership pieces', type: 'textarea', required: false },
          { key: 'usp', label: 'Unique Selling Proposition', placeholder: 'What makes your business different?', type: 'textarea', required: true },
          { key: 'testimonials', label: 'Customer Testimonials', placeholder: 'Real quotes from customers...', type: 'textarea', required: false },
          { key: 'company_logo', label: 'Upload Company Logo', placeholder: '', type: 'file', required: true },
          { key: 'brand_kit', label: 'Upload Brand Kit/Media Pack', placeholder: '', type: 'file', required: true, helpText: 'Logo variations, fonts, colors, photos' },
          { key: 'product_photos', label: 'Upload Product/Service Photos', placeholder: '', type: 'file', required: true },
          { key: 'executive_photos', label: 'Upload Executive/Team Photos', placeholder: '', type: 'file', required: false },
          { key: 'additional_notes', label: 'Special Instructions & Deadlines', placeholder: 'Timeline, special requirements, etc.', type: 'textarea', required: false },
        ];

      case 'seo_content':
        return [
          { key: 'business_name', label: 'Business/Brand Name', placeholder: 'Your Business', type: 'text', required: true },
          { key: 'website_url', label: 'Website URL', placeholder: 'https://...', type: 'url', required: true },
          { key: 'industry', label: 'Industry', placeholder: 'Select industry', type: 'select', required: true, options: ['E-commerce', 'SaaS/Technology', 'Health & Wellness', 'Finance', 'Education', 'Real Estate', 'Legal', 'Food & Beverage', 'Fashion/Beauty', 'Other'] },
          { key: 'content_type', label: 'Content Type Needed', placeholder: 'Select type', type: 'select', required: true, options: ['Blog Posts', 'Landing Page Copy', 'Product Descriptions', 'Service Pages', 'About Page', 'Full Website Copy', 'All of the Above'] },
          { key: 'number_of_pages', label: 'Number of Pages/Articles', placeholder: 'How many pieces?', type: 'select', required: true, options: ['1 Page', '3 Pages', '5 Pages', '10 Pages', '15+ Pages'] },
          { key: 'target_keywords', label: 'Primary Target Keywords', placeholder: 'Comma-separated keywords', type: 'textarea', required: true },
          { key: 'secondary_keywords', label: 'Secondary/Long-tail Keywords', placeholder: 'Additional keywords...', type: 'textarea', required: false },
          { key: 'target_audience', label: 'Target Audience', placeholder: 'Who are you trying to reach?', type: 'textarea', required: true },
          { key: 'competitor_urls', label: 'Competitor Website URLs', placeholder: 'List competitor URLs, one per line', type: 'textarea', required: true },
          { key: 'brand_voice', label: 'Brand Voice/Tone', placeholder: 'Select tone', type: 'select', required: true, options: ['Professional', 'Conversational', 'Technical', 'Persuasive', 'Educational', 'Luxury'] },
          { key: 'existing_content', label: 'Existing Content URL (to improve)', placeholder: 'https://...', type: 'url', required: false },
          { key: 'cta_goals', label: 'Call-to-Action Goals', placeholder: 'What should readers do? Buy, sign up, contact, etc.', type: 'textarea', required: true },
          { key: 'company_logo', label: 'Upload Company Logo', placeholder: '', type: 'file', required: false },
          { key: 'brand_guidelines', label: 'Upload Brand Guidelines (if any)', placeholder: '', type: 'file', required: false },
          { key: 'additional_notes', label: 'Additional Requirements', placeholder: 'Word count, deadlines, specific pages...', type: 'textarea', required: false },
        ];

      default:
        return [
          { key: 'full_name', label: 'Full Name', placeholder: 'Your full name', type: 'text', required: true },
          { key: 'email', label: 'Email Address', placeholder: 'email@example.com', type: 'email', required: true },
          { key: 'phone', label: 'Phone Number', placeholder: '+234...', type: 'tel', required: true },
          { key: 'details', label: 'Detailed Requirements', placeholder: 'Tell us exactly what you need...', type: 'textarea', required: true },
          { key: 'attachments', label: 'Attachments (optional)', placeholder: '', type: 'file', required: false },
        ];
    }
  };

  const artistPackages = packages.filter(p => p.category === 'artist');
  const businessPackages = packages.filter(p => p.category === 'business');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const renderServiceCards = (pkgs: ServicePackage[], accentClass: string) => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pkgs.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">No services available yet</h3>
          <p className="text-sm text-muted-foreground">Check back soon for new services</p>
        </div>
      ) : (
        pkgs.map((pkg) => (
          <Card key={pkg.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg ${accentClass} flex items-center justify-center`}>
                  {getServiceIcon(pkg.service_type)}
                </div>
                {pkg.name.includes('Premium') && (
                  <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{pkg.name}</CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {pkg.features && (
                <ul className="space-y-2">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
              {pkg.delivery_days && (
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Delivery in {pkg.delivery_days} days</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4 flex items-center justify-between">
              <p className="text-2xl font-bold">₦{pkg.price.toLocaleString()}</p>
              <Button 
                onClick={() => { setSelectedPackage(pkg); setSubmissionData({}); setOrderModalOpen(true); }}
                variant="gradient"
              >
                Order Now
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Growth Services
          </h1>
          <p className="text-muted-foreground">Premium services to accelerate your growth</p>
        </div>

        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-xl font-bold">₦{(profile?.wallet_balance || 0).toLocaleString()}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/wallet">Fund Wallet</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="artist" className="gap-2"><Music className="h-4 w-4" />Artist Services</TabsTrigger>
            <TabsTrigger value="business" className="gap-2"><Building className="h-4 w-4" />Business Services</TabsTrigger>
            <TabsTrigger value="my-orders" className="gap-2"><Package className="h-4 w-4" />My Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="artist">
            {renderServiceCards(artistPackages, 'bg-primary/10 text-primary')}
          </TabsContent>

          <TabsContent value="business">
            {renderServiceCards(businessPackages, 'bg-success/10 text-success')}
          </TabsContent>

          <TabsContent value="my-orders">
            <Card>
              <CardHeader><CardTitle>My Service Orders</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No orders yet</h3>
                    <p className="text-sm text-muted-foreground">Order a service to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              {getServiceIcon(order.service_type)}
                            </div>
                            <div>
                              <h4 className="font-medium capitalize">{order.service_type.replace(/_/g, ' ')}</h4>
                              <p className="text-sm text-muted-foreground">Ordered {new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Amount Paid</span>
                          <span className="font-medium">₦{order.price_paid.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Modal */}
      <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Order {selectedPackage?.name}</DialogTitle>
            <DialogDescription>Fill in all required information to proceed</DialogDescription>
          </DialogHeader>
          
          {selectedPackage && (
            <div className="flex flex-col gap-4 flex-1 overflow-hidden">
              <Card className="bg-muted/50 shrink-0">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <span>Service Price</span>
                    <span className="text-xl font-bold">₦{selectedPackage.price.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                    <span>Your Balance</span>
                    <span>₦{(profile?.wallet_balance || 0).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                {getRequiredFields(selectedPackage.service_type).map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="flex items-center gap-1">
                      {field.label}
                      {field.required !== false && <span className="text-destructive">*</span>}
                    </Label>
                    {field.helpText && (
                      <p className="text-xs text-muted-foreground">{field.helpText}</p>
                    )}
                    {field.type === 'file' ? (
                      <FileUpload
                        bucket="service-documents"
                        folder={user?.id}
                        accept="image/*,application/pdf,video/*,.zip"
                        maxSize={10}
                        multiple={field.key.includes('photos') || field.key.includes('kit') || field.key.includes('assets')}
                        onUploadComplete={(urls) => setSubmissionData(prev => ({ 
                          ...prev, 
                          [field.key]: urls.join(',')
                        }))}
                        hint={field.key.includes('photos') ? 'Upload multiple images' : 'Max 10MB per file'}
                      />
                    ) : field.type === 'select' && field.options ? (
                      <Select
                        value={submissionData[field.key] || ''}
                        onValueChange={(value) => setSubmissionData(prev => ({ ...prev, [field.key]: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'textarea' ? (
                      <Textarea
                        placeholder={field.placeholder}
                        value={submissionData[field.key] || ''}
                        onChange={(e) => setSubmissionData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        rows={3}
                      />
                    ) : (
                      <Input
                        type={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
                        placeholder={field.placeholder}
                        value={submissionData[field.key] || ''}
                        onChange={(e) => setSubmissionData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="shrink-0 pt-2 border-t">
                {selectedPackage.price > (profile?.wallet_balance || 0) ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                      <p className="text-sm font-medium text-destructive">Insufficient Balance</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You need ₦{(selectedPackage.price - (profile?.wallet_balance || 0)).toLocaleString()} more.
                      </p>
                    </div>
                    <Button variant="gradient" className="w-full gap-2" asChild>
                      <a href="/wallet"><Wallet className="h-4 w-4" />Top Up Wallet</a>
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleOrderService}
                    disabled={orderLoading}
                    className="w-full"
                    variant="gradient"
                  >
                    {orderLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                    ) : (
                      `Pay ₦${selectedPackage.price.toLocaleString()}`
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </UserLayout>
  );
}
