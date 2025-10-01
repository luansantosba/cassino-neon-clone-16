import { Ticket, Gamepad2, CircleDot } from "lucide-react";

const categories = [
  { id: "raspadinha", icon: Ticket, label: "Raspe e ganhe", color: "text-yellow-400" },
  { id: "double", icon: Gamepad2, label: "Double", color: "text-purple-400" }
];

interface CasinoCategoriesProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const CasinoCategories = ({ selectedCategory, onCategorySelect }: CasinoCategoriesProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-background">
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