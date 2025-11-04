import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBonusCheck, checkGameAccess } from '@/hooks/useBonusCheck';
import { Button } from '@/components/ui/button';

interface Props {
  requestedGame: string;
  children: React.ReactNode;
}

const GameAccessGuard: React.FC<Props> = ({ requestedGame, children }) => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.session?.user?.id ?? null);
    });
    return () => { mounted = false; };
  }, []);

  const bonusData = useBonusCheck(userId);

  const access = checkGameAccess(
    requestedGame,
    bonusData.gameRestriction,
    bonusData.bonusBalance,
    { bonusLocked: bonusData.bonusLocked }
  );

  // Allow play if no restrictions or not logged
  if (!userId || access.canPlay) return <>{children}</>

  // Block play with overlay message
  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="max-w-md w-[92vw] bg-card border border-border rounded-xl p-5 text-center space-y-3 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Uso de bônus indisponível</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {access.message}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <Button onClick={() => window.history.back()} variant="secondary">Voltar</Button>
            <Button onClick={() => (window.location.href = '/deposit')}>Fazer depósito</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameAccessGuard;
