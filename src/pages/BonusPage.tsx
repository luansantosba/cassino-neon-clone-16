import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Check, Trophy, Info, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface DailyBonus {
  day: number;
  amount: number;
  collected: boolean;
}

const dailyBonuses: DailyBonus[] = [
  { day: 1, amount: 2.50, collected: false },
  { day: 2, amount: 1.00, collected: false },
  { day: 3, amount: 0.50, collected: false },
  { day: 4, amount: 2.50, collected: false },
  { day: 5, amount: 1.00, collected: false },
  { day: 6, amount: 0.50, collected: false },
  { day: 7, amount: 2.00, collected: false },
];

const BonusPage = () => {
  const navigate = useNavigate();
  const [bonuses, setBonuses] = useState<DailyBonus[]>(dailyBonuses);
  const [hasDeposited, setHasDeposited] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [totalCollected, setTotalCollected] = useState(0);
  const [lastCollectedDate, setLastCollectedDate] = useState<string | null>(null);

  useEffect(() => {
    const depositStatus = localStorage.getItem('hasMinimumDeposit');
    setHasDeposited(depositStatus === 'true');

    const savedProgress = localStorage.getItem('dailyBonusProgress');
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setBonuses(progress.bonuses);
      setCurrentDay(progress.currentDay);
      setTotalCollected(progress.totalCollected);
      setLastCollectedDate(progress.lastCollectedDate);
    }
  }, []);

  const canCollectToday = () => {
    if (!hasDeposited) return false;
    
    const today = new Date().toDateString();
    if (lastCollectedDate === today) return false;
    
    return currentDay <= 7;
  };

  const collectDailyBonus = () => {
    if (!canCollectToday()) return;

    const todayBonus = bonuses[currentDay - 1];
    const updatedBonuses = bonuses.map((bonus, index) => 
      index === currentDay - 1 ? { ...bonus, collected: true } : bonus
    );

    const newTotalCollected = totalCollected + todayBonus.amount;
    const newCurrentDay = currentDay + 1;
    const today = new Date().toDateString();

    setBonuses(updatedBonuses);
    setCurrentDay(newCurrentDay);
    setTotalCollected(newTotalCollected);
    setLastCollectedDate(today);

    // Add bonus to user balance
    const userData = localStorage.getItem("casinoUser");
    if (userData) {
      const user = JSON.parse(userData);
      const currentBalance = user.balance || 0;
      user.balance = currentBalance + todayBonus.amount;
      localStorage.setItem("casinoUser", JSON.stringify(user));
    }

    const progress = {
      bonuses: updatedBonuses,
      currentDay: newCurrentDay,
      totalCollected: newTotalCollected,
      lastCollectedDate: today
    };
    localStorage.setItem('dailyBonusProgress', JSON.stringify(progress));

    toast.success(`Parabéns! Você coletou R$ ${todayBonus.amount.toFixed(2)} em saldo real!`);

    if (newCurrentDay > 7) {
      toast.success("Ciclo completo! Faça um novo depósito para desbloquear outro ciclo.");
    }
  };

  const resetCycle = () => {
    setBonuses(dailyBonuses);
    setCurrentDay(1);
    setTotalCollected(0);
    setLastCollectedDate(null);
    localStorage.removeItem('dailyBonusProgress');
    toast.success("Novo ciclo iniciado!");
  };

  const simulateDeposit = () => {
    setHasDeposited(true);
    localStorage.setItem('hasMinimumDeposit', 'true');
    toast.success("Depósito simulado! Agora você pode coletar os bônus diários.");
  };

  const getCardStatus = (bonus: DailyBonus) => {
    if (bonus.collected) return 'collected';
    if (!hasDeposited) return 'blocked';
    if (bonus.day === currentDay && canCollectToday()) return 'available';
    if (bonus.day < currentDay) return 'missed';
    return 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'collected':
        return <Check className="h-5 w-5 text-emerald-400" />;
      case 'blocked':
        return <Calendar className="h-5 w-5 text-muted-foreground" />;
      case 'available':
        return <Trophy className="h-5 w-5 text-casino-gold" />;
      default:
        return <Calendar className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'collected':
        return 'Coletado';
      case 'blocked':
        return 'Bloqueado';
      case 'available':
        return 'Disponível';
      case 'missed':
        return 'Perdido';
      default:
        return 'Pendente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'collected':
        return 'text-green-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const progressPercentage = (currentDay - 1) * (100 / 7);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header Card Fixo */}
        <div className="bg-casino-header/50 border-b border-border p-4 mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          <h1 className="text-foreground text-center flex-1">BÔNUS DIÁRIO</h1>
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

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Progresso</span>
              <span className="text-sm text-casino-gold">R$ {totalCollected.toFixed(2)}</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2 [&>*]:bg-success" 
            />
            <p className="text-xs text-muted-foreground text-center mt-1">
              Dia {Math.min(currentDay, 7)} de 7
            </p>
          </div>

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

          {/* Bonus Grid */}
          <div className="grid grid-cols-2 gap-3">
            {bonuses.map((bonus) => {
              const status = getCardStatus(bonus);
              const isAvailable = status === 'available';
              
              return (
                <Card 
                  key={bonus.day}
                  className={`
                    transition-all duration-200
                    ${status === 'collected' ? 'bg-emerald-950/30 border-emerald-800/50' : ''}
                    ${status === 'blocked' ? 'bg-muted/30 border-muted' : ''}
                    ${status === 'available' ? 'bg-casino-gold/10 border-casino-gold/30' : ''}
                    ${status === 'pending' ? 'bg-card border-border' : ''}
                    ${status === 'missed' ? 'bg-muted/20 border-muted' : ''}
                  `}
                >
                  <CardContent className="p-3 text-center">
                    <div className="mb-2">
                      {getStatusIcon(status)}
                    </div>
                    <h3 className="text-foreground text-sm mb-1">
                      Dia {bonus.day}
                    </h3>
                    <p className="text-casino-gold text-sm mb-2">
                      R$ {bonus.amount.toFixed(2)}
                    </p>
                    <p className={`text-xs mb-2 ${getStatusColor(status)}`}>
                      {getStatusText(status)}
                    </p>
                    {isAvailable && (
                      <Button
                        onClick={collectDailyBonus}
                        size="sm"
                        variant="success"
                        className="w-full text-xs"
                      >
                        Coletar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Reset Button */}
          {currentDay > 7 && (
            <Card className="bg-muted/30 border-border">
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground text-sm mb-3">
                  Ciclo completo! Faça um novo depósito para continuar.
                </p>
                <Button 
                  onClick={resetCycle}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Resetar Ciclo (Teste)
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BonusPage;