import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { limit = 200 } = (await req.json().catch(() => ({ limit: 200 }))) as { limit?: number };

    const { data: deposits, error: listError } = await supabase
      .from('deposits')
      .select('id, user_id, amount, status, confirmed_at')
      .eq('status', 'confirmed')
      .order('confirmed_at', { ascending: true })
      .limit(limit);

    if (listError) {
      console.error('List deposits error:', listError);
      return new Response(JSON.stringify({ success: false, error: listError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;
    let skipped = 0;
    let failures: Array<{ id: string; error: string }> = [];

    for (const d of deposits ?? []) {
      // Skip if already processed
      const { data: exists } = await supabase
        .from('deposit_processing_log')
        .select('deposit_id')
        .eq('deposit_id', d.id)
        .maybeSingle();

      if (exists) {
        skipped++;
        continue;
      }

      // Credit balance
      const { error: balanceError } = await supabase.rpc('add_balance', {
        user_id: d.user_id,
        amount: d.amount,
      });
      if (balanceError) {
        failures.push({ id: d.id, error: balanceError.message });
        continue;
      }

      // Referral bonus processing
      await supabase.rpc('process_referral_bonus', {
        p_referred_user_id: d.user_id,
        p_deposit_amount: d.amount,
      });

      // Unlock bonus if needed
      await supabase.rpc('unlock_bonus_after_deposit', {
        p_user_id: d.user_id,
        p_deposit_amount: d.amount,
      });

      // Mark processed
      const { error: logError } = await supabase
        .from('deposit_processing_log')
        .insert({ deposit_id: d.id });
      if (logError) {
        console.error('Log error:', logError);
      }

      processed++;
    }

    return new Response(
      JSON.stringify({ success: true, processed, skipped, failures }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Reprocess error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});