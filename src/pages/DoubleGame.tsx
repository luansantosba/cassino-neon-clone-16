import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BonusModal from "@/components/BonusModal";
import { useBonusCheck, checkGameAccess } from "@/hooks/useBonusCheck";

const DoubleGame = () => {
  const navigate = useNavigate();
  
  // Game state
  const [balance, setBalance] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState(0);
  const [savedBetAmount, setSavedBetAmount] = useState(0);
  const [selectedColor, setSelectedColor] = useState<'red' | 'black' | 'white' | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isCountdownActive, setIsCountdownActive] = useState(true);
  const [hasBet, setHasBet] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ title: '', message: '', type: 'info' as 'success' | 'error' | 'info' });

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

  const bonusData = useBonusCheck(userId);

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
  const [playerHistory, setPlayerHistory] = useState<Array<{round: number, result: 'won' | 'lost', amount: number, color: string, winningNumber: number}>>([]);
  
  // Animation refs
  const rouletteRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const spinStartTime = useRef<number>();
  const currentPosition = useRef<number>(0);
  const targetNumber = useRef<number | null>(null);
  const countdownRef = useRef<NodeJS.Timeout>();
  const decelerationStartPosition = useRef<number>(0);
  const spinDuration = 4000;

  // Generate numbers 0-14 with colors
  const numbers = Array.from({ length: 15 }, (_, i) => ({
    value: i,
    color: i === 0 ? 'white' : i % 2 === 1 ? 'red' : 'black'
  }));

  // Create extended roulette for infinite scroll effect
  const extendedNumbers = Array.from({ length: 300 }, (_, i) => {
    const baseIndex = i % 15;
    return {
      value: baseIndex,
      color: baseIndex === 0 ? 'white' : baseIndex % 2 === 1 ? 'red' : 'black'
    };
  });

  const getColorClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-double-red text-double-red-foreground';
      case 'black': return 'bg-double-black text-double-black-foreground';
      case 'white': return 'bg-double-white text-double-white-foreground border border-gray-400';
      default: return '';
    }
  };

  // Load game history from localStorage
  const loadGameHistory = () => {
    try {
      const saved = localStorage.getItem('doubleGameHistory');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error loading game history:', error);
      return [];
    }
  };

  // Load player history from localStorage
  const loadPlayerHistory = () => {
    const saved = localStorage.getItem('doublePlayerHistory');
    return saved ? JSON.parse(saved) : [];
  };

  // Generate initial history when component mounts
  useEffect(() => {
    // Load game history and player history
    setHistory(loadGameHistory());
    setPlayerHistory(loadPlayerHistory());
    
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // RNG - Random Number Generator with house edge manipulation
  const generateRNGResult = (playerBetColor: string) => {
    // House edge: 83% house wins, 17% player wins
    const shouldPlayerWin = Math.random() < 0.17;
    
    console.log(`RNG - Player bet: ${playerBetColor}, Should win: ${shouldPlayerWin}`);
    
    if (shouldPlayerWin) {
      // Player wins - give winning number for their color (NEVER white wins)
      if (playerBetColor === 'white') {
        // White NEVER wins - force loss
        const losingNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
        return losingNumbers[Math.floor(Math.random() * losingNumbers.length)];
      } else if (playerBetColor === 'red') {
        const redNumbers = [1, 3, 5, 7, 9, 11, 13];
        return redNumbers[Math.floor(Math.random() * redNumbers.length)];
      } else if (playerBetColor === 'black') {
        const blackNumbers = [2, 4, 6, 8, 10, 12, 14];
        return blackNumbers[Math.floor(Math.random() * blackNumbers.length)];
      }
    } else {
      // Player loses - give opposite/losing color
      if (playerBetColor === 'white') {
        // White never wins - always loses
        const losingNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
        return losingNumbers[Math.floor(Math.random() * losingNumbers.length)];
      } else if (playerBetColor === 'red') {
        // Red loses - give black or white
        const losingNumbers = [0, 2, 4, 6, 8, 10, 12, 14];
        return losingNumbers[Math.floor(Math.random() * losingNumbers.length)];
      } else if (playerBetColor === 'black') {
        // Black loses - give red or white
        const losingNumbers = [0, 1, 3, 5, 7, 9, 11, 13];
        return losingNumbers[Math.floor(Math.random() * losingNumbers.length)];
      }
    }
    
    // Fallback - random number 0-14
    return Math.floor(Math.random() * 15);
  };

  const calculatePayout = (winningNumber: number, betColor: string, betAmount: number) => {
    const winningColor = winningNumber === 0 ? 'white' : winningNumber % 2 === 1 ? 'red' : 'black';
    
    if (winningColor === betColor) {
      if (betColor === 'white') {
        return betAmount * 14;
      } else {
        return betAmount * 2;
      }
    }
    return 0;
  };

  // Deterministic animation - the winning number MUST align with yellow center line
  const animateRoulette = (timestamp: number) => {
    if (!spinStartTime.current) {
      spinStartTime.current = timestamp;
    }

    const elapsed = timestamp - spinStartTime.current;
    const numberWidth = 36; // Exact width: 32px + 4px margin (mx-0.5 = 2px each side)

    if (!rouletteRef.current || targetNumber.current === null) {
      if (elapsed < spinDuration) {
        animationRef.current = requestAnimationFrame(animateRoulette);
      }
      return;
    }

    if (elapsed < spinDuration) {
      const progress = elapsed / spinDuration;
      
      if (progress < 0.75) {
        // Spinning phase - constant speed
        const baseSpeed = 25;
        currentPosition.current -= baseSpeed;
        
        // Keep position in bounds for infinite loop
        if (currentPosition.current < -(numberWidth * 150)) {
          currentPosition.current += (numberWidth * 150);
        }
      } else {
        // Deceleration phase - move to exact winning position
        const containerCenter = (rouletteRef.current.parentElement?.offsetWidth || 0) / 2;
        const decelerationProgress = (progress - 0.75) / 0.25;
        
        // Store the position at start of deceleration phase
        if (decelerationProgress <= 0.01 && decelerationStartPosition.current === 0) {
          decelerationStartPosition.current = currentPosition.current;
        }
        
        // Find the FIRST occurrence of target number that will be visible after current position
        let targetIndex = -1;
        for (let i = 0; i < extendedNumbers.length; i++) {
          if (extendedNumbers[i].value === targetNumber.current) {
            const itemCenterPosition = -(i * numberWidth + numberWidth / 2);
            // Must be ahead of current position (more negative)
            if (itemCenterPosition < decelerationStartPosition.current - containerCenter - (numberWidth * 3)) {
              targetIndex = i;
              break;
            }
          }
        }
        
        if (targetIndex >= 0) {
          // Calculate EXACT final position to center the winning number on the yellow line
          const finalPosition = containerCenter - (targetIndex * numberWidth + numberWidth / 2);
          
          // Smooth cubic ease-out
          const easeOut = 1 - Math.pow(1 - decelerationProgress, 3);
          
          // Move towards exact final position
          currentPosition.current = decelerationStartPosition.current + (finalPosition - decelerationStartPosition.current) * easeOut;
        }
      }
      
      rouletteRef.current.style.transform = `translateX(${currentPosition.current}px)`;
      animationRef.current = requestAnimationFrame(animateRoulette);
      
    } else {
      // Animation complete - determine winner by reading actual position
      if (rouletteRef.current) {
        const containerCenter = (rouletteRef.current.parentElement?.offsetWidth || 0) / 2;
        
        // Find which number is closest to the center line (most accurate way)
        let closestNumber = 0;
        let minDistance = Infinity;
        
        const rouletteElements = rouletteRef.current.children;
        for (let i = 0; i < rouletteElements.length; i++) {
          const element = rouletteElements[i] as HTMLElement;
          const rect = element.getBoundingClientRect();
          const parentRect = rouletteRef.current.parentElement?.getBoundingClientRect();
          
          if (parentRect) {
            const elementCenter = rect.left + rect.width / 2 - parentRect.left;
            const distanceFromCenter = Math.abs(elementCenter - containerCenter);
            
            if (distanceFromCenter < minDistance) {
              minDistance = distanceFromCenter;
              closestNumber = extendedNumbers[i].value;
            }
          }
        }
        
        // THIS is the ACTUAL winning number - what's centered on the yellow line
        const actualWinningNumber = closestNumber;
        console.log(`Animation ended. Target was: ${targetNumber.current}, Actual winner: ${actualWinningNumber}`);
        
        // Process payout using the ACTUAL winning number
        if (hasBet && selectedColor && betAmount > 0) {
          const payout = calculatePayout(actualWinningNumber, selectedColor, betAmount);
          const result: 'won' | 'lost' = payout > 0 ? 'won' : 'lost';
          if (payout > 0) {
            const newBalance = balance + payout;
            updateBalance(newBalance);
          }
          
          // Add to player history using ACTUAL winning number
          const newHistoryEntry = {
            round: Date.now(),
            result,
            amount: result === 'won' ? payout : betAmount,
            color: selectedColor,
            winningNumber: actualWinningNumber
          };
          
          const updatedHistory = [newHistoryEntry, ...playerHistory].slice(0, 10);
          setPlayerHistory(updatedHistory);
          localStorage.setItem('doublePlayerHistory', JSON.stringify(updatedHistory));
        }
        
        // Update game history with ACTUAL winning number
        const updatedGameHistory = [actualWinningNumber, ...history].slice(0, 10);
        setHistory(updatedGameHistory);
        localStorage.setItem('doubleGameHistory', JSON.stringify(updatedGameHistory));
        setCurrentNumber(actualWinningNumber);
      }
      
      setIsSpinning(false);
      setSelectedColor(null);
      // Keep saved bet amount for next round
      if (savedBetAmount > 0) {
        setBetAmount(savedBetAmount);
      }
      setHasBet(false);
      targetNumber.current = null;
    }
  };


  const spinRoulette = async () => {
    if (!hasBet || !selectedColor || betAmount <= 0) return;
    
    const requestedGame = 'Double';
    const availableBonus = (!bonusData.bonusLocked && (!bonusData.gameRestriction || bonusData.gameRestriction === requestedGame))
      ? bonusData.bonusBalance
      : 0;
    const totalAvailable = balance + availableBonus;

    if (betAmount > totalAvailable) {
      setIsSpinning(false);
      setHasBet(false);
      setModalData({
        title: 'Saldo Insuficiente',
        message: 'Seu saldo disponível (incluindo bônus permitido) é insuficiente para esta aposta.',
        type: 'error'
      });
      setModalOpen(true);
      return;
    }

    // If needs to use bonus but it's locked or restricted
    if (betAmount > balance) {
      if (bonusData.bonusLocked && bonusData.requiresDeposit) {
        setIsSpinning(false);
        setHasBet(false);
        setModalData({
          title: 'Bônus Bloqueado',
          message: `Você ganhou saldo bônus, mas ele está bloqueado. Realize um depósito de R$ ${Number(bonusData.minimumDeposit || 0).toFixed(2)} para liberar o uso do bônus.`,
          type: 'info'
        });
        setModalOpen(true);
        return;
      }
      if (bonusData.gameRestriction && bonusData.gameRestriction !== requestedGame) {
        setIsSpinning(false);
        setHasBet(false);
        setModalData({
          title: 'Bônus Restrito',
          message: `Este saldo bônus só pode ser usado no jogo ${bonusData.gameRestriction}.`,
          type: 'info'
        });
        setModalOpen(true);
        return;
      }
    }

    // Deduct considering bonus first
    try {
      let remaining = betAmount;
      let usedFromBonus = Math.min(availableBonus, remaining);

      if (usedFromBonus > 0 && userId) {
        // Update bonus balance
        await supabase
          .from('profiles')
          .update({ bonus_balance: Math.max(0, (bonusData.bonusBalance - usedFromBonus)) })
          .eq('id', userId);

        // Update rollover progress on latest active coupon
        const { data: roll } = await supabase
          .from('user_coupon_rollover' as any)
          .select('id, required_rollover, current_rollover')
          .eq('user_id', userId)
          .eq('completed', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (roll) {
          const newCurrent = (roll.current_rollover || 0) + usedFromBonus;
          const completed = newCurrent >= (roll.required_rollover || 0);
          await supabase
            .from('user_coupon_rollover' as any)
            .update({ current_rollover: newCurrent, completed })
            .eq('id', roll.id);
        }

        remaining -= usedFromBonus;
      }

      if (remaining > 0) {
        const newBalance = balance - remaining;
        await updateBalance(newBalance);
      }

      // Notify UI listeners
      window.dispatchEvent(new CustomEvent('balance-updated'));
    } catch (e) {
      console.error('Erro ao debitar aposta:', e);
      setIsSpinning(false);
      setHasBet(false);
      setModalData({ title: 'Erro', message: 'Não foi possível processar sua aposta.', type: 'error' });
      setModalOpen(true);
      return;
    }

    // Generate RNG result based on manipulation (80% house edge)
    const result = generateRNGResult(selectedColor);
    targetNumber.current = result;
    console.log(`Target number set to: ${result}`);
    
    setIsSpinning(true);
    setCurrentNumber(null);
    
    // Reset animation state
    spinStartTime.current = undefined;
    decelerationStartPosition.current = 0;
    const containerWidth = rouletteRef.current?.parentElement?.offsetWidth || 350;
    currentPosition.current = -(containerWidth * 2);
    
    // Clear any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Start animation
    animationRef.current = requestAnimationFrame(animateRoulette);
  };

  const placeBet = async () => {
    if (!selectedColor || betAmount <= 0) return;
    if (isSpinning) return; // Prevent double-click
    
    setHasBet(true);
    setSavedBetAmount(betAmount);
    await spinRoulette();
  };

  const getColorName = (color: string) => {
    switch (color) {
      case 'red': return 'Vermelho';
      case 'black': return 'Preto';
      case 'white': return 'Branco';
      default: return color;
    }
  };

  // Initialize countdown on mount - remove duplicate useEffect
  // (moved into the existing useEffect above)

  return (
    <div className="min-h-screen bg-double-bg text-white">
      <BonusModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
      />
      {/* Header */}
      <div className="bg-double-card p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex-1"></div>
        <div className="text-lg font-semibold">
          R$ {(balance + bonusData.bonusBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* History */}
      <div className="p-4">
        <div className="flex gap-2 justify-center mb-4 overflow-x-auto scrollbar-none">
          {history.map((num, index) => (
            <div
              key={index}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getColorClass(
                num === 0 ? 'white' : num % 2 === 1 ? 'red' : 'black'
              )}`}
            >
              {num}
            </div>
          ))}
        </div>
      </div>


      {/* Roulette */}
      <div className="relative mb-8 mx-4">
        <div className="overflow-hidden rounded-lg border border-gray-600">
          <div className="relative bg-gray-800">
            {/* Center indicator line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-yellow-400 z-10 transform -translate-x-1/2"></div>
            
            {/* Winner highlight */}
            {currentNumber !== null && !isSpinning && (
              <div className="absolute left-1/2 top-0 bottom-0 w-8 bg-yellow-400/20 z-5 transform -translate-x-1/2"></div>
            )}
            
            {/* Roulette strip */}
            <div
              ref={rouletteRef}
              className="flex will-change-transform"
              style={{ 
                transform: 'translateX(0px)',
                backfaceVisibility: 'hidden'
              }}
            >
              {extendedNumbers.map((num, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 flex items-center justify-center text-xs font-bold flex-shrink-0 rounded-full mx-0.5 ${getColorClass(num.color)}`}
                >
                  {num.value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Color Bet Buttons */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <Button
            className={`h-12 text-sm font-bold transition-all duration-200 border-2 bg-double-red text-double-red-foreground hover:bg-double-red/80 ${selectedColor === 'red' ? 'border-yellow-400 scale-105' : 'border-transparent hover:scale-105'}`}
            onClick={() => setSelectedColor('red')}
            disabled={isSpinning}
          >
            2x
          </Button>
          <Button
            className={`h-12 text-sm font-bold transition-all duration-200 border-2 bg-double-black text-double-black-foreground hover:bg-double-black/80 ${selectedColor === 'black' ? 'border-yellow-400 scale-105' : 'border-transparent hover:scale-105'}`}
            onClick={() => setSelectedColor('black')}
            disabled={isSpinning}
          >
            2x
          </Button>
          <Button
            className={`h-12 text-sm font-bold transition-all duration-200 border-2 bg-double-white text-double-white-foreground hover:bg-double-white/80 ${selectedColor === 'white' ? 'border-yellow-400 scale-105' : 'border-gray-400 hover:scale-105'}`}
            onClick={() => setSelectedColor('white')}
            disabled={isSpinning}
          >
            14x
          </Button>
        </div>
      </div>

      {/* Bet Amount and Place Bet Button */}
      <div className="px-4 pb-6">
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <Input
              type="number"
              value={betAmount || ''}
              placeholder="0"
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setBetAmount(0);
                } else {
                  const numValue = parseInt(value);
                  setBetAmount(Math.max(0, Math.min(5000, isNaN(numValue) ? 0 : numValue)));
                }
              }}
              disabled={isSpinning}
              className="h-14 text-center text-lg font-bold bg-double-card border-gray-600 text-white placeholder:text-gray-400/30"
            />
          </div>
          <Button
            onClick={placeBet}
            disabled={!selectedColor || betAmount <= 0 || betAmount > balance || isSpinning}
            className="flex-[2] h-14 text-lg font-bold bg-green-400 hover:bg-green-500 text-white disabled:opacity-50"
          >
            {isSpinning ? 'GIRANDO...' : 'APOSTAR'}
          </Button>
        </div>
        {betAmount > balance && betAmount > 0 && (
          <div className="text-red-400 text-sm mt-2 text-center">
            Saldo insuficiente
          </div>
        )}
      </div>

      {/* Player History */}
      <div className="bg-double-card mx-4 rounded-lg p-4">
        <h3 className="text-sm font-bold mb-3 text-gray-300">Últimas rodadas</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {playerHistory.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-4">
              Nenhuma aposta ainda
            </div>
          ) : (
            playerHistory.map((entry, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    entry.color === 'red' ? 'bg-double-red' : 
                    entry.color === 'black' ? 'bg-double-black' : 
                    'bg-double-white border border-gray-400'
                  }`}></div>
                  <span className="text-gray-300">#{entry.winningNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${
                    entry.result === 'won' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {entry.result === 'won' ? '+' : '-'}R$ {entry.amount.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DoubleGame;
