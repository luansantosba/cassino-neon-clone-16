import { Ticket, Gamepad2, CircleDot } from "lucide-react";

const categories = [
  { id: "raspadinha", icon: Ticket, label: "Raspe e ganhe", color: "text-yellow-400" },
  { id: "originais", icon: Gamepad2, label: "Originais", color: "text-purple-400" },
  { id: "futebol", icon: CircleDot, label: "Futebol", color: "text-orange-400" }
];

interface CasinoeCategoriesProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const CasinoCategories = ({ selectedCategory, onCategorySelect }: CasinoeCategoriesProps) => {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-background">
      {categories.map((category, index) => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.id;
        return (
          <div 
            key={index}
            className={`flex flex-col items-center p-3 rounded-lg transition-colors cursor-pointer ${
              isSelected ? 'bg-casino-blue text-white' : 'bg-casino-card hover:bg-accent'
            }`}
            onClick={() => onCategorySelect(category.id)}
          >
            <Icon className={`h-6 w-6 mb-1 ${isSelected ? 'text-white' : category.color}`} />
            <span className="text-xs text-center">{category.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default CasinoCategories;