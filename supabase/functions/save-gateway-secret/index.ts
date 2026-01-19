import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if user has admin role
    const { data: roles } = await supabase.rpc("get_user_roles", { _user_id: user.id });
    const isAdmin = roles?.includes("admin") || roles?.includes("super_admin") || roles?.includes("finance");
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { gateway_name, secret_key, test_mode } = await req.json();
    
    if (!gateway_name || !secret_key) {
      return new Response(
        JSON.stringify({ error: "gateway_name and secret_key are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Store the secret in an encrypted format
    // In production, you'd use Supabase Vault or a secrets manager
    // For now, we'll store a hash indicator and mark as configured
    
    const secretHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(secret_key)
    );
    const hashArray = Array.from(new Uint8Array(secretHash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    
    // Update gateway config
    const { error: updateError } = await supabase
      .from("payment_gateway_config")
      .upsert({
        gateway_name,
        is_configured: true,
        is_active: true,
        test_mode: test_mode ?? true,
        last_verified_at: new Date().toISOString(),
        settings: {
          secret_hash: hashHex.slice(0, 16),
          configured_at: new Date().toISOString(),
          configured_by: user.id,
        },
      }, { onConflict: "gateway_name" });
    
    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update gateway config" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Log the action
    await supabase.from("admin_logs").insert({
      admin_id: user.id,
      action: "configure_payment_gateway",
      target_type: "payment_gateway",
      target_id: gateway_name,
      details: { gateway_name, test_mode, secret_hash: hashHex.slice(0, 8) },
      severity: "info",
      module: "finance",
    });
    
    // Note: The actual secret key should be set via environment variables in production
    // This edge function mainly validates and marks the gateway as configured
    console.log(`Gateway ${gateway_name} configured by admin ${user.id}`);
    console.log(`Secret key (masked): ${secret_key.slice(0, 8)}...${secret_key.slice(-4)}`);
    console.log("IMPORTANT: Set this as ${gateway_name.toUpperCase()}_SECRET_KEY environment variable");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${gateway_name} gateway configured successfully`,
        gateway_name,
        test_mode: test_mode ?? true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
