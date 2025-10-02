# Integração Buss Gateway - Guia de Implementação Real

## 🔧 Status Atual
**Modo Simulação Ativo** - Sistema preparado para migração usando Supabase

## 📝 Credenciais da API
```
Secret Key: bp_secret_EdSOnTIt7l1rurgLLQfP6LAA4bFrJOZhYs2AStqB4hit811bvVUKXudKuUZxoPLX
Client ID: bp_client_X3j5UCw8lyRueMdv3VwwXPovS2u9VM6c
```

## 🚀 Estrutura Supabase Necessária

### 1. Tabela de Depósitos
```sql
CREATE TABLE deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  transaction_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  pix_key TEXT,
  qr_code_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);
```

### 2. Edge Function: create-pix
```typescript
// supabase/functions/create-pix/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { amount } = await req.json()
  
  // Autenticar usuário
  const authHeader = req.headers.get('Authorization')!
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  // Chamar API da Buss Gateway
  const bussResponse = await fetch('https://api.buss.com/v1/pix/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('BUSS_SECRET_KEY')}`,
      'Client-ID': Deno.env.get('BUSS_CLIENT_ID'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amount,
      currency: 'BRL',
      description: 'Depósito Casino BDC'
    })
  })
  
  const bussData = await bussResponse.json()
  
  // Salvar no banco de dados
  const { data: deposit } = await supabase
    .from('deposits')
    .insert({
      user_id: user.id,
      transaction_id: bussData.transaction_id,
      amount: amount,
      pix_key: bussData.pix_key,
      qr_code_data: bussData.qr_code
    })
    .select()
    .single()
  
  return new Response(
    JSON.stringify({ 
      transaction_id: bussData.transaction_id,
      qr_code: bussData.qr_code,
      pix_key: bussData.pix_key 
    }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

### 3. Edge Function: buss-webhook
```typescript
// supabase/functions/buss-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const webhookData = await req.json()
  
  // Verificar assinatura do webhook (implementar conforme documentação Buss)
  
  // Usar service role key para atualizar dados
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  if (webhookData.status === 'confirmed') {
    // Atualizar status do depósito
    await supabase
      .from('deposits')
      .update({ 
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('transaction_id', webhookData.transaction_id)
    
    // Creditar saldo no perfil do usuário
    const { data: deposit } = await supabase
      .from('deposits')
      .select('user_id, amount')
      .eq('transaction_id', webhookData.transaction_id)
      .single()
    
    if (deposit) {
      // Atualizar saldo do usuário (implementar lógica de saldo)
      await supabase.rpc('add_balance', {
        user_id: deposit.user_id,
        amount: deposit.amount
      })
    }
  }
  
  return new Response('OK')
})
```

## 🔄 Migração do Código Atual

### Frontend - Substituir função generatePix:
```typescript
const generatePix = async () => {
  const amountValue = parseFloat(amount.replace(",", "."));
  
  if (!amountValue || amountValue < 5) {
    toast.error("O valor mínimo é R$ 5,00");
    return;
  }

  setIsLoading(true);

  try {
    // Chamar edge function do Supabase
    const { data, error } = await supabase.functions.invoke('create-pix', {
      body: { amount: amountValue }
    });
    
    if (error) throw error;
    
    // Salvar dados temporários para tela de pagamento
    localStorage.setItem("tempPixData", JSON.stringify({
      qrCode: data.qr_code,
      pixKey: data.pix_key,
      amount: amount,
      txId: data.transaction_id
    }));
    
    toast.success("PIX gerado com sucesso!");
    navigate('/pix-payment');
    
  } catch (error) {
    console.error("Erro:", error);
    toast.error("Erro ao gerar PIX. Tente novamente.");
  } finally {
    setIsLoading(false);
  }
};
```

## ⚙️ Secrets Necessários no Supabase
- `BUSS_SECRET_KEY`: bp_secret_EdSOnTIt7l1rurgLLQfP6LAA4bFrJOZhYs2AStqB4hit811bvVUKXudKuUZxoPLX
- `BUSS_CLIENT_ID`: bp_client_X3j5UCw8lyRueMdv3VwwXPovS2u9VM6c

## 📞 Webhook URL
Configure na Buss Gateway: `https://[seu-projeto].supabase.co/functions/v1/buss-webhook`