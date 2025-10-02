import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Menu, X, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PRIZES = {
  "perdeu": { 
    value: 0, 
    label: "VOCÊ PERDEU", 
    image: "/lovable-uploads/fdb36f0d-2ae7-431d-a888-a42120cb1988.png"
  },
  "1-real": { 
    value: 1, 
    label: "VOCÊ GANHOU R$ 1,00", 
    image: "/lovable-uploads/b9250479-9c3d-4b7a-b454-676b6f480c2d.png"
  },
  "10-reais": { 
    value: 10, 
    label: "VOCÊ GANHOU R$ 10,00", 
    image: "/lovable-uploads/c00bf361-34f2-46a8-8988-ebdd2f886352.png"
  },
  "20-reais": { 
    value: 20, 
    label: "VOCÊ GANHOU R$ 20,00", 
    image: "/lovable-uploads/925e665b-f246-4043-b117-1d6c8c367a78.png"
  }
};

const ScratchCard5to2500 = () => {
  const navigate = useNavigate();
  const [gameNumber, setGameNumber] = useState(1);
  const [prizeKey, setPrizeKey] = useState<string>("");
  const [isScratched, setIsScratched] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [balance, setBalance] = useState(0);
  const [lastResult, setLastResult] = useState<string>("");
  const [cardGenerated, setCardGenerated] = useState(false);
  const [gameHistory, setGameHistory] = useState<Array<{result: 'win' | 'lose', cartela: number, timestamp: number, prize?: string}>>([]);
  const [actualGameNumber, setActualGameNumber] = useState(1);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [currentCartela, setCurrentCartela] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const getPrizeForCard = (cardNumber: number): string => {
    const cycle = ((cardNumber - 1) % 50) + 1;
    
    // Nova lógica conforme especificação
    if (cycle >= 1 && cycle <= 3) return "perdeu"; // Cartelas 1-3: não ganha nada
    if (cycle === 4) return "1-real"; // Cartela 4: ganha 1 real
    if (cycle >= 5 && cycle <= 6) return "perdeu"; // Cartelas 5-6: não ganha nada
    if (cycle === 7) return "1-real"; // Cartela 7: ganha 1 real
    if (cycle === 8) return "10-reais"; // Cartela 8: ganha 10 reais
    if (cycle >= 9 && cycle <= 15) return "perdeu"; // Cartelas 9-15: não ganha nada
    if (cycle >= 16 && cycle <= 18) return "1-real"; // Cartelas 16-18: ganha 1 real
    if (cycle === 19) return "perdeu"; // Cartela 19: não ganha nada
    if (cycle === 20) return "10-reais"; // Cartela 20: ganha 10 reais
    if (cycle >= 21 && cycle <= 25) return "perdeu"; // Cartelas 21-25: não ganha nada
    if (cycle >= 26 && cycle <= 27) return "1-real"; // Cartelas 26-27: ganha 1 real
    if (cycle >= 28 && cycle <= 31) return "perdeu"; // Cartelas 28-31: não ganha nada
    if (cycle === 32) return "10-reais"; // Cartela 32: ganha 10 reais
    if (cycle >= 33 && cycle <= 37) return "perdeu"; // Cartelas 33-37: não ganha nada
    if (cycle >= 38 && cycle <= 39) return "1-real"; // Cartelas 38-39: ganha 1 real
    if (cycle >= 40 && cycle <= 49) return "perdeu"; // Cartelas 40-49: não ganha nada
    if (cycle === 50) return "20-reais"; // Cartela 50: ganha 20 reais
    
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
    if (balance < 5) {
      toast.error("Saldo insuficiente!", {
        position: "top-center",
      });
      return;
    }
    
    const newBalance = balance - 5;
    setBalance(newBalance);
    
    // Update balance in localStorage casinoUser
    const userData = localStorage.getItem("casinoUser");
    if (userData) {
      const user = JSON.parse(userData);
      user.balance = newBalance;
      localStorage.setItem("casinoUser", JSON.stringify(user));
    }
    
    const currentCard = gameNumber;
    setCurrentCartela(currentCard);
    generateCard(currentCard);
    setGameNumber(prev => (prev % 50) + 1);
    setActualGameNumber(prev => prev + 1);
    setLastResult(""); // Clear previous result when buying new card
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
      setBalance(newBalance);
      
      // Update balance in localStorage casinoUser
      const userData = localStorage.getItem("casinoUser");
      if (userData) {
        const user = JSON.parse(userData);
        user.balance = newBalance;
        localStorage.setItem("casinoUser", JSON.stringify(user));
      }
      
      setLastResult(`Parabéns! Você ganhou ${prize.label.replace('VOCÊ GANHOU ', '')}`);
      setGameHistory(prev => [...prev, {result: 'win' as const, cartela: currentCartela, timestamp: Date.now(), prize: prize.label.replace('VOCÊ GANHOU ', '')}].slice(-5));
    } else {
      setLastResult("Não foi dessa vez! Tente novamente.");
      setGameHistory(prev => [...prev, {result: 'lose' as const, cartela: currentCartela, timestamp: Date.now()}].slice(-5));
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
      setBalance(user.balance || 50);
    } else {
      setBalance(50); // Start with 50 reais if no user data
    }
    setGameNumber(1); // Reinicia sempre na cartela 1 ao carregar/recarregar
    setActualGameNumber(1); // Reinicia contador de jogos
    
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
            onClick={() => navigate('/raspadinha-5-para-2500/regras')}
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
              disabled={balance < 5 || (cardGenerated && !isRevealed)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              Comprar cartela
            </Button>
            <div className="flex-1 flex items-center justify-center bg-casino-header/50 border border-white/20 rounded-lg px-3 py-2">
              <span className="text-white font-bold">R$ {balance.toFixed(2)}</span>
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

export default ScratchCard5to2500;