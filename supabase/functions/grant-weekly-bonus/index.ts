import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getSaoPauloNow(): Date {
  const now = new Date();
  // Approximate Sao Paulo timezone as UTC-3 (ignoring DST)
  return new Date(now.getTime() - 3 * 60 * 60 * 1000);
}

function getThisFridayNoonSP(): Date {
  const d = getSaoPauloNow();
  const day = d.getUTCDay(); // 0-6 (Sun=0)
  const diffToFriday = (5 - day + 7) % 7; // days until Friday
  const friday = new Date(d);
  friday.setUTCDate(d.getUTCDate() + diffToFriday);
  friday.setUTCHours(12, 0, 0, 0); // 12:00
  return friday;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const nowSP = getSaoPauloNow();
    const thisFridayNoon = getThisFridayNoonSP();

    if (nowSP < thisFridayNoon) {
      return new Response(JSON.stringify({ granted: 0, message: 'Not Friday noon yet' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get users who have at least one confirmed deposit
    const { data: depositUsers, error: depErr } = await supabase
      .from('deposits')
      .select('user_id')
      .eq('status', 'confirmed');

    if (depErr) throw depErr;

    const userIds = Array.from(new Set((depositUsers || []).map((d: any) => d.user_id)));
    let granted = 0;

    for (const uid of userIds) {
      // Check last_bonus_date
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, balance, last_bonus_date')
        .eq('id', uid)
        .maybeSingle();

      if (!profile) continue;

      const last = profile.last_bonus_date ? new Date(profile.last_bonus_date) : null;
      if (!last || last < thisFridayNoon) {
        // Grant 5 and update last_bonus_date
        const { error: updErr } = await supabase
          .from('profiles')
          .update({ balance: (profile.balance || 0) + 5, last_bonus_date: new Date().toISOString() })
          .eq('id', uid);
        if (!updErr) granted++;
      }
    }

    return new Response(JSON.stringify({ granted }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('grant-weekly-bonus error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});