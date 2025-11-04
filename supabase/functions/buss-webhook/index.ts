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
    const webhookData = await req.json()
    console.log('Webhook received:', webhookData)
    
    // TODO: Implement webhook signature verification according to Buss Gateway documentation
    // const signature = req.headers.get('X-Buss-Signature');
    // if (!verifySignature(signature, webhookData)) {
    //   return new Response('Invalid signature', { status: 400 });
    // }
    
    // Use service role key to update data
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    if (webhookData.status === 'confirmed' || webhookData.status === 'paid') {
      console.log(`Processing payment confirmation for transaction: ${webhookData.transaction_id}`)
      
      // Update deposit status
      const { data: updatedDeposit, error: updateError } = await supabase
        .from('deposits')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('transaction_id', webhookData.transaction_id)
        .select()
        .single()
      
      if (updateError) {
        console.error('Error updating deposit:', updateError)
        return new Response('Error updating deposit', { status: 500 })
      }

      if (!updatedDeposit) {
        console.error('Deposit not found:', webhookData.transaction_id)
        return new Response('Deposit not found', { status: 404 })
      }

      console.log('Deposit updated:', updatedDeposit)
      
      // Idempotency check: avoid double-crediting
      const { data: alreadyProcessed } = await supabase
        .from('deposit_processing_log')
        .select('deposit_id')
        .eq('deposit_id', updatedDeposit.id)
        .maybeSingle();

      if (alreadyProcessed) {
        console.log('Deposit already processed, skipping credit:', updatedDeposit.id);
      } else {
        // Credit balance directly and handle bonuses/commissions
        const { error: balanceError } = await supabase.rpc('add_balance', {
          user_id: updatedDeposit.user_id,
          amount: updatedDeposit.amount
        });
        if (balanceError) {
          console.error('Error adding balance:', balanceError);
        } else {
          console.log(`Balance credited for user ${updatedDeposit.user_id}: R$ ${updatedDeposit.amount}`);
        }

        // Referral bonus (accumulated deposits >= 20)
        const { error: bonusError } = await supabase.rpc('process_referral_bonus', {
          p_referred_user_id: updatedDeposit.user_id,
          p_deposit_amount: updatedDeposit.amount
        });
        if (bonusError) {
          console.error('Error processing referral bonus:', bonusError);
        }

        // Unlock deposit-required coupon bonus and pay partner commission if applicable
        const { error: unlockError } = await supabase.rpc('unlock_bonus_after_deposit', {
          p_user_id: updatedDeposit.user_id,
          p_deposit_amount: updatedDeposit.amount
        });
        if (unlockError) {
          console.error('Error unlocking bonus after deposit:', unlockError);
        }

        // Mark processed for idempotency
        const { error: logError } = await supabase
          .from('deposit_processing_log')
          .insert({ deposit_id: updatedDeposit.id });
        if (logError) {
          console.error('Error logging processed deposit:', logError);
        }
      }
    } else if (webhookData.status === 'cancelled' || webhookData.status === 'expired') {
      console.log(`Processing payment cancellation for transaction: ${webhookData.transaction_id}`)
      
      // Update deposit status to cancelled
      await supabase
        .from('deposits')
        .update({ status: 'cancelled' })
        .eq('transaction_id', webhookData.transaction_id)
    }
    
    return new Response('OK', { 
      headers: { ...corsHeaders, "Content-Type": "text/plain" } 
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" } 
    })
  }
})