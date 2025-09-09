import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ScratchCard20to50000Cover = () => {
  const navigate = useNavigate();

  return (
    <Card className="bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 border-green-600/20 overflow-hidden">
      <div className="p-6 text-center">
        <div className="mb-4">
          <img 
            src="/lovable-uploads/173ff6c0-48ef-4a45-bd3e-48aaefdc5e4b.png" 
            alt="Raspadinha 20 para 50 mil"
            className="w-32 h-32 mx-auto object-contain"
          />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Raspadinha Suprema
        </h3>
        <p className="text-green-200 text-sm mb-4">
          20 reais ganha até 50 mil reais
        </p>
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/raspadinha-20-para-50000')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            Jogar Agora
          </Button>
          <Button 
            onClick={() => navigate('/raspadinha-20-para-50000/regras')}
            variant="outline"
            className="w-full border-green-500/30 text-green-200 hover:bg-green-600/20"
          >
            Ver Regras
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ScratchCard20to50000Cover;