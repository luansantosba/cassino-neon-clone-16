import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Trophy, Info, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const BonusPage = () => {
  const navigate = useNavigate();
  const [hasDeposited, setHasDeposited] = useState(false);
  const [balance, setBalance] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [lastCollectedDate, setLastCollectedDate] = useState<string | null>(null);
  const [canCollectToday, setCanCollectToday] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (profile) {
        setBalance(profile.balance || 0);
      }

      // Check deposit status
      const depositStatus = localStorage.getItem(`hasMinimumDeposit_${user.id}`);
      setHasDeposited(depositStatus === 'true');

      // Check last collected date
      const savedLastCollected = localStorage.getItem(`lastBonusCollected_${user.id}`);
      setLastCollectedDate(savedLastCollected);

      // Check if can collect today
      checkIfCanCollect(savedLastCollected);
    };

    loadUserData();
  }, [navigate]);

  const checkIfCanCollect = (lastCollected: string | null) => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday
    const currentHour = now.getHours();

    // Only Friday (5) at 12:00 or later
    if (dayOfWeek !== 5) {
      setCanCollectToday(false);
      return;
    }

    if (currentHour < 12) {
      setCanCollectToday(false);
      return;
    }

    // Check if already collected this Friday
    if (lastCollected) {
      const lastCollectedDate = new Date(lastCollected);
      const lastCollectedDay = lastCollectedDate.getDay();
      const lastCollectedWeek = getWeekNumber(lastCollectedDate);
      const currentWeek = getWeekNumber(now);

      // If collected this Friday already, can't collect again
      if (lastCollectedDay === 5 && lastCollectedWeek === currentWeek) {
        setCanCollectToday(false);
        return;
      }
    }

    setCanCollectToday(true);
  };

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const updateBalance = async (newBalance: number) => {
    if (!userId) return;

    const { error } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (error) {
      console.error('Error updating balance:', error);
      toast.error('Erro ao atualizar saldo');
    } else {
      setBalance(newBalance);
    }
  };

  const collectBonus = async () => {
    if (!canCollectToday || !hasDeposited || !userId) return;

    const bonusAmount = 5.00;
    const newBalance = balance + bonusAmount;
    
    await updateBalance(newBalance);

    const now = new Date().toISOString();
    localStorage.setItem(`lastBonusCollected_${userId}`, now);
    setLastCollectedDate(now);
    setCanCollectToday(false);

    toast.success(`Parabéns! Você coletou R$ ${bonusAmount.toFixed(2)} de bônus!`);
  };

  const getNextFridayDate = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const nextFriday = new Date(now);
    nextFriday.setDate(now.getDate() + daysUntilFriday);
    return nextFriday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  };

  const isFriday = () => {
    return new Date().getDay() === 5;
  };

  const isFridayAfterNoon = () => {
    const now = new Date();
    return now.getDay() === 5 && now.getHours() >= 12;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-casino-header/50 border-b border-border p-4 mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          <h1 className="text-foreground text-center flex-1">BÔNUS SEMANAL</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/bonus/regras')}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Deposit Warning */}
          {!hasDeposited && (
            <Card className="mb-4 bg-muted/50 border-border">
              <CardContent className="p-4 text-center">
                <Info className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Para participar, faça um depósito mínimo de R$ 10,00
                </p>
              </CardContent>
            </Card>
          )}

          {/* Main Bonus Card */}
          <Card className={`${canCollectToday && hasDeposited ? 'bg-casino-gold/10 border-casino-gold/30' : 'bg-casino-header/30 border-border'}`}>
            <CardContent className="p-6 text-center space-y-4">
              <div className="mb-2">
                {canCollectToday && hasDeposited ? (
                  <Trophy className="h-12 w-12 text-casino-gold mx-auto" />
                ) : (
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                )}
              </div>
              
              <h2 className="text-white text-2xl font-bold">
                Bônus de Sexta-Feira
              </h2>
              
              <div className="bg-background rounded-lg p-4">
                <p className="text-casino-gold text-3xl font-bold">
                  R$ 5,00
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Grátis toda sexta-feira às 12:00
                </p>
              </div>

              {/* Status Messages */}
              {!hasDeposited && (
                <p className="text-sm text-muted-foreground">
                  Faça um depósito mínimo de R$ 10 para ativar o bônus
                </p>
              )}

              {hasDeposited && !isFriday() && (
                <p className="text-sm text-muted-foreground">
                  Próximo bônus disponível em: {getNextFridayDate()}
                </p>
              )}

              {hasDeposited && isFriday() && !isFridayAfterNoon() && (
                <p className="text-sm text-muted-foreground">
                  Bônus disponível hoje às 12:00 (meio-dia)
                </p>
              )}

              {hasDeposited && !canCollectToday && isFridayAfterNoon() && (
                <p className="text-sm text-muted-foreground">
                  Você já coletou o bônus desta semana
                </p>
              )}

              {canCollectToday && hasDeposited && (
                <Button
                  onClick={collectBonus}
                  className="w-full bg-casino-gold hover:bg-casino-gold/80 text-black font-bold"
                >
                  Coletar Bônus
                </Button>
              )}
            </CardContent>
          </Card>

          {/* How it works */}
          <Card className="bg-casino-header/30 border-border">
            <CardContent className="p-4">
              <h3 className="text-white font-bold mb-3">Como Funciona</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Bônus de R$ 5,00 grátis toda sexta-feira</p>
                <p>• Disponível às 12:00 (meio-dia)</p>
                <p>• Uma coleta por semana</p>
                <p>• Não é acumulativo (se não coletar na sexta, perde)</p>
                <p>• Requer depósito mínimo de R$ 10 para ativar</p>
                <p>• Após o primeiro depósito, o bônus fica ativo para sempre</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BonusPage;
