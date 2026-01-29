import { Gamepad2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CasinoCategories = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 bg-background">
      <div 
        className="flex flex-col items-center p-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => navigate('/double-x')}
      >
        <Gamepad2 className="h-8 w-8 mb-2 text-yellow-400" />
        <span className="text-lg font-bold text-white">Double-X</span>
        <span className="text-xs text-gray-200">Multiplicadores até 1000X!</span>
      </div>
    </div>
  );
};

export default CasinoCategories;