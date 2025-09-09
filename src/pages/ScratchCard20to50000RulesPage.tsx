import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ScratchCard20to50000RulesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-casino-header/50 border-b border-border p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/raspadinha-20-para-50000')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-foreground text-center flex-1">REGRAS</h1>
          <div className="w-8"></div>
        </div>

        <div className="p-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-6">
              <div>
                <h2 className="text-foreground font-semibold mb-3">Como Jogar</h2>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Compre uma cartela por R$ 20,00</p>
                  <p>• Raspe a cartela para revelar a imagem</p>
                  <p>• A imagem determina se você ganhou um prêmio</p>
                  <p>• Os prêmios são creditados automaticamente</p>
                </div>
              </div>

              <div>
                <h2 className="text-foreground font-semibold mb-3">Prêmios</h2>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Com apenas R$ 20,00 você pode ganhar até R$ 50.000,00</p>
                  <p>• Diferentes imagens representam diferentes prêmios</p>
                  <p>• Todos os prêmios são pagos em saldo real</p>
                  <p>• Sem limite de cartelas por dia</p>
                </div>
              </div>

              <div>
                <h2 className="text-foreground font-semibold mb-3">Informações Importantes</h2>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Jogo de sorte e responsabilidade do jogador</p>
                  <p>• Apostas apenas para maiores de 18 anos</p>
                  <p>• Jogue com responsabilidade</p>
                  <p>• Os resultados são determinados por sistema aleatório</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScratchCard20to50000RulesPage;