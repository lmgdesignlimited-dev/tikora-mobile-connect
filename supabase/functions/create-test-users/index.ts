import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestUser {
  email: string
  password: string
  user_id: string
  full_name: string
  user_type: 'artist' | 'influencer' | 'business'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const testUsers: TestUser[] = [
      {
        email: 'artist@demo.com',
        password: 'demo123!',
        user_id: '11111111-1111-1111-1111-111111111111',
        full_name: 'Demo Artist',
        user_type: 'artist'
      },
      {
        email: 'influencer@demo.com', 
        password: 'demo123!',
        user_id: '22222222-2222-2222-2222-222222222222',
        full_name: 'Demo Influencer',
        user_type: 'influencer'
      },
      {
        email: 'business@demo.com',
        password: 'demo123!', 
        user_id: '33333333-3333-3333-3333-333333333333',
        full_name: 'Demo Business',
        user_type: 'business'
      }
    ]

    const results = []
    
    for (const user of testUsers) {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          user_type: user.user_type
        }
      })

      if (authError) {
        console.log(`Error creating user ${user.email}:`, authError)
        results.push({ email: user.email, error: authError.message })
      } else {
        results.push({ email: user.email, success: true, user_id: authData.user?.id })
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})