import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDepositCheck = (userId: string | null) => {
  const [hasMinimumDeposit, setHasMinimumDeposit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDeposit = async () => {
      if (!userId) {
        setHasMinimumDeposit(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check if user has any confirmed deposit >= 10 reais
        const { data, error } = await supabase
          .from('deposits')
          .select('amount')
          .eq('user_id', userId)
          .eq('status', 'confirmed')
          .gte('amount', 10)
          .limit(1);

        if (error) {
          console.error('Error checking deposits:', error);
          setHasMinimumDeposit(false);
        } else {
          setHasMinimumDeposit(data && data.length > 0);
        }
      } catch (error) {
        console.error('Error checking deposits:', error);
        setHasMinimumDeposit(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkDeposit();
  }, [userId]);

  return { hasMinimumDeposit, isLoading };
};
