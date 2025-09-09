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
    const { amount, buyer_name, buyer_email, buyer_cpf } = await req.json()
    
    console.log('=== PIX Creation Request ===')
    console.log('Amount received:', amount)
    console.log('Buyer data:', { buyer_name, buyer_email, buyer_cpf })
    
    // Validate amount (BullsPay minimum is 1000 centavos = R$10.00)
    if (!amount || amount < 10) {
      console.log('Invalid amount:', amount)
      return new Response(
        JSON.stringify({ error: 'Valor mínimo é R$ 10,00' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!
    if (!authHeader) {
      console.log('No authorization header')
      return new Response(
        JSON.stringify({ error: 'Token de autorização necessário' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    console.log(`Creating PIX for user ${user.id}, amount: ${amount}`)

    // Check environment variables
    const secretKey = Deno.env.get('BUSS_SECRET_KEY')
    const clientId = Deno.env.get('BUSS_CLIENT_ID')
    
    if (!secretKey || !clientId) {
      console.log('Missing API credentials:', { hasSecret: !!secretKey, hasClient: !!clientId })
      return new Response(
        JSON.stringify({ error: 'Credenciais da API não configuradas' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    console.log('API credentials check:', {
      hasSecretKey: !!secretKey,
      hasClientId: !!clientId,
      secretPrefix: secretKey?.substring(0, 15),
      clientPrefix: clientId?.substring(0, 15)
    })

    // Validate buyer data
    if (!buyer_name || !buyer_email || !buyer_cpf) {
      console.log('Missing buyer data:', { buyer_name, buyer_email, buyer_cpf })
      return new Response(
        JSON.stringify({ error: 'Dados do comprador são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    // Validate CPF format (must be digits only for BullsPay)
    const cleanCPF = buyer_cpf.replace(/\D/g, '')
    if (cleanCPF.length !== 11) {
      console.log('Invalid CPF length:', cleanCPF.length)
      return new Response(
        JSON.stringify({ error: 'CPF deve ter 11 dígitos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    // Call BullsPay Gateway API exatamente como no exemplo fornecido
    const requestBody = {
      amount: Math.round(amount * 100), // Convert to centavos (minimum 600 para BullsPay)
      buyer_infos: {
        buyer_name: buyer_name.trim(),
        buyer_document: cleanCPF, // CPF/CNPJ do jogador (não do painel)
        buyer_email: buyer_email.trim(),
        buyer_phone: user.user_metadata?.whatsapp || "27999999999"
      },
      external_id: `pedido_${Date.now()}`, // ID único conforme exemplo
      payment_method: "pix"
    }

    console.log('Request body (BullsPay):', JSON.stringify(requestBody, null, 2))
    console.log('Using BullsPay Production API URL: https://api-gateway.bullspay.com.br/api/transactions/create')

    const bussResponse = await fetch('https://api-gateway.bullspay.com.br/api/transactions/create', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Public-Key': clientId,
        'X-Private-Key': secretKey
      },
      body: JSON.stringify(requestBody)
    })
    
    console.log('BullsPay response status:', bussResponse.status)
    console.log('BullsPay response headers:', Object.fromEntries(bussResponse.headers.entries()))

    const responseText = await bussResponse.text()
    console.log('BullsPay response body:', responseText)

    if (!bussResponse.ok) {
      console.error('BullsPay Gateway error:', {
        status: bussResponse.status,
        statusText: bussResponse.statusText,
        body: responseText
      })
      return new Response(
        JSON.stringify({ 
          error: 'Erro no gateway de pagamento',
          details: `${bussResponse.status}: ${responseText}`
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    let bussData
    try {
      bussData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return new Response(
        JSON.stringify({ error: 'Resposta inválida do gateway' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    console.log('Parsed BullsPay response:', JSON.stringify(bussData, null, 2))
    
    // Check if BullsPay returned success
    if (!bussData || bussData.success === false) {
      console.error('BullsPay API returned error:', bussData)
      
      // Extract more detailed error information
      let errorMessage = 'Falha ao criar PIX no gateway'
      if (bussData && bussData.message) {
        errorMessage = bussData.message
      }
      if (bussData && bussData.data && bussData.data.message) {
        errorMessage += ': ' + bussData.data.message
      }
      if (bussData && bussData.data && bussData.data.errors) {
        const errorDetails = Object.entries(bussData.data.errors)
          .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
          .join('; ')
        errorMessage += '. Detalhes: ' + errorDetails
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    // Verify required data exists - BullsPay retorna estrutura payment_data e pix_data
    if (!bussData.data || !bussData.data.payment_data || !bussData.data.payment_data.id || !bussData.data.pix_data || !bussData.data.pix_data.qrcode) {
      console.error('Missing required data in BullsPay response:', bussData)
      return new Response(
        JSON.stringify({ error: 'Dados incompletos retornados pelo gateway' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    // Save to database using service role
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Extract transaction ID - BullsPay retorna em payment_data.id
    const transactionId = bussData.data.payment_data.id
    
    const { data: deposit, error: insertError } = await supabaseService
      .from('deposits')
      .insert({
        user_id: user.id,
        transaction_id: transactionId,
        amount: amount,
        pix_key: bussData.data.pix_data.qrcode,
        qr_code_data: bussData.data.pix_data.qrcode,
        status: 'pending'
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Database insert error:', insertError)
      console.error('Attempted to insert:', {
        user_id: user.id,
        transaction_id: transactionId,
        amount: amount,
        pix_key: bussData.data.pix_data.qrcode,
        qr_code_data: bussData.data.pix_data.qrcode,
        status: 'pending'
      })
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao salvar transação', 
          details: insertError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    console.log('PIX created successfully:', deposit)
    
    // Return só o código PIX para o front-end conforme solicitado
    return new Response(
      JSON.stringify({ 
        transaction_id: transactionId,
        qr_code: bussData.data.pix_data.qrcode,
        pix_key: bussData.data.pix_data.qrcode,
        amount: amount
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )
  } catch (error) {
    console.error('=== Critical Error in create-pix ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )
  }
})