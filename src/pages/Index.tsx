import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CasinoHeader from "@/components/CasinoHeader";
import CasinoCategories from "@/components/CasinoCategories";
import PromoBanner from "@/components/PromoBanner";
import GameGrid from "@/components/GameGrid";
import BottomNavigation from "@/components/BottomNavigation";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("raspadinha");
  const navigate = useNavigate();

  const handleCategorySelect = (category: string) => {
    if (category === "double") {
      // Navigate directly to Double game
      navigate("/double");
    } else {
      setSelectedCategory(category);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <CasinoHeader />
      <PromoBanner />
      <CasinoCategories 
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />
      <GameGrid selectedCategory={selectedCategory} />
      <BottomNavigation />
    </div>
  );
};

export default Index;
