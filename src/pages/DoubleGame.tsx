import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BonusModal from "@/components/BonusModal";
import { useBonusCheck } from "@/hooks/useBonusCheck";
import LightningEffect from "@/components/LightningEffect";
import BotPlayersList from "@/components/BotPlayersList";

// Chip values for betting
const CHIP_VALUES = [1, 5, 10, 25, 50, 100];

// Multiplier values that can appear on numbers (5X to 1000X)
const MULTIPLIER_VALUES = [5, 10, 20, 50, 100, 200, 500, 1000];

interface GameState {
  current_phase: 'betting' | 'spinning' | 'result';
  phase_ends_at: string;
  current_result: number | null;
  current_multipliers: Record<number, number>;
}

interface GameRound {
  id: string;
  result: number;
  multipliers: Record<number, number>;
  created_at: string;
}

const DoubleGame = () => {
  const navigate = useNavigate();
  
  // Game state
  const [realBalance, setRealBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [useRealBalance, setUseRealBalance] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [selectedChip, setSelectedChip] = useState(1);
  const [showChipSelector, setShowChipSelector] = useState(false);
  const [colorBets, setColorBets] = useState<{ red: number; black: number }>({ red: 0, black: 0 });
  const [numberBets, setNumberBets] = useState<{ [key: number]: number }>({});
  const [exactNumbersBetCount, setExactNumbersBetCount] = useState(0); // Track total exact numbers bet on (max 2)
  const [isSpinning, setIsSpinning] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [bettingTimeLeft, setBettingTimeLeft] = useState(15);
  const [isBettingPhase, setIsBettingPhase] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ title: '', message: '', type: 'info' as 'success' | 'error' | 'info' });
  const [multipliers, setMultipliers] = useState<{ [key: number]: number }>({});
  const [lastWinAmount, setLastWinAmount] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [betDeducted, setBetDeducted] = useState(false);

  const bonusData = useBonusCheck(userId);

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
        .select('balance, bonus_balance, full_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        setRealBalance(profile.balance || 0);
        setBonusBalance(profile.bonus_balance || 0);
        setUserName(profile.full_name || 'Jogador');
      }
    };

    loadUserData();
  }, [navigate]);

  // Animation refs
  const rouletteRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const spinStartTime = useRef<number>();
  const currentPosition = useRef<number>(0);
  const targetNumber = useRef<number | null>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const decelerationStartPosition = useRef<number>(0);
  const spinDuration = 5000;

  // Create extended roulette for infinite scroll effect (without white/0 in the strip)
  const stripNumbers = Array.from({ length: 14 }, (_, i) => ({
    value: i + 1,
    color: (i + 1) % 2 === 1 ? 'red' : 'black'
  }));
  
  const extendedNumbers = Array.from({ length: 300 }, (_, i) => {
    const baseIndex = i % 14;
    return stripNumbers[baseIndex];
  });

  const getColorClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-600 text-white';
      case 'black': return 'bg-gray-900 text-white';
      case 'white': return 'bg-white text-black border-2 border-yellow-400';
      default: return '';
    }
  };

  // Get current usable balance
  const getCurrentBalance = () => {
    return useRealBalance ? realBalance : bonusBalance;
  };

  // Get total bet amount
  const getTotalBet = () => {
    const colorTotal = colorBets.red + colorBets.black;
    const numberTotal = Object.values(numberBets).reduce((a, b) => a + b, 0);
    return colorTotal + numberTotal;
  };

  // Get player's dominant color bet
  const getPlayerColorBet = (): 'red' | 'black' | null => {
    if (colorBets.red > colorBets.black) return 'red';
    if (colorBets.black > colorBets.red) return 'black';
    return null;
  };

  // Update balance in database
  const updateBalance = async (newRealBalance: number, newBonusBalance: number) => {
    if (!userId) return;

    const { error } = await supabase
      .from('profiles')
      .update({ balance: newRealBalance, bonus_balance: newBonusBalance })
      .eq('id', userId);

    if (error) {
      console.error('Error updating balance:', error);
      toast.error('Erro ao atualizar saldo');
    } else {
      setRealBalance(newRealBalance);
      setBonusBalance(newBonusBalance);
    }
  };

  // Fetch global game state and history
  const fetchGameState = async () => {
    try {
      // Get game state
      const { data: state } = await supabase
        .from('double_x_game_state')
        .select('*')
        .eq('id', 1)
        .single();

      // Get history from rounds
      const { data: rounds } = await supabase
        .from('double_x_rounds')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (state) {
        setGameState(state as GameState);
        setMultipliers((state.current_multipliers as Record<number, number>) || {});
        
        // Calculate time left
        const now = new Date().getTime();
        const endsAt = new Date(state.phase_ends_at).getTime();
        const timeLeft = Math.max(0, Math.floor((endsAt - now) / 1000));
        
        if (state.current_phase === 'betting') {
          setIsBettingPhase(true);
          setIsSpinning(false);
          setBettingTimeLeft(timeLeft);
        } else if (state.current_phase === 'spinning') {
          setIsBettingPhase(false);
          setIsSpinning(true);
          if (state.current_result !== null && targetNumber.current !== state.current_result) {
            targetNumber.current = state.current_result;
            startRouletteAnimation();
          }
        } else if (state.current_phase === 'result') {
          setIsBettingPhase(false);
          setIsSpinning(false);
          setCurrentNumber(state.current_result);
        }
      }

      if (rounds) {
        setHistory(rounds.map((r: { result: number }) => r.result));
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  };

  // Advance game state (call edge function)
  const advanceGame = async () => {
    try {
      const response = await supabase.functions.invoke('double-x-engine', {
        body: { action: 'advance_game' }
      });
      
      if (response.data?.phase === 'spinning' && response.data?.result !== undefined) {
        targetNumber.current = response.data.result;
        setMultipliers(response.data.multipliers || {});
      }
    } catch (error) {
      console.error('Error advancing game:', error);
    }
  };

  // Game loop - check state and advance
  useEffect(() => {
    fetchGameState();
    
    // Poll game state every second
    gameLoopRef.current = setInterval(async () => {
      await advanceGame();
      await fetchGameState();
    }, 1000);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('double-x-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'double_x_game_state' },
        (payload) => {
          const newState = payload.new as GameState;
          if (newState) {
            setGameState(newState);
            setMultipliers((newState.current_multipliers as Record<number, number>) || {});
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'double_x_rounds' },
        (payload) => {
          const newRound = payload.new as GameRound;
          if (newRound) {
            setHistory(prev => [newRound.result, ...prev].slice(0, 20));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle phase transitions
  useEffect(() => {
    if (!gameState) return;

    if (gameState.current_phase === 'spinning' && !betDeducted) {
      // Deduct bets when spinning starts
      const totalBet = getTotalBet();
      if (totalBet > 0) {
        if (useRealBalance) {
          updateBalance(realBalance - totalBet, bonusBalance);
        } else {
          updateBalance(realBalance, bonusBalance - totalBet);
        }
        setBetDeducted(true);
      }
    } else if (gameState.current_phase === 'result' && gameState.current_result !== null) {
      // Calculate winnings
      const winningNumber = gameState.current_result;
      const payout = calculateTotalPayout(winningNumber, multipliers);
      
      if (payout > 0) {
        setLastWinAmount(payout);
        setShowWinAnimation(true);
        setTimeout(() => setShowWinAnimation(false), 3000);
        
        if (useRealBalance) {
          updateBalance(realBalance + payout, bonusBalance);
        } else {
          updateBalance(realBalance, bonusBalance + payout);
        }
        
        toast.success(`Você ganhou R$ ${payout.toFixed(2)}!`);
      }
      
      setCurrentNumber(winningNumber);
    } else if (gameState.current_phase === 'betting') {
      // Reset for new round
      clearBets();
      setBetDeducted(false);
      setCurrentNumber(null);
    }
  }, [gameState?.current_phase, gameState?.current_result]);

  // Calculate payout - Red/Black 2X, Exact 14X, Multiplier pays multiplier value
  const calculateTotalPayout = (winningNumber: number, currentMultipliers: { [key: number]: number }) => {
    let totalPayout = 0;
    const winningColor = winningNumber === 0 ? 'white' : winningNumber % 2 === 1 ? 'red' : 'black';
    
    // Color bets - 2X
    if (winningColor === 'red' && colorBets.red > 0) {
      totalPayout += colorBets.red * 2;
    }
    if (winningColor === 'black' && colorBets.black > 0) {
      totalPayout += colorBets.black * 2;
    }
    
    // Number bets - exact number pays 14X base, or multiplier if present
    if (numberBets[winningNumber]) {
      const hasMultiplier = currentMultipliers[winningNumber];
      const finalMultiplier = hasMultiplier || 14; // 14X base, or multiplier value
      totalPayout += numberBets[winningNumber] * finalMultiplier;
    }
    
    return totalPayout;
  };

  // Place bet on color
  const placeBetOnColor = (color: 'red' | 'black') => {
    if (isSpinning || !isBettingPhase) return;
    
    const currentBal = getCurrentBalance();
    const totalBet = getTotalBet();
    
    if (totalBet + selectedChip > currentBal) {
      toast.error('Saldo insuficiente');
      return;
    }
    
    setColorBets(prev => ({
      ...prev,
      [color]: prev[color] + selectedChip
    }));
  };

  // Place bet on number (max 2 different numbers)
  const placeBetOnNumber = (number: number) => {
    if (isSpinning || !isBettingPhase) return;
    
    // Check if this is a new number bet
    const isNewNumber = !numberBets[number];
    
    if (isNewNumber && exactNumbersBetCount >= 2) {
      toast.error('Máximo de 2 números exatos!');
      return;
    }
    
    const currentBal = getCurrentBalance();
    const totalBet = getTotalBet();
    
    if (totalBet + selectedChip > currentBal) {
      toast.error('Saldo insuficiente');
      return;
    }
    
    setNumberBets(prev => ({
      ...prev,
      [number]: (prev[number] || 0) + selectedChip
    }));
    
    if (isNewNumber) {
      setExactNumbersBetCount(prev => prev + 1);
    }
  };

  // Clear all bets
  const clearBets = () => {
    setColorBets({ red: 0, black: 0 });
    setNumberBets({});
    setExactNumbersBetCount(0);
  };

  // Start roulette animation
  const startRouletteAnimation = () => {
    setIsSpinning(true);
    spinStartTime.current = undefined;
    decelerationStartPosition.current = 0;
    const containerWidth = rouletteRef.current?.parentElement?.offsetWidth || 350;
    currentPosition.current = -(containerWidth * 2);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(animateRoulette);
  };

  // Deterministic animation
  const animateRoulette = (timestamp: number) => {
    if (!spinStartTime.current) {
      spinStartTime.current = timestamp;
    }

    const elapsed = timestamp - spinStartTime.current;
    const numberWidth = 52;

    if (!rouletteRef.current || targetNumber.current === null) {
      if (elapsed < spinDuration) {
        animationRef.current = requestAnimationFrame(animateRoulette);
      }
      return;
    }

    if (elapsed < spinDuration) {
      const progress = elapsed / spinDuration;
      
      if (progress < 0.7) {
        const baseSpeed = 30;
        currentPosition.current -= baseSpeed;
        
        if (currentPosition.current < -(numberWidth * 150)) {
          currentPosition.current += (numberWidth * 150);
        }
      } else {
        const containerCenter = (rouletteRef.current.parentElement?.offsetWidth || 0) / 2;
        const decelerationProgress = (progress - 0.7) / 0.3;
        
        if (decelerationProgress <= 0.01 && decelerationStartPosition.current === 0) {
          decelerationStartPosition.current = currentPosition.current;
        }
        
        let targetIndex = -1;
        const targetValue = targetNumber.current;
        
        if (targetValue === 0) {
          targetIndex = Math.floor(extendedNumbers.length / 2);
        } else {
          for (let i = 0; i < extendedNumbers.length; i++) {
            if (extendedNumbers[i].value === targetValue) {
              const itemCenterPosition = -(i * numberWidth + numberWidth / 2);
              if (itemCenterPosition < decelerationStartPosition.current - containerCenter - (numberWidth * 3)) {
                targetIndex = i;
                break;
              }
            }
          }
        }
        
        if (targetIndex >= 0) {
          const finalPosition = containerCenter - (targetIndex * numberWidth + numberWidth / 2);
          const easeOut = 1 - Math.pow(1 - decelerationProgress, 3);
          currentPosition.current = decelerationStartPosition.current + (finalPosition - decelerationStartPosition.current) * easeOut;
        }
      }
      
      rouletteRef.current.style.transform = `translateX(${currentPosition.current}px)`;
      animationRef.current = requestAnimationFrame(animateRoulette);
    } else {
      setIsSpinning(false);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pb-4">
      <BonusModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
      />
      
      {/* Header */}
      <div className="bg-black/80 p-3 flex items-center justify-between backdrop-blur-sm border-b border-gray-800">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/menu")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          DOUBLE-X
        </h1>
        <div className="text-sm font-semibold text-yellow-400">
          R$ {(realBalance + bonusBalance).toFixed(2)}
        </div>
      </div>

      {/* Balance Toggle */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-center gap-2 bg-black/30 rounded-lg p-2">
          <Wallet className="h-4 w-4 text-yellow-400" />
          <button
            onClick={() => setUseRealBalance(true)}
            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
              useRealBalance 
                ? 'bg-yellow-500 text-black' 
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Real: R$ {realBalance.toFixed(2)}
          </button>
          <button
            onClick={() => setUseRealBalance(false)}
            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
              !useRealBalance 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Bônus: R$ {bonusBalance.toFixed(2)}
          </button>
        </div>
      </div>

      {/* Betting Timer - Green bar only */}
      <div className="px-4 py-2">
        <div className="bg-gray-900/80 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">
              {isBettingPhase ? 'Faça suas apostas!' : isSpinning ? 'Girando...' : 'Resultado!'}
            </span>
            <span className="text-xs text-green-400">
              🔴 AO VIVO
            </span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-1000 ease-linear"
              style={{ width: isBettingPhase ? `${(bettingTimeLeft / 15) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* History - Global persistent */}
      <div className="px-4 py-2">
        <div className="flex gap-1.5 justify-center overflow-x-auto scrollbar-none">
          {history.slice(0, 15).map((num, index) => (
            <div
              key={index}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getColorClass(
                num === 0 ? 'white' : num % 2 === 1 ? 'red' : 'black'
              )}`}
            >
              {num}
            </div>
          ))}
        </div>
      </div>

      {/* Win Animation */}
      {showWinAnimation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-4xl font-bold text-yellow-400 animate-bounce drop-shadow-lg">
            +R$ {lastWinAmount.toFixed(2)}
          </div>
        </div>
      )}

      {/* Roulette Strip */}
      <div className="relative mb-4 mx-4">
        <div className="overflow-hidden rounded-xl border-2 border-yellow-500/50">
          <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 py-3">
            {/* Center indicator */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-yellow-400 z-10 transform -translate-x-1/2 shadow-lg shadow-yellow-400/50"></div>
            
            {/* Winning highlight */}
            {currentNumber !== null && !isSpinning && currentNumber !== 0 && (
              <div className="absolute left-1/2 top-0 bottom-0 w-12 bg-yellow-400/20 z-5 transform -translate-x-1/2"></div>
            )}
            
            {/* White winner indicator */}
            {currentNumber === 0 && !isSpinning && (
              <div className="absolute inset-0 bg-white/10 flex items-center justify-center z-20">
                <span className="text-2xl font-bold text-yellow-400">🎯 BRANCO!</span>
              </div>
            )}
            
            {/* Roulette strip */}
            <div
              ref={rouletteRef}
              className="flex will-change-transform py-1"
              style={{ 
                transform: 'translateX(0px)',
                backfaceVisibility: 'hidden'
              }}
            >
              {extendedNumbers.map((num, index) => (
                <div
                  key={index}
                  className={`w-12 h-12 flex items-center justify-center text-sm font-bold flex-shrink-0 rounded-lg mx-0.5 ${getColorClass(num.color)} shadow-md`}
                >
                  {num.value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Color Betting Area - Only Red and Black */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => placeBetOnColor('red')}
            disabled={isSpinning || !isBettingPhase}
            className={`relative h-16 rounded-lg font-bold text-white transition-all ${
              colorBets.red > 0 ? 'ring-2 ring-yellow-400' : ''
            } bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 disabled:opacity-50`}
          >
            <span className="text-xs">VERMELHO</span>
            <br />
            <span className="text-sm">2X</span>
            {colorBets.red > 0 && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {colorBets.red}
              </div>
            )}
          </button>
          
          <button
            onClick={() => placeBetOnColor('black')}
            disabled={isSpinning || !isBettingPhase}
            className={`relative h-16 rounded-lg font-bold text-white transition-all ${
              colorBets.black > 0 ? 'ring-2 ring-yellow-400' : ''
            } bg-gradient-to-b from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 disabled:opacity-50`}
          >
            <span className="text-xs">PRETO</span>
            <br />
            <span className="text-sm">2X</span>
            {colorBets.black > 0 && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {colorBets.black}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Number Betting Grid - Without White/0 */}
      <div className="px-4 mb-4">
        <div className="bg-gray-900/80 rounded-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-yellow-400">NÚMERO EXATO (14X) - Máx 2 números</h3>
            {Object.keys(multipliers).length > 0 && (
              <div className="flex items-center gap-1 text-yellow-400 animate-pulse">
                <span className="text-xs">⚡ RAIOS!</span>
              </div>
            )}
          </div>
          
          {/* Numbers 1-14 grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 14 }, (_, i) => i + 1).map(num => {
              const isRed = num % 2 === 1;
              const hasMultiplier = multipliers[num];
              const hasBet = numberBets[num] && numberBets[num] > 0;
              
              return (
                <button
                  key={num}
                  onClick={() => placeBetOnNumber(num)}
                  disabled={isSpinning || !isBettingPhase}
                  className={`relative h-12 rounded-lg font-bold text-white transition-all ${
                    hasBet ? 'ring-2 ring-yellow-400' : ''
                  } ${isRed 
                    ? 'bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600' 
                    : 'bg-gradient-to-b from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800'
                  } disabled:opacity-50 overflow-hidden`}
                >
                  {/* Lightning effect for multipliers */}
                  <LightningEffect active={!!hasMultiplier && isBettingPhase} multiplier={hasMultiplier || 0} />
                  
                  <span className="relative z-10">{num}</span>
                  
                  {hasBet && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[8px] font-bold rounded px-0.5 z-10">
                      R${numberBets[num]}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Realistic Chip Selection - Horizontal */}
      <div className="px-4 mb-4">
        <div className="bg-gray-900/80 rounded-xl p-3">
          <h3 className="text-xs text-gray-400 mb-2 text-center">ESCOLHA SUA FICHA</h3>
          <div className="flex justify-center gap-2 items-center">
            {CHIP_VALUES.map(value => (
              <button
                key={value}
                onClick={() => {
                  setSelectedChip(value);
                  setShowChipSelector(false);
                }}
                className={`relative w-11 h-11 rounded-full font-bold text-xs transition-all flex items-center justify-center ${
                  selectedChip === value
                    ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 text-black scale-110 shadow-lg shadow-yellow-400/50 ring-2 ring-white'
                    : 'bg-gradient-to-br from-green-500 via-green-600 to-green-800 text-white hover:scale-105 shadow-md'
                }`}
                style={{
                  boxShadow: selectedChip === value 
                    ? 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3), 0 4px 12px rgba(250, 204, 21, 0.5)'
                    : 'inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.4)'
                }}
              >
                <div className="absolute inset-1 rounded-full border-2 border-dashed opacity-30" 
                  style={{ borderColor: selectedChip === value ? '#000' : '#fff' }} 
                />
                <span className="relative z-10">{value}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Total Bet & Clear */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between bg-gray-900/80 rounded-lg p-3">
          <div>
            <span className="text-sm text-gray-400">Aposta Total:</span>
            <span className="ml-2 text-lg font-bold text-yellow-400">R$ {getTotalBet().toFixed(2)}</span>
          </div>
          <Button
            onClick={clearBets}
            disabled={isSpinning || getTotalBet() === 0}
            variant="outline"
            size="sm"
            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
          >
            Limpar
          </Button>
        </div>
      </div>

      {/* Bot Players List */}
      <div className="px-4 mb-4">
        <BotPlayersList
          realPlayerName={userName}
          realPlayerBet={getPlayerColorBet()}
          realPlayerAmount={colorBets.red + colorBets.black}
          isBettingPhase={isBettingPhase}
        />
      </div>
    </div>
  );
};

export default DoubleGame;
