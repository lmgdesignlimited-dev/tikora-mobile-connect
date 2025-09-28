import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('Creating test users...')

    // Test users to create
    const testUsers = [
      {
        email: 'artist@demo.com',
        password: 'demo123456',
        userData: {
          full_name: 'Demo Artist',
          user_type: 'artist',
          username: 'demo_artist',
          bio: 'Professional music artist creating amazing content',
          rating: 4.8,
          completed_campaigns: 15,
          follower_count: 25000,
          total_earnings: 15000.00,
          wallet_balance: 5000.00,
          verification_status: 'verified'
        }
      },
      {
        email: 'influencer@demo.com',
        password: 'demo123456',
        userData: {
          full_name: 'Demo Influencer',
          user_type: 'influencer',
          username: 'demo_influencer',
          bio: 'Top-tier content creator with amazing reach',
          rating: 4.9,
          completed_campaigns: 22,
          follower_count: 50000,
          total_earnings: 28000.00,
          wallet_balance: 8000.00,
          verification_status: 'verified'
        }
      },
      {
        email: 'business@demo.com',
        password: 'demo123456',
        userData: {
          full_name: 'Demo Business',
          user_type: 'business',
          username: 'demo_business',
          bio: 'Leading marketing agency',
          rating: 4.7,
          completed_campaigns: 35,
          follower_count: 5000,
          total_spent: 50000.00,
          wallet_balance: 15000.00,
          verification_status: 'verified'
        }
      }
    ]

    const results = []

    for (const testUser of testUsers) {
      console.log('Creating user:', testUser.email)
      
      // Create auth user
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: testUser.userData
      })

      if (authError) {
        console.error('Auth error for', testUser.email, ':', authError)
        // Check if user already exists
        if (authError.message.includes('already been registered')) {
          console.log('User already exists:', testUser.email)
          results.push({
            email: testUser.email,
            status: 'already_exists',
            message: 'User already registered'
          })
          continue
        } else {
          results.push({
            email: testUser.email,
            status: 'error',
            error: authError.message
          })
          continue
        }
      }

      if (authData.user) {
        console.log('Auth user created:', authData.user.id)

        // Create or update profile
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .upsert({
            user_id: authData.user.id,
            email: testUser.email,
            ...testUser.userData
          })

        if (profileError) {
          console.error('Profile error for', testUser.email, ':', profileError)
          results.push({
            email: testUser.email,
            status: 'partial_success',
            message: 'Auth user created but profile creation failed',
            error: profileError.message
          })
        } else {
          console.log('Profile created for:', testUser.email)
          results.push({
            email: testUser.email,
            status: 'success',
            user_id: authData.user.id
          })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test users processing completed',
        results: results,
        credentials: {
          artist: { email: 'artist@demo.com', password: 'demo123456' },
          influencer: { email: 'influencer@demo.com', password: 'demo123456' },
          business: { email: 'business@demo.com', password: 'demo123456' }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error: any) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})