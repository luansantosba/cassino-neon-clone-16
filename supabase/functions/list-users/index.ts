import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch profiles and related credentials
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("id, full_name, email, whatsapp, cpf, balance, created_at, updated_at, referral_id, referrer_id")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;

    const userIds = (profiles ?? []).map((p) => p.id).filter(Boolean);

    const { data: credentials, error: credError } = await supabaseClient
      .from("user_credentials")
      .select("user_id, credential_email:email, password, password_hint")
      .in("user_id", userIds);

    if (credError) throw credError;

    const enriched = (profiles ?? []).map((p) => ({
      ...p,
      ...(credentials?.find((c) => c.user_id === p.id) || {}),
    }));

    return new Response(
      JSON.stringify({ users: enriched }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("list-users error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
