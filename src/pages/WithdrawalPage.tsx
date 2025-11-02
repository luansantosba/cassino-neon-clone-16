import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBonusCheck, checkWithdrawalEligibility } from "@/hooks/useBonusCheck";
import BonusModal from "@/components/BonusModal";

const WithdrawalPage = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [userBalance, setUserBalance] = useState(0);
  const [userCpf, setUserCpf] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ title: "", message: "", type: "error" as "success" | "error" | "info" });

  const bonusData = useBonusCheck(userId);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      
      setUserId(user.id);

      // Get user profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance, cpf')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserBalance(profile.balance || 0);
        setUserCpf(profile.cpf || '');
      }
    };

    loadUserData();
  }, [navigate]);

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountValue = parseFloat(amount.replace(",", "."));
    
    if (!amountValue || amountValue < 100) {
      setModalData({
        title: "Valor Inválido",
        message: "O valor mínimo de saque é R$ 100,00",
        type: "error"
      });
      setModalOpen(true);
      return;
    }

    if (amountValue > userBalance) {
      setModalData({
        title: "Saldo Insuficiente",
        message: "Você não tem saldo suficiente para este saque",
        type: "error"
      });
      setModalOpen(true);
      return;
    }

    // Check rollover eligibility
    const eligibility = checkWithdrawalEligibility(
      bonusData.bonusBalance,
      bonusData.rolloverRequired,
      bonusData.rolloverCurrent,
      bonusData.rolloverCompleted
    );

    if (!eligibility.canWithdraw) {
      setModalData({
        title: "Rollover Pendente",
        message: eligibility.message || "Você precisa completar o rollover antes de sacar",
        type: "info"
      });
      setModalOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setModalData({
          title: "Erro",
          message: "Usuário não encontrado",
          type: "error"
        });
        setModalOpen(true);
        return;
      }

      // Create withdrawal request
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: amountValue,
          pix_key: userCpf,
          status: 'pending'
        });

      if (error) {
        console.error('Withdrawal error:', error);
        setModalData({
          title: "Erro",
          message: "Erro ao solicitar saque. Tente novamente.",
          type: "error"
        });
        setModalOpen(true);
        return;
      }

      // Deduct amount from user balance temporarily
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ 
          balance: userBalance - amountValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (balanceError) {
        console.error('Balance update error:', balanceError);
      }

      setModalData({
        title: "Sucesso! ✅",
        message: "Solicitação de saque enviada com sucesso! Aguarde a aprovação.",
        type: "success"
      });
      setModalOpen(true);
      
      setTimeout(() => {
        navigate("/historico");
      }, 2000);
      
    } catch (error) {
      console.error("Withdrawal error:", error);
      setModalData({
        title: "Erro",
        message: "Erro inesperado. Tente novamente.",
        type: "error"
      });
      setModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseInt(numbers) / 100;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return (
    <>
      <BonusModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
      />
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
          <h1 className="text-lg font-bold text-white">Saque</h1>
          <div className="h-8 w-8" />
        </div>

        <div className="p-6 space-y-6">
          {/* Balance Display */}
          <Card className="p-4 bg-casino-header/30 border-border text-center">
            <div className="text-white text-sm">Saldo disponível</div>
            <div className="text-casino-gold text-2xl font-bold">
              R$ {userBalance.toFixed(2)}
            </div>
          </Card>

          {/* Withdrawal Form */}
          <Card className="p-6 bg-casino-header/30 border-border">
            <form onSubmit={handleWithdrawal} className="space-y-4">
              <div>
                <label className="text-white text-sm block mb-2">Valor do Saque</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white">R$</span>
                  <Input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(formatAmount(e.target.value))}
                    placeholder="0,00"
                    className="bg-background border-border text-white pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-white text-sm block mb-2">Chave PIX (CPF)</label>
                <Input
                  type="text"
                  value={formatCPF(userCpf)}
                  disabled
                  className="bg-background border-border text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Saque será enviado para o CPF cadastrado
                </p>
              </div>

              <Button 
                type="submit"
                disabled={isLoading || !amount}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading ? "Processando..." : "Solicitar Saque"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
};

export default WithdrawalPage;