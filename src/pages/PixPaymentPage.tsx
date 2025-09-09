import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { X, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PixPaymentPage = () => {
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [amount, setAmount] = useState("");
  const [txId, setTxId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [timeRemaining, setTimeRemaining] = useState(30);

  useEffect(() => {
    // Recuperar dados do PIX do localStorage temporário
    const pixData = localStorage.getItem("tempPixData");
    if (pixData) {
      const data = JSON.parse(pixData);
      setQrCode(data.qrCode);
      setPixKey(data.pixKey);
      setAmount(data.amount);
      setTxId(data.txId);
      // Limpar dados temporários
      localStorage.removeItem("tempPixData");
    } else {
      // Se não há dados, voltar para página de depósito
      navigate("/depositar");
    }
  }, [navigate]);

  // Check payment status with Supabase deposits table
  useEffect(() => {
    if (!txId) return;
    
    const checkPaymentStatus = async () => {
      try {
        const { data: deposit } = await supabase
          .from('deposits')
          .select('status')
          .eq('transaction_id', txId)
          .single();
        
        if (deposit && deposit.status === 'confirmed') {
          setPaymentStatus('confirmed');
          toast.success("Pagamento confirmado com sucesso!");
        }
      } catch (error) {
        console.log("Status check:", error);
      }
    };

    const interval = setInterval(checkPaymentStatus, 5000);
    return () => clearInterval(interval);
  }, [txId]);

  // Countdown timer
  useEffect(() => {
    if (paymentStatus === 'confirmed') return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-casino-header/50 border-b border-border p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/depositar')}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-white">Pagamento PIX</h1>
          <div className="h-8 w-8" />
        </div>

        <div className="p-6">

          {/* Payment Status */}
          <Card className="p-4 bg-casino-header/30 border-border mb-4">
            <div className="flex items-center gap-3">
              {paymentStatus === 'confirmed' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-500 font-semibold">Pagamento Confirmado!</span>
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <span className="text-yellow-500">Aguardando pagamento...</span>
                </>
              )}
            </div>
          </Card>

          {/* PIX Code */}
          <Card className="p-6 bg-casino-header/30 border-border">
            <div className="text-center space-y-4">
              <p className="text-white text-sm">
                {paymentStatus === 'confirmed' 
                  ? "Pagamento processado com sucesso!" 
                  : "Código PIX para pagamento"}
              </p>
              
              {pixKey && (
                <div className="space-y-2">
                  <p className="text-white text-sm">Código PIX:</p>
                  <div className="bg-background p-3 rounded border border-border">
                    <p className="text-white text-xs break-all font-mono">{pixKey}</p>
                  </div>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(pixKey);
                      toast.success("Código PIX copiado!");
                    }}
                    variant="outline"
                    size="sm"
                    className="text-white border-white hover:bg-white hover:text-black"
                  >
                    Copiar Código PIX
                  </Button>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-white text-sm font-semibold">
                  Valor: R$ {amount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {paymentStatus === 'confirmed' 
                    ? "O valor foi adicionado ao seu saldo"
                    : "Pagamento será confirmado automaticamente"}
                </p>
              </div>

              {paymentStatus === 'confirmed' && (
                <Button
                  onClick={() => navigate('/')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Voltar ao Casino
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PixPaymentPage;