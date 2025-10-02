import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

export default BonusRulesPage;
