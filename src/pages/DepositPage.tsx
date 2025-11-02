import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isValidCPF, formatCPF } from "@/utils/cpfValidator";

// Utility functions for PIX simulation
const generatePixString = (amount: number, txId: string) => {
  // Formato padrão PIX do Banco Central
  const pixKey = "pix@bdc.com.br";
  const amountStr = amount.toFixed(2).replace('.', '');
  return `00020126580014BR.GOV.BCB.PIX0136${pixKey}0208Deposito52040000530398654${amountStr}5802BR5925BDC CASINO LTDA6009SAO PAULO61088000000062070503${txId.substr(-3)}6304`;
};

const generateRealisticQRCode = async (pixString: string, amount: number): Promise<string> => {
  // Gerar um QR Code mais realista (ainda simulado)
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Fundo branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 300, 300);
    
    // Simular padrão de QR Code com quadrados
    ctx.fillStyle = '#000000';
    
    // Cantos do QR Code
    const drawCorner = (x: number, y: number) => {
      ctx.fillRect(x, y, 70, 70);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x + 10, y + 10, 50, 50);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 20, y + 20, 30, 30);
    };
    
    drawCorner(20, 20); // Top left
    drawCorner(210, 20); // Top right
    drawCorner(20, 210); // Bottom left
    
    // Dados aleatórios para simular QR Code
    for (let i = 0; i < 1000; i++) {
      const x = Math.floor(Math.random() * 260) + 20;
      const y = Math.floor(Math.random() * 260) + 20;
      if (Math.random() > 0.5) {
        ctx.fillRect(x, y, 10, 10);
      }
    }
    
    // Texto com o valor
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`PIX - R$ ${amount.toFixed(2)}`, 150, 290);
  }
  
  return canvas.toDataURL().split(',')[1];
};

const DepositPage = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [userData, setUserData] = useState<any>(null);
  const [qrCode, setQrCode] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");

  useEffect(() => {
    let sub: { unsubscribe: () => void } | null = null;

    const setup = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUserData(session.user);
          // Pre-fill user data if available
          setFullName(session.user.user_metadata?.full_name || "");
          setEmail(session.user.email || "");
          setCpf(session.user.user_metadata?.cpf || "");
        } else {
          navigate('/login');
        }
      });
      sub = subscription;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserData(session.user);
        // Pre-fill user data from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, cpf')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setFullName(profile.full_name || "");
          setEmail(profile.email || session.user.email || "");
          setCpf(profile.cpf || "");
        }
      } else {
        navigate('/login');
      }
    };

    setup();
    return () => sub?.unsubscribe();
  }, [navigate]);

  // Sistema PIX real integrado com Buss Gateway
  const generatePix = async (): Promise<boolean> => {
    const amountValue = parseFloat(amount.replace(",", "."));
    
    if (!amountValue || amountValue < 7) {
      toast.error("O valor mínimo é R$ 7,00");
      return false;
    }

    if (amountValue > 5000) {
      toast.error("O valor máximo é R$ 5.000,00");
      return false;
    }

    if (!fullName.trim()) {
      toast.error("Por favor, insira seu nome completo");
      return false;
    }

    if (!email.trim()) {
      toast.error("Por favor, insira seu e-mail");
      return false;
    }

    if (!cpf.trim() || !isValidCPF(cpf)) {
      toast.error("Por favor, insira um CPF válido");
      return false;
    }

    setIsLoading(true);

    try {
      // Chamar a Edge Function real da Buss Gateway
      const { data, error } = await supabase.functions.invoke('create-pix', {
        body: { 
          amount: amountValue,
          buyer_name: fullName.trim(),
          buyer_email: email.trim(),
          buyer_cpf: cpf.replace(/\D/g, '') // Remove non-digits
        }
      });
      
      if (error) {
        console.error("PIX creation error:", error);
        toast.error("Erro ao gerar PIX. Tente novamente.");
        return false;
      }
      
      // Salvar dados temporários para a tela de pagamento
      localStorage.setItem("tempPixData", JSON.stringify({
        qrCode: data.qr_code,
        pixKey: data.pix_key,
        amount: amount,
        txId: data.transaction_id
      }));
      
      toast.success("PIX real gerado com sucesso!");
      return true;
      
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao gerar PIX. Tente novamente.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseInt(numbers) / 100;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-casino-header/50 border-b border-border p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-white">Depósito</h1>
          <div className="h-8 w-8" />
        </div>

        <div className="p-6 space-y-6">

          {/* Amount Input */}
          <Card className="p-6 bg-casino-header/30 border-border">
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm block mb-2">Valor do Depósito</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white">R$</span>
                  <Input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(formatAmount(e.target.value))}
                    placeholder="0,00"
                    className="bg-background border-border text-white pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Valor mínimo: R$ 7,00 | Valor máximo: R$ 5.000,00
                </p>
              </div>

              {/* Hidden user data - automatically filled */}
              <input type="hidden" value={fullName} />
              <input type="hidden" value={email} />
              <input type="hidden" value={cpf} />

              {/* Quick Amount Options */}
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  onClick={() => setAmount("20,00")}
                  variant="outline"
                  size="sm"
                  className="text-white border-white hover:bg-white hover:text-black"
                >
                  R$ 20
                </Button>
                <Button 
                  onClick={() => setAmount("50,00")}
                  variant="outline"
                  size="sm"
                  className="text-white border-white hover:bg-white hover:text-black"
                >
                  R$ 50
                </Button>
                <Button 
                  onClick={() => setAmount("100,00")}
                  variant="outline"
                  size="sm"
                  className="text-white border-white hover:bg-white hover:text-black"
                >
                  R$ 100
                </Button>
              </div>

              <Button 
                onClick={async () => {
                  const ok = await generatePix();
                  if (ok) navigate('/pix-payment');
                }}
                disabled={isLoading || !amount}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? "Gerando PIX..." : "Gerar PIX"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DepositPage;