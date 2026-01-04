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
      campaigns: {
        Row: {
          budget: number
          budget_per_influencer: number | null
          campaign_subtype: string | null
          campaign_type: string
          content_guidelines: string | null
          cost_per_video: number | null
          created_at: string
          creator_id: string
          current_applicants: number | null
          deadline: string | null
          description: string
          hashtags: string[] | null
          id: string
          influencer_tier: string | null
          max_influencers: number | null
          product_details: Json | null
          requirements: string | null
          song_url: string | null
          status: string | null
          target_audience: string | null
          target_cities: string[] | null
          target_demographics: Json | null
          title: string
          updated_at: string
          videos_approved: number | null
          videos_requested: number | null
          videos_submitted: number | null
          visibility: string | null
        }
        Insert: {
          budget: number
          budget_per_influencer?: number | null
          campaign_subtype?: string | null
          campaign_type: string
          content_guidelines?: string | null
          cost_per_video?: number | null
          created_at?: string
          creator_id: string
          current_applicants?: number | null
          deadline?: string | null
          description: string
          hashtags?: string[] | null
          id?: string
          influencer_tier?: string | null
          max_influencers?: number | null
          product_details?: Json | null
          requirements?: string | null
          song_url?: string | null
          status?: string | null
          target_audience?: string | null
          target_cities?: string[] | null
          target_demographics?: Json | null
          title: string
          updated_at?: string
          videos_approved?: number | null
          videos_requested?: number | null
          videos_submitted?: number | null
          visibility?: string | null
        }
        Update: {
          budget?: number
          budget_per_influencer?: number | null
          campaign_subtype?: string | null
          campaign_type?: string
          content_guidelines?: string | null
          cost_per_video?: number | null
          created_at?: string
          creator_id?: string
          current_applicants?: number | null
          deadline?: string | null
          description?: string
          hashtags?: string[] | null
          id?: string
          influencer_tier?: string | null
          max_influencers?: number | null
          product_details?: Json | null
          requirements?: string | null
          song_url?: string | null
          status?: string | null
          target_audience?: string | null
          target_cities?: string[] | null
          target_demographics?: Json | null
          title?: string
          updated_at?: string
          videos_approved?: number | null
          videos_requested?: number | null
          videos_submitted?: number | null
          visibility?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
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
          bio: string | null
          city: string | null
          completed_campaigns: number | null
          country: string | null
          created_at: string
          email: string | null
          follower_count: number | null
          following_count: number | null
          full_name: string
          id: string
          is_active: boolean | null
          location: string | null
          phone: string | null
          rating: number | null
          social_links: Json | null
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
          bio?: string | null
          city?: string | null
          completed_campaigns?: number | null
          country?: string | null
          created_at?: string
          email?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          phone?: string | null
          rating?: number | null
          social_links?: Json | null
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
          bio?: string | null
          city?: string | null
          completed_campaigns?: number | null
          country?: string | null
          created_at?: string
          email?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          phone?: string | null
          rating?: number | null
          social_links?: Json | null
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
      video_submissions: {
        Row: {
          admin_feedback: string | null
          approved_date: string | null
          campaign_id: string
          created_at: string
          earnings: number | null
          id: string
          influencer_id: string
          platform: string
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
          platform: string
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
          platform?: string
          status?: string | null
          submission_date?: string | null
          updated_at?: string
          video_url?: string
        }
        Relationships: []
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
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
