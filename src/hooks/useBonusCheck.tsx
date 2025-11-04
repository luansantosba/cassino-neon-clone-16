import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BonusData {
  bonusBalance: number;
  bonusLocked: boolean;
  gameRestriction: string | null;
  rolloverRequired: number;
  rolloverCurrent: number;
  rolloverCompleted: boolean;
  requiresDeposit?: boolean;
  minimumDeposit?: number | null;
  couponCode?: string | null;
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

        // Get rollover data (latest incomplete)
        const { data: rollover } = await supabase
          .from('user_coupon_rollover' as any)
          .select('required_rollover, current_rollover, completed, game_restriction, coupon_code, created_at')
          .eq('user_id', userId)
          .eq('completed', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // If we have a coupon code, fetch its deposit requirements
        let requiresDeposit: boolean | undefined = undefined;
        let minimumDeposit: number | null | undefined = undefined;
        let couponCode: string | null | undefined = undefined;

        const rolloverData = rollover as any;
        if (rolloverData?.coupon_code) {
          couponCode = rolloverData.coupon_code as string;
          const { data: couponInfo } = await supabase
            .from('coupons' as any)
            .select('requires_deposit, minimum_deposit')
            .eq('code', rolloverData.coupon_code)
            .maybeSingle();
          if (couponInfo) {
            requiresDeposit = !!(couponInfo as any).requires_deposit;
            minimumDeposit = (couponInfo as any).minimum_deposit ?? null;
          }
        }

        if (profile) {
          setBonusData({
            bonusBalance: profile.bonus_balance || 0,
            bonusLocked: profile.bonus_locked || false,
            gameRestriction: profile.bonus_game_restriction || rolloverData?.game_restriction || null,
            rolloverRequired: rolloverData?.required_rollover || 0,
            rolloverCurrent: rolloverData?.current_rollover || 0,
            rolloverCompleted: rolloverData?.completed || false,
            requiresDeposit,
            minimumDeposit,
            couponCode: couponCode ?? null
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
  // Apenas saldo de bônus de cupons tem rollover
  // Comissões de indicação e depósitos normais podem ser sacados livremente
  
  // Se não há bônus de cupom ativo (rolloverRequired = 0), pode sacar
  if (rolloverRequired <= 0 || rolloverCompleted) {
    return { canWithdraw: true };
  }

  // Se tem rollover pendente de cupom, verificar
  if (rolloverCurrent < rolloverRequired) {
    const remaining = rolloverRequired - rolloverCurrent;
    return {
      canWithdraw: false,
      message: `Você precisa completar o rollover de 1x do bônus de cupom antes de sacar.\n\nApostado: R$ ${rolloverCurrent.toFixed(2)}\nNecessário: R$ ${rolloverRequired.toFixed(2)}\nFaltam: R$ ${remaining.toFixed(2)}`
    };
  }

  return { canWithdraw: true };
};

