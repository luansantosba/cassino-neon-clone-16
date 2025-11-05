import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const body = await req.json().catch(() => ({}));
    const targetEmails: string[] | undefined = body?.emails;

    console.log('Reprocess deposits start', { targetEmails });

    // Find confirmed deposits not yet processed
    // Optionally filter by emails -> resolve to user_ids first
    let userIdsFilter: string[] | undefined = undefined;
    if (targetEmails && targetEmails.length > 0) {
      const { data: profilesByEmail, error: profErr } = await supabase
        .from('profiles' as any)
        .select('id, email')
        .in('email' as any, targetEmails as any);
      if (profErr) {
        console.error('Error fetching profiles by email:', profErr);
        return new Response(JSON.stringify({ error: 'profiles_fetch_error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      userIdsFilter = (profilesByEmail || []).map((p: any) => p.id);
    }

    let depositsQuery = supabase
      .from('deposits' as any)
      .select('id, user_id, amount, status, transaction_id, confirmed_at')
      .eq('status', 'confirmed')
      .order('confirmed_at', { ascending: true });

    if (userIdsFilter && userIdsFilter.length > 0) {
      depositsQuery = depositsQuery.in('user_id' as any, userIdsFilter as any);
    }

    const { data: confirmedDeposits, error: depErr } = await depositsQuery;
    if (depErr) {
      console.error('Error fetching confirmed deposits:', depErr);
      return new Response(JSON.stringify({ error: 'fetch_error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results: Array<{ id: string; tx: string; credited: boolean; reason?: string }> = [];

    for (const dep of confirmedDeposits || []) {
      // Check processing log
      const { data: alreadyProcessed } = await supabase
        .from('deposit_processing_log' as any)
        .select('deposit_id')
        .eq('deposit_id', dep.id)
        .maybeSingle();

      if (alreadyProcessed) {
        results.push({ id: dep.id, tx: dep.transaction_id, credited: false, reason: 'already_processed' });
        continue;
      }

      // Invoke central processor to credit balance + bonuses
      const { error: processError } = await supabase.functions.invoke('process-deposit', {
        body: {
          user_id: dep.user_id,
          amount: dep.amount
        }
      });

      if (processError) {
        console.error('process-deposit error:', processError);
        results.push({ id: dep.id, tx: dep.transaction_id, credited: false, reason: 'process_error' });
        continue;
      }

      // Mark as processed
      const { error: logErr } = await supabase
        .from('deposit_processing_log' as any)
        .insert({ deposit_id: dep.id });
      if (logErr) {
        console.error('log insert error:', logErr);
      }

      results.push({ id: dep.id, tx: dep.transaction_id, credited: true });
    }

    return new Response(JSON.stringify({ ok: true, count: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('reprocess-confirmed-deposits error:', e);
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
