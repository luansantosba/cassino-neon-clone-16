import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Menu, X, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PRIZES = {
  "perdeu": { 
    value: 0, 
    label: "VOCÊ PERDEU", 
    image: "/lovable-uploads/9aca46a0-ff41-4f1a-80a2-0103c8babece.png"
  },
  "10-centavos": { 
    value: 0.10, 
    label: "VOCÊ GANHOU R$ 0,10", 
    image: "/lovable-uploads/60febdad-e975-4efa-a58a-f0716a3c9470.png"
  },
  "5-reais": { 
    value: 5, 
    label: "VOCÊ GANHOU R$ 5,00", 
    image: "/lovable-uploads/a36bfcbb-2f0e-448c-959f-04b2022bd19a.png"
  },
  "10-reais": { 
    value: 10, 
    label: "VOCÊ GANHOU R$ 10,00", 
    image: "/lovable-uploads/aa7c9151-648f-4cf1-bd53-89f2b5f6611a.png"
  }
};

const ScratchCard = () => {
  const navigate = useNavigate();
  const [gameNumber, setGameNumber] = useState(1);
  const [prizeKey, setPrizeKey] = useState<string>("");
  const [isScratched, setIsScratched] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [balance, setBalance] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string>("");
  const [cardGenerated, setCardGenerated] = useState(false);
  const [gameHistory, setGameHistory] = useState<Array<{result: 'win' | 'lose', cartela: number, timestamp: number}>>([]);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [currentCartela, setCurrentCartela] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load user data and balance
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
    };

    loadUserData();
  }, [navigate]);

  // Update balance in database
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

  const getPrizeForCard = (cardNumber: number): string => {
    const cycle = ((cardNumber - 1) % 50) + 1;
    
    // Lógica de manipulação controlada
    if (cycle >= 1 && cycle <= 2) return "perdeu"; // Cartelas 1-2: não ganha nada
    if (cycle >= 3 && cycle <= 6) return "10-centavos"; // Cartelas 3-6: ganha 0,10 centavos
    if (cycle >= 7 && cycle <= 10) return "perdeu"; // Cartelas 7-10: não ganha nada
    if (cycle === 11) return "10-centavos"; // Cartela 11: ganha 0,10 centavos
    if (cycle === 12) return "5-reais"; // Cartela 12: ganha 5 reais
    if (cycle >= 13 && cycle <= 17) return "10-centavos"; // Cartelas 13-17: ganha 0,10 centavos
    if (cycle >= 18 && cycle <= 25) return "perdeu"; // Cartelas 18-25: não ganha nada
    if (cycle >= 26 && cycle <= 31) return "10-centavos"; // Cartelas 26-31: ganha 0,10 centavos
    if (cycle === 32) return "5-reais"; // Cartela 32: ganha 5 reais
    if (cycle >= 33 && cycle <= 40) return "perdeu"; // Cartelas 33-40: não ganha nada
    if (cycle >= 41 && cycle <= 43) return "10-centavos"; // Cartelas 41-43: ganha 0,10 centavos
    if (cycle >= 44 && cycle <= 49) return "perdeu"; // Cartelas 44-49: não ganha nada
    if (cycle === 50) return "10-reais"; // Cartela 50: ganha 10 reais
    
    return "perdeu"; // Default fallback
  };

  const generateCard = (forGameNum?: number) => {
    const currentNum = forGameNum ?? gameNumber;
    const prize = getPrizeForCard(currentNum);
    
    setPrizeKey(prize);
    setIsScratched(false);
    setIsRevealed(false);
    setCardGenerated(true);
    
    // Redesenhar tampão cinza no canvas
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#888888';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }, 100);
  };

  const buyCard = () => {
    if (balance < 1) {
      toast.error("Saldo insuficiente!", {
        position: "top-center",
      });
      return;
    }
    
    const newBalance = balance - 1;
    updateBalance(newBalance);
    
    const currentCard = gameNumber;
    setCurrentCartela(currentCard);
    generateCard(currentCard);
    setGameNumber(prev => (prev % 50) + 1);
    setLastResult("");
    toast.success("Nova cartela comprada!", {
      position: "top-center",
    });
  };

  const revealAll = () => {
    setIsScratched(true);
    setIsRevealed(true);
    
    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    checkWin();
  };

  const checkWin = () => {
    const prize = PRIZES[prizeKey as keyof typeof PRIZES];
    
    if (prize.value > 0) {
      const newBalance = balance + prize.value;
      updateBalance(newBalance);
      // Add to history
      setGameHistory(prev => [...prev, {
        result: 'win', 
        cartela: currentCartela,
        timestamp: Date.now()
      }]);
      
      setLastResult(`Parabéns! ${prize.label}`);
      toast.success(`🎉 ${prize.label}`, {
        position: "top-center",
        duration: 3000,
      });
    } else {
      // Add to history
      setGameHistory(prev => [...prev, {
        result: 'lose', 
        cartela: currentCartela,
        timestamp: Date.now()
      }]);
      
      setLastResult("Que pena! Você perdeu.");
      toast.error("😔 Que pena! Você perdeu.", {
        position: "top-center",
      });
    }
  };
  
  const handleScratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (isRevealed || !prizeKey) return; // Só permite raspar se tiver cartela comprada
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    if (isScratching) {
      // Check if enough area is scratched to auto-complete
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let transparentPixels = 0;
      
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) transparentPixels++;
      }
      
      const totalPixels = pixels.length / 4;
      const scratchedPercentage = transparentPixels / totalPixels;
      
      if (scratchedPercentage > 0.6) {
        setIsScratched(true);
        setIsRevealed(true);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        checkWin();
      }
    }
  };

  useEffect(() => {
    // Load balance from casinoUser instead of fixed value
    const userData = localStorage.getItem("casinoUser");
    if (userData) {
      const user = JSON.parse(userData);
      setBalance(user.balance || 10);
    } else {
      setBalance(10); // Start with 10 reais if no user data
    }
    setGameNumber(1); // Reinicia sempre na cartela 1 ao carregar/recarregar
    
    // Inicializar canvas com fundo cinza
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#888888';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }, 100);
  }, []);

  const currentPrize = prizeKey ? PRIZES[prizeKey as keyof typeof PRIZES] : PRIZES["perdeu"];

  const handleExit = () => {
    if (cardGenerated && !isRevealed) {
      setShowExitDialog(true);
    } else {
      navigate('/');
    }
  };

  const confirmExit = () => {
    setShowExitDialog(false);
    navigate('/');
  };

  const cancelExit = () => {
    setShowExitDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-casino-header/50 border-b border-border p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExit}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex-1"></div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/raspadinha/regras')}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Notification Space */}
        <div className="mx-4 mt-4 h-12">
          {lastResult && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <Info className="w-4 h-4" />
              <span>{lastResult}</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Scratch Card */}
          <div className="relative mx-auto w-80 h-80 rounded-xl overflow-hidden">
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              className="absolute inset-0 w-full h-full cursor-pointer z-10 touch-none"
              style={{ touchAction: 'none' }}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsScratching(true);
                handleScratch(e);
              }}
              onMouseMove={(e) => {
                e.preventDefault();
                isScratching && handleScratch(e);
              }}
              onMouseUp={() => setIsScratching(false)}
              onMouseLeave={() => setIsScratching(false)}
              onTouchStart={(e) => {
                e.preventDefault();
                setIsScratching(true);
                handleScratch(e);
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                isScratching && handleScratch(e);
              }}
              onTouchEnd={() => setIsScratching(false)}
            />
            
            {/* Prize content behind canvas */}
            {prizeKey && (
              <div className="absolute inset-0 z-0 flex items-center justify-center bg-white">
                <img 
                  src={currentPrize.image}
                  alt={currentPrize.label}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button 
              onClick={buyCard}
              disabled={balance < 1 || (cardGenerated && !isRevealed)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              Comprar carteira
            </Button>
            <div className="flex-1 flex items-center justify-center bg-casino-header/50 border border-white/20 rounded-lg px-3 py-2">
              <span className="text-white font-bold">R$ {balance.toFixed(2)}</span>
            </div>
          </div>

          {/* Histórico */}
          <div className="mt-6">
            <h3 className="text-white text-center text-sm mb-3">Histórico</h3>
            <div className="bg-casino-header/30 rounded-lg p-4 max-h-32 overflow-y-auto">
              {gameHistory.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-2">
                  Nenhuma partida ainda
                </div>
              ) : (
                <div className="space-y-2">
                  {gameHistory.slice().reverse().map((game, index) => (
                    <div key={`${game.timestamp}-${index}`} className="flex justify-start text-sm py-1">
                      <span className="text-white">Cartela {String(game.cartela).padStart(2, '0')} = </span>
                      <span className={game.result === 'win' ? 'text-green-500' : 'text-red-500'}>
                        {game.result === 'win' ? 'Você ganhou' : 'Você perdeu'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exit Confirmation Dialog */}
        <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar saída</DialogTitle>
              <DialogDescription>
                Você tem uma cartela comprada que ainda não foi raspada. Se sair agora, perderá a chance de ganhar o prêmio e não haverá estorno do valor pago.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={cancelExit}>
                Ficar
              </Button>
              <Button variant="destructive" onClick={confirmExit}>
                Sair mesmo assim
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ScratchCard;