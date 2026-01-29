import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BonusModal from "@/components/BonusModal";
import { useBonusCheck } from "@/hooks/useBonusCheck";
import { useDepositCheck } from "@/hooks/useDepositCheck";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Chip values for betting
const CHIP_VALUES = [1, 5, 10, 25, 50, 100];

// Multiplier values that can appear on numbers (5X to 1000X)
const MULTIPLIER_VALUES = [5, 10, 20, 50, 100, 200, 500, 1000];

const DoubleGame = () => {
  const navigate = useNavigate();
  
  // Game state
  const [realBalance, setRealBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [useRealBalance, setUseRealBalance] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedChip, setSelectedChip] = useState(1);
  const [colorBets, setColorBets] = useState<{ red: number; black: number; white: number }>({ red: 0, black: 0, white: 0 });
  const [numberBets, setNumberBets] = useState<{ [key: number]: number }>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [bettingTimeLeft, setBettingTimeLeft] = useState(15);
  const [isBettingPhase, setIsBettingPhase] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ title: '', message: '', type: 'info' as 'success' | 'error' | 'info' });
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [multipliers, setMultipliers] = useState<{ [key: number]: number }>({});
  const [showMultiplierAnimation, setShowMultiplierAnimation] = useState(false);
  const [lastWinAmount, setLastWinAmount] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);

  const { hasMinimumDeposit, isLoading: isCheckingDeposit } = useDepositCheck(userId);
  const bonusData = useBonusCheck(userId);

  // Check deposit requirement on mount
  useEffect(() => {
    if (!isCheckingDeposit && !hasMinimumDeposit && userId) {
      setShowDepositModal(true);
    }
  }, [hasMinimumDeposit, isCheckingDeposit, userId]);

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
        .select('balance, bonus_balance')
        .eq('id', user.id)
        .single();

      if (profile) {
        setRealBalance(profile.balance || 0);
        setBonusBalance(profile.bonus_balance || 0);
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
  const bettingIntervalRef = useRef<NodeJS.Timeout>();
  const decelerationStartPosition = useRef<number>(0);
  const spinDuration = 5000;

  // Generate numbers 0-14 with colors (0 is white)
  const numbers = Array.from({ length: 15 }, (_, i) => ({
    value: i,
    color: i === 0 ? 'white' : i % 2 === 1 ? 'red' : 'black'
  }));

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
    const colorTotal = colorBets.red + colorBets.black + colorBets.white;
    const numberTotal = Object.values(numberBets).reduce((a, b) => a + b, 0);
    return colorTotal + numberTotal;
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

  // Generate random multipliers for some numbers (not every round)
  const generateMultipliers = () => {
    const newMultipliers: { [key: number]: number } = {};
    
    // 30% chance to have multipliers this round
    if (Math.random() < 0.30) {
      // Pick 1-3 random numbers to have multipliers
      const numMultipliers = Math.floor(Math.random() * 3) + 1;
      const availableNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
      
      for (let i = 0; i < numMultipliers && availableNumbers.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const number = availableNumbers.splice(randomIndex, 1)[0];
        
        // Lower multipliers are more common
        const multiplierIndex = Math.floor(Math.pow(Math.random(), 2) * MULTIPLIER_VALUES.length);
        newMultipliers[number] = MULTIPLIER_VALUES[multiplierIndex];
      }
    }
    
    return newMultipliers;
  };

  // Load game history from localStorage
  const loadGameHistory = () => {
    try {
      const saved = localStorage.getItem('doubleXGameHistory');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error loading game history:', error);
      return [];
    }
  };

  // Generate RNG result - fair random 0-14
  const generateRNGResult = () => {
    return Math.floor(Math.random() * 15); // 0-14, fair RNG
  };

  // Calculate payout for all bets
  const calculateTotalPayout = (winningNumber: number, currentMultipliers: { [key: number]: number }) => {
    let totalPayout = 0;
    const winningColor = winningNumber === 0 ? 'white' : winningNumber % 2 === 1 ? 'red' : 'black';
    
    // Color bets
    if (winningColor === 'red' && colorBets.red > 0) {
      totalPayout += colorBets.red * 2; // 2X for red (returns bet + 1x profit)
    }
    if (winningColor === 'black' && colorBets.black > 0) {
      totalPayout += colorBets.black * 2; // 2X for black
    }
    if (winningNumber === 0 && colorBets.white > 0) {
      totalPayout += colorBets.white * 20; // 20X for white (direct bet)
    }
    
    // Number bets - exact number pays 20X base, or multiplier if present
    if (numberBets[winningNumber]) {
      const baseMultiplier = winningNumber === 0 ? 20 : 20; // All numbers pay 20X base
      const extraMultiplier = currentMultipliers[winningNumber] || 1;
      const finalMultiplier = extraMultiplier > 1 ? extraMultiplier : baseMultiplier;
      totalPayout += numberBets[winningNumber] * finalMultiplier;
    }
    
    return totalPayout;
  };

  // Place bet on color
  const placeBetOnColor = (color: 'red' | 'black' | 'white') => {
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

  // Place bet on number
  const placeBetOnNumber = (number: number) => {
    if (isSpinning || !isBettingPhase) return;
    
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
  };

  // Clear all bets
  const clearBets = () => {
    setColorBets({ red: 0, black: 0, white: 0 });
    setNumberBets({});
  };

  // Deterministic animation
  const animateRoulette = (timestamp: number) => {
    if (!spinStartTime.current) {
      spinStartTime.current = timestamp;
    }

    const elapsed = timestamp - spinStartTime.current;
    const numberWidth = 52; // Width including margin

    if (!rouletteRef.current || targetNumber.current === null) {
      if (elapsed < spinDuration) {
        animationRef.current = requestAnimationFrame(animateRoulette);
      }
      return;
    }

    if (elapsed < spinDuration) {
      const progress = elapsed / spinDuration;
      
      if (progress < 0.7) {
        // Spinning phase - constant speed
        const baseSpeed = 30;
        currentPosition.current -= baseSpeed;
        
        if (currentPosition.current < -(numberWidth * 150)) {
          currentPosition.current += (numberWidth * 150);
        }
      } else {
        // Deceleration phase
        const containerCenter = (rouletteRef.current.parentElement?.offsetWidth || 0) / 2;
        const decelerationProgress = (progress - 0.7) / 0.3;
        
        if (decelerationProgress <= 0.01 && decelerationStartPosition.current === 0) {
          decelerationStartPosition.current = currentPosition.current;
        }
        
        // Find target number in extended array (accounting for 0 not being in strip)
        let targetIndex = -1;
        const targetValue = targetNumber.current;
        
        // If target is 0 (white), we need special handling - pick a random stopping point
        if (targetValue === 0) {
          // Stop between numbers to indicate white/0 won
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
      // Animation complete
      const winningNumber = targetNumber.current!;
      setCurrentNumber(winningNumber);
      
      // Calculate payout
      const payout = calculateTotalPayout(winningNumber, multipliers);
      
      if (payout > 0) {
        setLastWinAmount(payout);
        setShowWinAnimation(true);
        setTimeout(() => setShowWinAnimation(false), 3000);
        
        // Add winnings to balance
        if (useRealBalance) {
          updateBalance(realBalance + payout, bonusBalance);
        } else {
          updateBalance(realBalance, bonusBalance + payout);
        }
        
        toast.success(`Você ganhou R$ ${payout.toFixed(2)}!`);
      }
      
      // Update game history
      const updatedGameHistory = [winningNumber, ...history].slice(0, 20);
      setHistory(updatedGameHistory);
      localStorage.setItem('doubleXGameHistory', JSON.stringify(updatedGameHistory));
      
      // Reset for next round
      setIsSpinning(false);
      clearBets();
      targetNumber.current = null;
      
      // Start new betting phase after delay
      setTimeout(() => {
        startBettingPhase();
      }, 3000);
    }
  };

  // Start betting phase with timer
  const startBettingPhase = useCallback(() => {
    setIsBettingPhase(true);
    setBettingTimeLeft(15);
    setMultipliers(generateMultipliers());
    setShowMultiplierAnimation(true);
    setTimeout(() => setShowMultiplierAnimation(false), 1500);
    
    if (bettingIntervalRef.current) {
      clearInterval(bettingIntervalRef.current);
    }
    
    bettingIntervalRef.current = setInterval(() => {
      setBettingTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(bettingIntervalRef.current!);
          setIsBettingPhase(false);
          // Start spin automatically
          setTimeout(() => spinRoulette(), 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Spin the roulette
  const spinRoulette = async () => {
    const totalBet = getTotalBet();
    
    // Deduct bet from balance
    if (totalBet > 0) {
      if (useRealBalance) {
        if (totalBet > realBalance) {
          toast.error('Saldo insuficiente');
          startBettingPhase();
          return;
        }
        await updateBalance(realBalance - totalBet, bonusBalance);
      } else {
        if (totalBet > bonusBalance) {
          toast.error('Saldo bônus insuficiente');
          startBettingPhase();
          return;
        }
        await updateBalance(realBalance, bonusBalance - totalBet);
      }
    }
    
    // Generate RNG result
    const result = generateRNGResult();
    targetNumber.current = result;
    
    setIsSpinning(true);
    setCurrentNumber(null);
    
    // Reset animation state
    spinStartTime.current = undefined;
    decelerationStartPosition.current = 0;
    const containerWidth = rouletteRef.current?.parentElement?.offsetWidth || 350;
    currentPosition.current = -(containerWidth * 2);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(animateRoulette);
  };

  // Initialize on mount
  useEffect(() => {
    setHistory(loadGameHistory());
    startBettingPhase();
    
    return () => {
      if (bettingIntervalRef.current) {
        clearInterval(bettingIntervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 text-white pb-4">
      <BonusModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
      />
      
      {/* Header */}
      <div className="bg-black/50 p-3 flex items-center justify-between backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
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

      {/* Betting Timer */}
      <div className="px-4 py-2">
        <div className="bg-black/30 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">
              {isBettingPhase ? 'Faça suas apostas!' : isSpinning ? 'Girando...' : 'Aguarde...'}
            </span>
            <span className={`text-lg font-bold ${bettingTimeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
              {isBettingPhase ? `${bettingTimeLeft}s` : '--'}
            </span>
          </div>
          <Progress 
            value={isBettingPhase ? (bettingTimeLeft / 15) * 100 : 0} 
            className="h-2 bg-gray-700"
          />
        </div>
      </div>

      {/* History */}
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

      {/* Color Betting Area */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-3 gap-2">
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
            onClick={() => placeBetOnColor('white')}
            disabled={isSpinning || !isBettingPhase}
            className={`relative h-16 rounded-lg font-bold text-black transition-all ${
              colorBets.white > 0 ? 'ring-2 ring-yellow-400' : ''
            } bg-gradient-to-b from-white to-gray-200 hover:from-gray-100 hover:to-gray-300 disabled:opacity-50`}
          >
            <span className="text-xs">BRANCO</span>
            <br />
            <span className="text-sm">20X</span>
            {colorBets.white > 0 && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {colorBets.white}
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

      {/* Number Betting Grid */}
      <div className="px-4 mb-4">
        <div className="bg-black/30 rounded-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-yellow-400">APOSTE NO NÚMERO EXATO (20X)</h3>
            {Object.keys(multipliers).length > 0 && (
              <div className={`flex items-center gap-1 text-yellow-400 ${showMultiplierAnimation ? 'animate-pulse' : ''}`}>
                <Zap className="h-4 w-4" />
                <span className="text-xs">RAIOS ATIVOS!</span>
              </div>
            )}
          </div>
          
          {/* White/0 special */}
          <div className="flex justify-center mb-3">
            <button
              onClick={() => placeBetOnNumber(0)}
              disabled={isSpinning || !isBettingPhase}
              className={`relative w-14 h-14 rounded-lg font-bold text-black transition-all ${
                numberBets[0] ? 'ring-2 ring-yellow-400' : ''
              } bg-gradient-to-b from-white to-gray-200 hover:from-gray-100 hover:to-gray-300 disabled:opacity-50`}
            >
              0
              {multipliers[0] && (
                <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold px-1 rounded animate-pulse">
                  <Zap className="h-3 w-3 inline" />{multipliers[0]}X
                </div>
              )}
              {numberBets[0] && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[10px] font-bold rounded px-1">
                  R${numberBets[0]}
                </div>
              )}
            </button>
          </div>
          
          {/* Numbers 1-14 grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 14 }, (_, i) => i + 1).map(num => {
              const isRed = num % 2 === 1;
              const hasMultiplier = multipliers[num];
              
              return (
                <button
                  key={num}
                  onClick={() => placeBetOnNumber(num)}
                  disabled={isSpinning || !isBettingPhase}
                  className={`relative h-12 rounded-lg font-bold text-white transition-all ${
                    numberBets[num] ? 'ring-2 ring-yellow-400' : ''
                  } ${isRed 
                    ? 'bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600' 
                    : 'bg-gradient-to-b from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800'
                  } disabled:opacity-50`}
                >
                  {num}
                  {hasMultiplier && (
                    <div className={`absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] font-bold px-0.5 rounded ${showMultiplierAnimation ? 'animate-bounce' : 'animate-pulse'}`}>
                      <Zap className="h-2 w-2 inline" />{hasMultiplier}X
                    </div>
                  )}
                  {numberBets[num] && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[8px] font-bold rounded px-0.5">
                      {numberBets[num]}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chip Selection */}
      <div className="px-4 mb-4">
        <div className="bg-black/30 rounded-xl p-3">
          <h3 className="text-xs text-gray-400 mb-2 text-center">SELECIONE A FICHA</h3>
          <div className="flex justify-center gap-2 flex-wrap">
            {CHIP_VALUES.map(value => (
              <button
                key={value}
                onClick={() => setSelectedChip(value)}
                className={`w-12 h-12 rounded-full font-bold text-sm transition-all ${
                  selectedChip === value
                    ? 'bg-yellow-400 text-black scale-110 shadow-lg shadow-yellow-400/50'
                    : 'bg-gradient-to-b from-purple-600 to-purple-800 text-white hover:scale-105'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Total Bet & Clear */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between bg-black/30 rounded-lg p-3">
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

      {/* Deposit Modal */}
      <Dialog open={showDepositModal} onOpenChange={(open) => {
        if (!open) {
          navigate('/');
        }
        setShowDepositModal(open);
      }}>
        <DialogContent className="bg-gray-900 border-yellow-500 w-[92vw] max-w-sm sm:max-w-md rounded-xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-white">
                Bem-vindo ao Casino Bet dos Crias
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowDepositModal(false);
                  navigate('/');
                }}
                className="h-8 w-8 text-white hover:text-yellow-400"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="text-white text-center py-4 px-1">
            <p className="text-base leading-relaxed">
              Faça um depósito mínimo de R$ 10,00 para ativar o bônus e liberar o acesso aos jogos disponíveis na plataforma.
            </p>
          </div>
          <Button 
            onClick={() => {
              setShowDepositModal(false);
              navigate('/');
            }}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
          >
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoubleGame;