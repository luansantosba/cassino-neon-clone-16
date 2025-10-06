import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ApplyCouponResponse {
  success: boolean;
  message: string;
  bonus_amount?: number;
  requires_deposit?: boolean;
  minimum_deposit?: number;
}

const CouponsPage = () => {
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUserId(user.id);
    };
    checkUser();
  }, [navigate]);

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Por favor, insira um código de cupom");
      return;
    }

    if (!userId) {
      toast.error("Você precisa estar logado para usar cupons");
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the apply_coupon function
      const { data, error } = await supabase.rpc('apply_coupon' as any, {
        p_user_id: userId,
        p_coupon_code: couponCode.toUpperCase(),
        p_deposit_amount: 0
      });

      if (error) {
        console.error('Error applying coupon:', error);
        toast.error("Erro ao aplicar cupom");
        return;
      }

      // Type guard for the response
      const response = data as ApplyCouponResponse;
      
      if (response && typeof response === 'object' && 'success' in response) {
        if (response.success) {
          toast.success(response.message || "Cupom aplicado com sucesso!");
          setCouponCode("");
          
          // Refresh user balance
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          toast.error(response.message || "Erro ao aplicar cupom");
        }
      } else {
        toast.error("Resposta inesperada do servidor");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Erro ao aplicar cupom");
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-lg font-bold text-white">Cupons</h1>
          <div className="h-8 w-8" />
        </div>

        <div className="p-6 space-y-6">
          {/* Coupon Card */}
          <Card className="p-6 bg-casino-header/30 border-border">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-casino-gold/10 p-4 rounded-full">
                  <Ticket className="h-12 w-12 text-casino-gold" />
                </div>
              </div>
              
              <div>
                <h2 className="text-white text-lg font-bold mb-2">Resgatar Cupom</h2>
                <p className="text-sm text-muted-foreground">
                  Insira o código do cupom para receber seu bônus
                </p>
              </div>

              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Digite o código do cupom"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="text-center font-mono text-lg tracking-widest uppercase"
                  disabled={isLoading}
                />

                <Button 
                  onClick={handleRedeemCoupon}
                  disabled={isLoading || !couponCode.trim()}
                  className="w-full bg-casino-gold hover:bg-casino-gold/80 text-black font-bold"
                >
                  {isLoading ? "Verificando..." : "Reivindicar"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-6 bg-casino-header/30 border-border">
            <h3 className="text-white font-bold mb-3">Como Funciona</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Insira o código do cupom no campo acima</p>
              <p>• Clique em "Reivindicar" para ativar o cupom</p>
              <p>• O bônus será creditado automaticamente</p>
              <p>• Você deve apostar 1x o valor do bônus antes de poder sacar</p>
              <p>• Cada cupom só pode ser usado uma vez</p>
              <p>• Cupons podem ter data de validade e requisitos específicos</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CouponsPage;
