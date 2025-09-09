import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CasinoHeader = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      
      if (user) {
        // Get user profile data including balance
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserBalance(profile.balance || 0);
        }
      }
    };

    checkUser();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      if (!session) {
        setUserBalance(0);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserBalance(0);
  };

  return (
    <div className="bg-casino-header p-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/menu")}
              className="text-white hover:text-casino-gold"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="text-2xl font-bold text-casino-gold">
            Parimatch
          </div>
        </div>
        <div className="flex gap-2">
          {isLoggedIn ? (
            <>
              <Button 
                variant="casino-gold" 
                size="sm"
                onClick={() => navigate("/depositar")}
              >
                Depósito
              </Button>
              <Button 
                variant="casino-blue" 
                size="sm"
                className="text-white"
              >
                R$ {userBalance.toFixed(2)}
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="casino-gold" 
                size="sm"
                onClick={() => navigate("/cadastro")}
              >
                Registrar-se
              </Button>
              <Button 
                variant="casino-blue" 
                size="sm"
                onClick={() => navigate("/login")}
              >
                Entrar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CasinoHeader;