import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MinesGame = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState(0);
  const [minesCount, setMinesCount] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [revealedTiles, setRevealedTiles] = useState<Set<number>>(new Set());
  const [minePositions, setMinePositions] = useState<Set<number>>(new Set());
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [gemsFound, setGemsFound] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [bombClickNumber, setBombClickNumber] = useState(1);

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

  // Multiplier table for each mine count and click
  const multiplierTable: { [mines: number]: number[] } = {
    1: [0.99, 1.03, 1.08, 1.13, 1.19, 1.25, 1.32, 1.40, 1.48, 1.58, 1.70, 1.83, 1.98, 2.16, 2.38, 2.64, 2.97, 3.39, 3.96, 4.75, 5.94, 7.92, 11.88, 23.75],
    2: [1.03, 1.13, 1.23, 1.36, 1.50, 1.67, 1.86, 2.10, 2.38, 2.71, 3.13, 3.65, 4.32, 5.18, 6.33, 7.92, 10.18, 13.57, 19.00, 28.50, 47.50, 95.00, 285.00],
    3: [1.08, 1.23, 1.42, 1.64, 1.92, 2.25, 2.68, 3.21, 3.90, 4.80, 6.00, 7.64, 9.93, 13.24, 18.21, 26.01, 39.02, 62.43, 109.25, 218.50, 546.25, 2185.00],
    4: [1.13, 1.36, 1.64, 2.01, 2.48, 3.10, 3.93, 5.05, 6.60, 8.80, 12.01, 16.81, 24.28, 36.42, 57.23, 95.38, 171.68, 343.36, 801.17, 2403.50, 12017.50],
    5: [1.19, 1.50, 1.92, 2.48, 3.26, 4.34, 5.89, 8.16, 11.56, 16.81, 25.21, 39.22, 63.73, 109.25, 200.29, 400.58, 901.31, 2253.27, 6759.81, 30359.16],
    6: [1.25, 1.67, 2.25, 3.10, 4.34, 6.22, 9.34, 14.01, 22.42, 37.37, 65.40, 120.15, 240.30, 560.70, 1682.10, 7569.45, 37847.25, 189236.25, 946181.25],
    7: [1.32, 1.86, 2.68, 3.93, 5.89, 9.16, 14.94, 25.15, 45.28, 86.03, 172.06, 378.53, 984.17, 2952.50, 14762.50, 73812.50, 369062.50, 1845312.50],
    8: [1.40, 2.10, 3.21, 5.05, 8.16, 13.60, 24.00, 45.00, 90.00, 198.00, 495.00, 1485.00, 7425.00, 59400.00, 475200.00, 3801600.00, 30412800.00],
    9: [1.48, 2.38, 3.90, 6.60, 11.56, 20.23, 37.09, 72.17, 162.38, 405.94, 1217.81, 4871.25, 31663.13, 316631.25, 3166312.50, 25330500.00],
    10: [1.58, 2.71, 4.80, 8.80, 16.81, 32.25, 64.50, 138.96, 347.40, 1042.20, 4168.80, 29181.60, 291816.00, 2918160.00, 29181600.00],
    11: [1.67, 2.94, 5.05, 9.34, 17.28, 33.38, 68.74, 148.30, 370.75, 1235.83, 12358.30, 123583.00, 1235830.00, 12358300.00],
    12: [1.76, 3.30, 6.00, 11.33, 22.62, 48.45, 106.72, 266.80, 888.00, 3552.00, 35520.00, 355200.00, 3552000.00],
    13: [1.86, 3.70, 6.93, 13.16, 27.96, 63.48, 152.96, 458.88, 1835.52, 18355.20, 183552.00, 1835520.00],
    14: [1.96, 4.13, 7.81, 16.02, 34.91, 85.11, 242.83, 974.15, 8747.38, 87473.75, 874737.50],
    15: [2.06, 4.60, 9.03, 18.82, 42.00, 106.99, 314.90, 1260.00, 11340.00, 113400.00],
    16: [2.17, 5.13, 10.42, 22.05, 49.88, 137.78, 441.13, 1764.50, 15880.50],
    17: [2.28, 5.70, 12.52, 28.70, 70.29, 198.60, 792.45, 7132.05],
    18: [2.40, 6.33, 15.16, 35.78, 88.95, 355.80, 3202.20],
    19: [2.53, 7.05, 18.02, 42.72, 213.60, 1921.80],
    20: [2.67, 7.87, 21.36, 107.00, 535.00],
    21: [2.82, 8.82, 25.46, 127.30],
    22: [2.97, 10.18, 51.00],
    23: [3.13, 19.00],
    24: [23.75]
  };

  const getCurrentMultiplier = (mines: number, clickCount: number) => {
    // If no clicks yet, multiplier is 1.00 (no profit)
    if (clickCount === 0) {
      return 1.0;
    }
    
    const multipliers = multiplierTable[mines];
    if (!multipliers || clickCount < 1 || clickCount > multipliers.length) {
      return 1.0;
    }
    return multipliers[clickCount - 1];
  };

  // Generate mine positions - controlled by click order, not fixed positions
  const generateMineField = useCallback(() => {
    // Don't generate fixed mine positions anymore
    // The bomb will be determined dynamically by click order
    return new Set<number>();
  }, [minesCount]);

  // Update multiplier when mines count changes
  useEffect(() => {
    if (!gameActive) {
      setCurrentMultiplier(1.0); // Always start with no profit
    }
  }, [minesCount, gameActive]);

  const startGame = () => {
    if (betAmount <= 0 || betAmount > balance) return;
    
    const newBalance = balance - betAmount;
    updateBalance(newBalance);
    setGameActive(true);
    setRevealedTiles(new Set());
    setMinePositions(generateMineField());
    setCurrentMultiplier(1.0); // Start with no profit
    setGemsFound(0);
    setClickCount(0);
    
    // Para 1 mina: bomba pode aparecer entre o 2º e 5º clique, máximo 4 gemas
    // Para outras minas: bomba aparece entre 1º e 3º clique como antes
    let bombClick;
    if (minesCount === 1) {
      // Para 1 mina: randomizar entre 2-5 cliques (máximo 4 gemas)
      bombClick = Math.floor(Math.random() * 4) + 2; // 2, 3, 4, ou 5
    } else {
      // Para outras minas: manter lógica original (1-3 cliques)
      bombClick = Math.floor(Math.random() * 3) + 1; // 1, 2, ou 3
    }
    setBombClickNumber(bombClick);
  };

  const cashOut = () => {
    if (!gameActive) return;
    
    const winnings = betAmount * currentMultiplier;
    const newBalance = balance + winnings;
    updateBalance(newBalance);
    setGameActive(false);
    
    // Play success sound
    playSound('cashout');
  };

  const revealTile = (index: number) => {
    if (!gameActive || revealedTiles.has(index)) return;
    
    const newRevealed = new Set(revealedTiles);
    newRevealed.add(index);
    setRevealedTiles(newRevealed);
    
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);
    
    // Check if this click should be a bomb (based on click order, not position)
    const shouldExplode = newClickCount === bombClickNumber;
    
    if (shouldExplode) {
      // Force this tile to be a mine and explode
      const newMines = new Set(minePositions);
      newMines.add(index);
      setMinePositions(newMines);
      
      // Hit a mine - game over
      setGameActive(false);
      playSound('explosion');
    } else {
      // Found a gem
      const newGemsFound = gemsFound + 1;
      setGemsFound(newGemsFound);
      
      // Calculate new multiplier based on exact table (only after finding gems)
      const newMultiplier = getCurrentMultiplier(minesCount, newGemsFound);
      setCurrentMultiplier(newMultiplier);
      
      playSound('gem');
    }
  };

  const playSound = (type: 'explosion' | 'gem' | 'cashout') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (type === 'explosion') {
        // Explosion sound - low frequency noise burst
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(20, audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } else if (type === 'gem') {
        // Gem sound - bright ping
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } else if (type === 'cashout') {
        // Cashout sound - success chime
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(523, audioContext.currentTime);
        
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(659, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator1.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.3);
        oscillator2.start(audioContext.currentTime + 0.1);
        oscillator2.stop(audioContext.currentTime + 0.6);
      }
    } catch (error) {
      // Ignore sound errors
    }
  };

  const resetGame = () => {
    setGameActive(false);
    setRevealedTiles(new Set());
    setMinePositions(new Set());
    setCurrentMultiplier(1.0);
    setGemsFound(0);
    setClickCount(0);
    setBombClickNumber(1);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Card className="bg-gray-800 border-gray-700 px-4 py-2">
          <div className="text-lg font-bold text-white">
            R$ {balance.toLocaleString('pt-BR')}
          </div>
        </Card>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-white hover:bg-white/10"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Game Board */}
      <div className="p-4 max-w-sm mx-auto">
        <div className="grid grid-cols-5 gap-2 mb-6">
          {Array.from({ length: 25 }, (_, index) => {
            const isRevealed = revealedTiles.has(index);
            const isMine = minePositions.has(index);
            const showMine = isRevealed && isMine;
            const showGem = isRevealed && !isMine;
            
            return (
              <button
                key={index}
                className={`
                  aspect-square rounded-lg transition-all duration-200 text-2xl font-bold
                  ${!isRevealed 
                    ? 'bg-gray-700 hover:bg-gray-600 active:scale-95' 
                    : showMine 
                      ? 'bg-red-600' 
                      : 'bg-gray-700'
                  }
                `}
                onClick={() => revealTile(index)}
                disabled={!gameActive || isRevealed}
              >
                {showMine && '💣'}
                {showGem && '💎'}
              </button>
            );
          })}
        </div>

        {/* Game Controls */}
        <div className="space-y-4">
          <Card className="bg-gray-800 border-gray-700 p-4">
            <div className="space-y-3">
              <Input
                type="number"
                value={betAmount || ''}
                placeholder="0.00"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setBetAmount(0);
                  } else {
                    const numValue = parseFloat(value);
                    setBetAmount(Math.max(0, Math.min(balance, isNaN(numValue) ? 0 : numValue)));
                  }
                }}
                className="bg-gray-700 border-gray-600 text-white text-center"
                disabled={gameActive}
              />
              
              <div className="text-sm text-gray-400 mb-2">Minas</div>
              <Select 
                value={minesCount.toString()} 
                onValueChange={(value) => setMinesCount(parseInt(value))}
                disabled={gameActive}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
                    <SelectItem key={num} value={num.toString()} className="text-white hover:bg-gray-600">
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                onClick={gameActive ? cashOut : startGame}
                disabled={(!gameActive && (betAmount <= 0 || betAmount > balance)) || (gameActive && gemsFound === 0)}
                className={`w-full h-12 font-bold text-lg ${
                  gameActive 
                    ? gemsFound > 0 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-black' 
                      : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {gameActive 
                  ? gemsFound > 0 
                    ? `Sacar R$ ${(betAmount * currentMultiplier).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `R$ ${betAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Clique para ganhar)`
                  : 'Apostar'
                }
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MinesGame;