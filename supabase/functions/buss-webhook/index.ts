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
      
      // Process deposit and referral bonus using edge function
      const { error: processError } = await supabase.functions.invoke('process-deposit', {
        body: {
          user_id: updatedDeposit.user_id,
          amount: updatedDeposit.amount
        }
      });

      if (processError) {
        console.error('Error processing deposit:', processError);
        // Still return success as the deposit was confirmed, bonus is secondary
      } else {
        console.log(`Deposit and bonus processed for user ${updatedDeposit.user_id}: R$ ${updatedDeposit.amount}`);
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