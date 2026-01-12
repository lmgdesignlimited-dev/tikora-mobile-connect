export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string
          category: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_featured: boolean | null
          like_count: number | null
          published_at: string | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id: string
          category?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          like_count?: number | null
          published_at?: string | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          like_count?: number | null
          published_at?: string | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      boost_packages: {
        Row: {
          boost_multiplier: number
          boost_type: string
          coin_cost: number
          created_at: string
          description: string | null
          duration_hours: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          boost_multiplier?: number
          boost_type: string
          coin_cost: number
          created_at?: string
          description?: string | null
          duration_hours: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          boost_multiplier?: number
          boost_type?: string
          coin_cost?: number
          created_at?: string
          description?: string | null
          duration_hours?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      boost_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      campaign_applications: {
        Row: {
          campaign_id: string
          created_at: string
          estimated_reach: number | null
          id: string
          influencer_id: string
          payment_status: string | null
          portfolio_links: string[] | null
          proposal: string | null
          proposed_rate: number | null
          status: string | null
          submission_date: string | null
          submitted_content_url: string | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          estimated_reach?: number | null
          id?: string
          influencer_id: string
          payment_status?: string | null
          portfolio_links?: string[] | null
          proposal?: string | null
          proposed_rate?: number | null
          status?: string | null
          submission_date?: string | null
          submitted_content_url?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          estimated_reach?: number | null
          id?: string
          influencer_id?: string
          payment_status?: string | null
          portfolio_links?: string[] | null
          proposal?: string | null
          proposed_rate?: number | null
          status?: string | null
          submission_date?: string | null
          submitted_content_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_applications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_pricing: {
        Row: {
          base_price: number
          campaign_type: string
          content_style: string
          created_at: string
          id: string
          influencer_tier: string
          is_active: boolean | null
          region: string | null
          updated_at: string
        }
        Insert: {
          base_price?: number
          campaign_type: string
          content_style: string
          created_at?: string
          id?: string
          influencer_tier: string
          is_active?: boolean | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          campaign_type?: string
          content_style?: string
          created_at?: string
          id?: string
          influencer_tier?: string
          is_active?: boolean | null
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          app_name: string | null
          app_store_url: string | null
          budget: number
          budget_per_influencer: number | null
          campaign_category: string | null
          campaign_subtype: string | null
          campaign_type: string
          content_guidelines: string | null
          content_style: string | null
          cost_per_video: number | null
          created_at: string
          creator_id: string
          current_applicants: number | null
          deadline: string | null
          description: string
          escrow_amount: number | null
          escrow_status: string | null
          event_date: string | null
          event_location: string | null
          hashtags: string[] | null
          id: string
          influencer_tier: string | null
          max_influencers: number | null
          movie_title: string | null
          platform: string | null
          product_details: Json | null
          production_location: string | null
          production_package: string | null
          requirements: string | null
          requires_physical_coverage: boolean | null
          requires_physical_product: boolean | null
          song_url: string | null
          status: string | null
          streaming_link: string | null
          target_audience: string | null
          target_cities: string[] | null
          target_demographics: Json | null
          title: string
          trailer_url: string | null
          updated_at: string
          video_quality: string | null
          videos_approved: number | null
          videos_requested: number | null
          videos_submitted: number | null
          visibility: string | null
          website_url: string | null
        }
        Insert: {
          app_name?: string | null
          app_store_url?: string | null
          budget: number
          budget_per_influencer?: number | null
          campaign_category?: string | null
          campaign_subtype?: string | null
          campaign_type: string
          content_guidelines?: string | null
          content_style?: string | null
          cost_per_video?: number | null
          created_at?: string
          creator_id: string
          current_applicants?: number | null
          deadline?: string | null
          description: string
          escrow_amount?: number | null
          escrow_status?: string | null
          event_date?: string | null
          event_location?: string | null
          hashtags?: string[] | null
          id?: string
          influencer_tier?: string | null
          max_influencers?: number | null
          movie_title?: string | null
          platform?: string | null
          product_details?: Json | null
          production_location?: string | null
          production_package?: string | null
          requirements?: string | null
          requires_physical_coverage?: boolean | null
          requires_physical_product?: boolean | null
          song_url?: string | null
          status?: string | null
          streaming_link?: string | null
          target_audience?: string | null
          target_cities?: string[] | null
          target_demographics?: Json | null
          title: string
          trailer_url?: string | null
          updated_at?: string
          video_quality?: string | null
          videos_approved?: number | null
          videos_requested?: number | null
          videos_submitted?: number | null
          visibility?: string | null
          website_url?: string | null
        }
        Update: {
          app_name?: string | null
          app_store_url?: string | null
          budget?: number
          budget_per_influencer?: number | null
          campaign_category?: string | null
          campaign_subtype?: string | null
          campaign_type?: string
          content_guidelines?: string | null
          content_style?: string | null
          cost_per_video?: number | null
          created_at?: string
          creator_id?: string
          current_applicants?: number | null
          deadline?: string | null
          description?: string
          escrow_amount?: number | null
          escrow_status?: string | null
          event_date?: string | null
          event_location?: string | null
          hashtags?: string[] | null
          id?: string
          influencer_tier?: string | null
          max_influencers?: number | null
          movie_title?: string | null
          platform?: string | null
          product_details?: Json | null
          production_location?: string | null
          production_package?: string | null
          requirements?: string | null
          requires_physical_coverage?: boolean | null
          requires_physical_product?: boolean | null
          song_url?: string | null
          status?: string | null
          streaming_link?: string | null
          target_audience?: string | null
          target_cities?: string[] | null
          target_demographics?: Json | null
          title?: string
          trailer_url?: string | null
          updated_at?: string
          video_quality?: string | null
          videos_approved?: number | null
          videos_requested?: number | null
          videos_submitted?: number | null
          visibility?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      coin_packages: {
        Row: {
          bonus_coins: number | null
          coin_amount: number
          created_at: string
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          name: string
          price_naira: number
          updated_at: string
        }
        Insert: {
          bonus_coins?: number | null
          coin_amount: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name: string
          price_naira: number
          updated_at?: string
        }
        Update: {
          bonus_coins?: number | null
          coin_amount?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name?: string
          price_naira?: number
          updated_at?: string
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          coin_amount: number
          created_at: string
          description: string | null
          id: string
          naira_amount: number | null
          payment_status: string | null
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          coin_amount: number
          created_at?: string
          description?: string | null
          id?: string
          naira_amount?: number | null
          payment_status?: string | null
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          coin_amount?: number
          created_at?: string
          description?: string | null
          id?: string
          naira_amount?: number | null
          payment_status?: string | null
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      coin_wallets: {
        Row: {
          coin_balance: number
          created_at: string
          id: string
          total_coins_purchased: number
          total_coins_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coin_balance?: number
          created_at?: string
          id?: string
          total_coins_purchased?: number
          total_coins_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coin_balance?: number
          created_at?: string
          id?: string
          total_coins_purchased?: number
          total_coins_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_reviews: {
        Row: {
          action: string
          created_at: string | null
          custom_feedback: string | null
          id: string
          rejection_reason_id: string | null
          reviewer_id: string
          reviewer_type: string
          submission_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          custom_feedback?: string | null
          id?: string
          rejection_reason_id?: string | null
          reviewer_id: string
          reviewer_type?: string
          submission_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          custom_feedback?: string | null
          id?: string
          rejection_reason_id?: string | null
          reviewer_id?: string
          reviewer_type?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reviews_rejection_reason_id_fkey"
            columns: ["rejection_reason_id"]
            isOneToOne: false
            referencedRelation: "rejection_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reviews_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "video_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_payment_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          crypto_type: string
          id: string
          payment_proof_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          crypto_type?: string
          id?: string
          payment_proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          crypto_type?: string
          id?: string
          payment_proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      influencer_boosts: {
        Row: {
          boost_multiplier: number
          boost_type: string
          campaign_id: string | null
          coins_spent: number
          created_at: string
          expires_at: string
          id: string
          influencer_id: string
          is_active: boolean
          package_id: string | null
          started_at: string
        }
        Insert: {
          boost_multiplier?: number
          boost_type: string
          campaign_id?: string | null
          coins_spent: number
          created_at?: string
          expires_at: string
          id?: string
          influencer_id: string
          is_active?: boolean
          package_id?: string | null
          started_at?: string
        }
        Update: {
          boost_multiplier?: number
          boost_type?: string
          campaign_id?: string | null
          coins_spent?: number
          created_at?: string
          expires_at?: string
          id?: string
          influencer_id?: string
          is_active?: boolean
          package_id?: string | null
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_boosts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_boosts_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "boost_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_tracking: {
        Row: {
          application_id: string
          campaign_id: string
          carrier: string | null
          confirmed_at: string | null
          created_at: string
          delivered_at: string | null
          id: string
          influencer_id: string
          notes: string | null
          shipped_at: string | null
          shipping_address: string | null
          status: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          campaign_id: string
          carrier?: string | null
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          influencer_id: string
          notes?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          campaign_id?: string
          carrier?: string | null
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          influencer_id?: string
          notes?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "logistics_tracking_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "campaign_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_tracking_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          data: Json | null
          icon: string | null
          id: string
          is_read: boolean | null
          message: string
          priority: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          data?: Json | null
          icon?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          priority?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          data?: Json | null
          icon?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          priority?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          created_at: string
          current_step: number
          id: string
          is_completed: boolean | null
          profile_completed: boolean | null
          spotify_verified: boolean | null
          steps_completed: Json | null
          tiktok_verified: boolean | null
          total_steps: number
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string
          current_step?: number
          id?: string
          is_completed?: boolean | null
          profile_completed?: boolean | null
          spotify_verified?: boolean | null
          steps_completed?: Json | null
          tiktok_verified?: boolean | null
          total_steps?: number
          updated_at?: string
          user_id: string
          user_type: string
        }
        Update: {
          created_at?: string
          current_step?: number
          id?: string
          is_completed?: boolean | null
          profile_completed?: boolean | null
          spotify_verified?: boolean | null
          steps_completed?: Json | null
          tiktok_verified?: boolean | null
          total_steps?: number
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      production_packages: {
        Row: {
          created_at: string
          crew_size: number | null
          delivery_days: number | null
          description: string | null
          id: string
          includes: string[] | null
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
          video_quality: string | null
        }
        Insert: {
          created_at?: string
          crew_size?: number | null
          delivery_days?: number | null
          description?: string | null
          id?: string
          includes?: string[] | null
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string
          video_quality?: string | null
        }
        Update: {
          created_at?: string
          crew_size?: number | null
          delivery_days?: number | null
          description?: string | null
          id?: string
          includes?: string[] | null
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
          video_quality?: string | null
        }
        Relationships: []
      }
      profile_claims: {
        Row: {
          admin_notes: string | null
          claim_type: string
          created_at: string
          fee_amount: number
          id: string
          status: string | null
          submission_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          claim_type: string
          created_at?: string
          fee_amount: number
          id?: string
          status?: string | null
          submission_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          claim_type?: string
          created_at?: string
          fee_amount?: number
          id?: string
          status?: string | null
          submission_data?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          audiomack_fee: number | null
          audiomack_status: string | null
          audiomack_username: string | null
          avatar_url: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          bio: string | null
          boost_expires_at: string | null
          boost_score: number | null
          city: string | null
          completed_campaigns: number | null
          completion_rate: number | null
          country: string | null
          created_at: string
          crypto_wallet_address: string | null
          email: string | null
          follower_count: number | null
          following_count: number | null
          full_name: string
          id: string
          is_active: boolean | null
          is_boosted: boolean | null
          location: string | null
          phone: string | null
          preferred_currency: string | null
          rating: number | null
          social_links: Json | null
          strike_count: number | null
          tiktok_claim_fee: number | null
          tiktok_claim_status: string | null
          total_earnings: number | null
          total_spent: number | null
          updated_at: string
          user_id: string
          user_type: string
          username: string | null
          verification_status: string | null
          wallet_balance: number | null
        }
        Insert: {
          audiomack_fee?: number | null
          audiomack_status?: string | null
          audiomack_username?: string | null
          avatar_url?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bio?: string | null
          boost_expires_at?: string | null
          boost_score?: number | null
          city?: string | null
          completed_campaigns?: number | null
          completion_rate?: number | null
          country?: string | null
          created_at?: string
          crypto_wallet_address?: string | null
          email?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name: string
          id?: string
          is_active?: boolean | null
          is_boosted?: boolean | null
          location?: string | null
          phone?: string | null
          preferred_currency?: string | null
          rating?: number | null
          social_links?: Json | null
          strike_count?: number | null
          tiktok_claim_fee?: number | null
          tiktok_claim_status?: string | null
          total_earnings?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id: string
          user_type: string
          username?: string | null
          verification_status?: string | null
          wallet_balance?: number | null
        }
        Update: {
          audiomack_fee?: number | null
          audiomack_status?: string | null
          audiomack_username?: string | null
          avatar_url?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bio?: string | null
          boost_expires_at?: string | null
          boost_score?: number | null
          city?: string | null
          completed_campaigns?: number | null
          completion_rate?: number | null
          country?: string | null
          created_at?: string
          crypto_wallet_address?: string | null
          email?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_boosted?: boolean | null
          location?: string | null
          phone?: string | null
          preferred_currency?: string | null
          rating?: number | null
          social_links?: Json | null
          strike_count?: number | null
          tiktok_claim_fee?: number | null
          tiktok_claim_status?: string | null
          total_earnings?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string
          user_type?: string
          username?: string | null
          verification_status?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      rejection_reasons: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          reason: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          reason: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          recorded_at: string | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          recorded_at?: string | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          recorded_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_submissions: {
        Row: {
          admin_feedback: string | null
          approved_date: string | null
          campaign_id: string
          created_at: string
          earnings: number | null
          id: string
          influencer_id: string
          is_admin_override: boolean | null
          max_resubmissions: number | null
          original_submission_id: string | null
          platform: string
          rejection_category: string | null
          rejection_reason: string | null
          resubmission_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submission_date: string | null
          updated_at: string
          video_url: string
        }
        Insert: {
          admin_feedback?: string | null
          approved_date?: string | null
          campaign_id: string
          created_at?: string
          earnings?: number | null
          id?: string
          influencer_id: string
          is_admin_override?: boolean | null
          max_resubmissions?: number | null
          original_submission_id?: string | null
          platform: string
          rejection_category?: string | null
          rejection_reason?: string | null
          resubmission_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submission_date?: string | null
          updated_at?: string
          video_url: string
        }
        Update: {
          admin_feedback?: string | null
          approved_date?: string | null
          campaign_id?: string
          created_at?: string
          earnings?: number | null
          id?: string
          influencer_id?: string
          is_admin_override?: boolean | null
          max_resubmissions?: number | null
          original_submission_id?: string | null
          platform?: string
          rejection_category?: string | null
          rejection_reason?: string | null
          resubmission_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submission_date?: string | null
          updated_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_submissions_original_submission_id_fkey"
            columns: ["original_submission_id"]
            isOneToOne: false
            referencedRelation: "video_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          payment_method: string | null
          reference_id: string | null
          status: string | null
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          reference_id?: string | null
          status?: string | null
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          reference_id?: string | null
          status?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          completed_campaigns: number | null
          country: string | null
          created_at: string | null
          follower_count: number | null
          full_name: string | null
          id: string | null
          location: string | null
          rating: number | null
          user_id: string | null
          user_type: string | null
          username: string | null
          verification_status: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          completed_campaigns?: number | null
          country?: string | null
          created_at?: string | null
          follower_count?: number | null
          full_name?: string | null
          id?: string | null
          location?: string | null
          rating?: number | null
          user_id?: string | null
          user_type?: string | null
          username?: string | null
          verification_status?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          completed_campaigns?: number | null
          country?: string | null
          created_at?: string | null
          follower_count?: number | null
          full_name?: string | null
          id?: string | null
          location?: string | null
          rating?: number | null
          user_id?: string | null
          user_type?: string | null
          username?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_boost: {
        Args: {
          p_campaign_id?: string
          p_influencer_id: string
          p_package_id: string
        }
        Returns: Json
      }
      bootstrap_first_admin: { Args: never; Returns: boolean }
      calculate_influencer_score: {
        Args: { p_influencer_id: string }
        Returns: number
      }
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_campaign_price: {
        Args: {
          p_campaign_type: string
          p_content_style: string
          p_influencer_tier: string
          p_region?: string
        }
        Returns: number
      }
      get_moderation_queue: {
        Args: { p_limit?: number; p_status?: string }
        Returns: {
          campaign_id: string
          campaign_title: string
          campaign_type: string
          influencer_id: string
          influencer_name: string
          influencer_username: string
          platform: string
          resubmission_count: number
          status: string
          submission_date: string
          submission_id: string
          video_url: string
        }[]
      }
      get_public_profile: {
        Args: { profile_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          city: string
          completed_campaigns: number
          country: string
          created_at: string
          follower_count: number
          following_count: number
          full_name: string
          id: string
          is_active: boolean
          location: string
          rating: number
          user_id: string
          user_type: string
          username: string
          verification_status: string
        }[]
      }
      get_public_profile_data: {
        Args: { profile_row: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: Json
      }
      get_ranked_influencers: {
        Args: {
          p_campaign_id?: string
          p_city?: string
          p_limit?: number
          p_tier?: string
        }
        Returns: {
          avatar_url: string
          boost_expires_at: string
          boost_type: string
          completion_rate: number
          follower_count: number
          full_name: string
          is_boosted: boolean
          ranking_score: number
          rating: number
          user_id: string
          username: string
        }[]
      }
      get_user_claims: {
        Args: { target_user_id: string }
        Returns: {
          claim_type: string
          created_at: string
          fee_amount: number
          id: string
          status: string
          submission_data: Json
          updated_at: string
          user_id: string
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      resubmit_content: {
        Args: { p_new_video_url: string; p_original_submission_id: string }
        Returns: Json
      }
      review_content: {
        Args: {
          p_action: string
          p_custom_feedback?: string
          p_is_admin?: boolean
          p_rejection_reason_id?: string
          p_submission_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "analyst" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "analyst", "user"],
    },
  },
} as const
