import { Menu, Ticket, Gift, HeadphonesIcon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const mainNavItems = [
  { icon: Menu, label: "Menu", path: "/menu", active: false },
  { icon: Ticket, label: "Cupons", path: "/cupons", active: false },
  { icon: Gift, label: "Bônus", path: "/bonus", active: false },
  { icon: HeadphonesIcon, label: "Suporte", path: "/suporte", active: false }
];

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-casino-header border-t border-border px-4 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {mainNavItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <div 
              key={index}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center py-2 px-1 cursor-pointer transition-colors ${
                isActive 
                  ? 'text-casino-gold' 
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 mb-1" />
              <span className="text-xs">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;