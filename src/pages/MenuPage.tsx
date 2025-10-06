import { Menu, Users, Gift, HeadphonesIcon, History, DollarSign, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MenuPage = () => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: History, label: "Histórico", path: "/historico", description: "Veja seu histórico de jogos" },
    { icon: DollarSign, label: "Saque", path: "/saque", description: "Faça suas retiradas" },
    { icon: Users, label: "Afiliados", path: "/afiliados", description: "Programa de indicação" },
    { icon: Gift, label: "Bônus", path: "/bonus", description: "Seus bônus disponíveis" },
    { icon: HeadphonesIcon, label: "Suporte", path: "/suporte", description: "Central de ajuda" }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <Card className="bg-casino-header border-border">
          <div className="p-4 flex items-center justify-between">
            <h1 className="text-white text-xl font-bold">Menu Principal</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-white hover:text-casino-gold"
            >
              Voltar
            </Button>
          </div>
        </Card>

        {/* Menu Items */}
        <div className="p-4 space-y-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={index}
                className="bg-casino-header/30 border-border cursor-pointer hover:bg-casino-header/50 transition-colors"
                onClick={() => handleNavigation(item.path)}
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="bg-casino-gold/20 p-3 rounded-full">
                    <Icon className="h-6 w-6 text-casino-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{item.label}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Logout */}
          <Card
            className="bg-red-500/20 border-red-500/30 cursor-pointer hover:bg-red-500/30 transition-colors"
            onClick={handleLogout}
          >
            <div className="p-4 flex items-center gap-4">
              <div className="bg-red-500/20 p-3 rounded-full">
                <LogOut className="h-6 w-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Sair</h3>
                <p className="text-muted-foreground text-sm">Fazer logout da conta</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;