import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

const dailyBonuses = [
  { day: 1, amount: 2.50 },
  { day: 2, amount: 1.00 },
  { day: 3, amount: 0.50 },
  { day: 4, amount: 2.50 },
  { day: 5, amount: 1.00 },
  { day: 6, amount: 0.50 },
  { day: 7, amount: 2.00 },
];

const BonusRulesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header Card Fixo */}
        <div className="bg-casino-header/50 border-b border-border p-4 mb-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/bonus')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-foreground text-center flex-1">REGRAS DO BÔNUS</h1>
        </div>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-foreground mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Como Funciona
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>• Colete até R$ 10,00 em saldo real durante 7 dias consecutivos.</p>
                <p>• Para participar, é necessário ter feito um depósito mínimo de R$ 10,00 nos últimos 7 dias.</p>
                <p>• Você pode coletar apenas 1 bônus por dia.</p>
                <p>• O saldo recebido é em saldo real, disponível para saque imediatamente.</p>
                <p>• Após completar os 7 dias, faça um novo depósito para iniciar outro ciclo.</p>
                <p>• Se perder um dia, você perde o bônus daquele dia específico.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-foreground mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Valores dos Bônus
              </h3>
              <div className="space-y-2 text-sm">
                {dailyBonuses.map((bonus) => (
                  <div key={bonus.day} className="flex justify-between p-3 bg-muted/20 rounded">
                    <span className="text-muted-foreground">Dia {bonus.day}</span>
                    <span className="text-casino-gold font-medium">R$ {bonus.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between p-3 bg-casino-gold/10 rounded mt-3">
                <span className="text-foreground font-medium">Total</span>
                <span className="text-casino-gold font-bold">R$ 10,00</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BonusRulesPage;