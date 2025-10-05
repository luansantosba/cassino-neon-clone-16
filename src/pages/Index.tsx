import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import CasinoHeader from "@/components/CasinoHeader";
import CasinoCategories from "@/components/CasinoCategories";
import PromoBanner from "@/components/PromoBanner";
import GameGrid from "@/components/GameGrid";
import BottomNavigation from "@/components/BottomNavigation";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("raspadinha");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleCategorySelect = (category: string) => {
    if (category === "double") {
      // Navigate directly to Double game
      navigate("/double");
    } else {
      setSelectedCategory(category);
    }
  };

  useEffect(() => {
    // New referral param: id=bdc###
    const id = (searchParams.get('id') || '').toLowerCase();
    if (/^bdc\d{3}$/.test(id)) {
      localStorage.setItem('referrer_id', id);
      toast.success(`Você foi indicado! Código ${id} aplicado no cadastro.`);
    }
    // Clean URL
    const newUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [searchParams]);

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
