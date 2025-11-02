import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BonusData {
  bonusBalance: number;
  bonusLocked: boolean;
  gameRestriction: string | null;
  rolloverRequired: number;
  rolloverCurrent: number;
  rolloverCompleted: boolean;
}

export const useBonusCheck = (userId: string | null) => {
  const [bonusData, setBonusData] = useState<BonusData>({
    bonusBalance: 0,
    bonusLocked: false,
    gameRestriction: null,
    rolloverRequired: 0,
    rolloverCurrent: 0,
    rolloverCompleted: false
  });

  useEffect(() => {
    if (!userId) return;

    const loadBonusData = async () => {
      try {
        // Get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('bonus_balance, bonus_locked, bonus_game_restriction')
          .eq('id', userId)
          .single();

        // Get rollover data
        const { data: rollover } = await supabase
          .from('user_coupon_rollover' as any)
          .select('required_rollover, current_rollover, completed, game_restriction')
          .eq('user_id', userId)
          .eq('completed', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (profile) {
          const rolloverData = rollover as any;
          setBonusData({
            bonusBalance: profile.bonus_balance || 0,
            bonusLocked: profile.bonus_locked || false,
            gameRestriction: profile.bonus_game_restriction || rolloverData?.game_restriction || null,
            rolloverRequired: rolloverData?.required_rollover || 0,
            rolloverCurrent: rolloverData?.current_rollover || 0,
            rolloverCompleted: rolloverData?.completed || false
          });
        }
      } catch (error) {
        console.error('Error loading bonus data:', error);
      }
    };

    loadBonusData();

    // Subscribe to changes
    const subscription = supabase
      .channel('bonus_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        () => loadBonusData()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return bonusData;
};

export const checkGameAccess = (
  requestedGame: string,
  gameRestriction: string | null,
  bonusBalance: number
): { canPlay: boolean; message?: string } => {
  // If no bonus balance or no restriction, can play
  if (bonusBalance <= 0 || !gameRestriction) {
    return { canPlay: true };
  }

  // If game matches restriction, can play
  if (gameRestriction === requestedGame) {
    return { canPlay: true };
  }

  // Otherwise, blocked
  return {
    canPlay: false,
    message: `Este saldo bônus só pode ser usado no jogo ${gameRestriction}. Jogue ${gameRestriction} para usar seu bônus!`
  };
};

export const checkWithdrawalEligibility = (
  bonusBalance: number,
  rolloverRequired: number,
  rolloverCurrent: number,
  rolloverCompleted: boolean
): { canWithdraw: boolean; message?: string } => {
  // If no bonus balance, can withdraw
  if (bonusBalance <= 0 || rolloverCompleted) {
    return { canWithdraw: true };
  }

  // If rollover not completed, blocked
  if (rolloverCurrent < rolloverRequired) {
    const remaining = rolloverRequired - rolloverCurrent;
    return {
      canWithdraw: false,
      message: `Você precisa completar o rollover de 1x do bônus antes de sacar.\n\nApostado: R$ ${rolloverCurrent.toFixed(2)}\nNecessário: R$ ${rolloverRequired.toFixed(2)}\nFaltam: R$ ${remaining.toFixed(2)}`
    };
  }

  return { canWithdraw: true };
};

