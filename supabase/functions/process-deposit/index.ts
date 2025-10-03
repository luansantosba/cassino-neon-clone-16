import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, amount } = await req.json();

    if (!user_id || !amount) {
      throw new Error('Missing required fields: user_id, amount');
    }

    console.log(`Processing deposit for user ${user_id}, amount: ${amount}`);

    // Add balance to user account
    const { error: balanceError } = await supabase.rpc('add_balance', {
      user_id: user_id,
      amount: amount
    });

    if (balanceError) {
      console.error('Error adding balance:', balanceError);
      throw balanceError;
    }

    console.log(`Balance added successfully for user ${user_id}`);

    // Process referral bonus if applicable (accumulated deposits >= 20)
    const { error: bonusError } = await supabase.rpc('process_referral_bonus', {
      p_referred_user_id: user_id,
      p_deposit_amount: amount
    });

    if (bonusError) {
      console.error('Error processing referral bonus:', bonusError);
      // Don't throw error here, as the main deposit should still succeed
    } else {
      console.log(`Referral bonus processed for user ${user_id}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Deposit processed successfully',
        amount: amount
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error processing deposit:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});