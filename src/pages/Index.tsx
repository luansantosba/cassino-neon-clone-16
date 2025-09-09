import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import CasinoHeader from "@/components/CasinoHeader";
import CasinoCategories from "@/components/CasinoCategories";
import PromoBanner from "@/components/PromoBanner";
import GameGrid from "@/components/GameGrid";
import BottomNavigation from "@/components/BottomNavigation";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("raspadinha");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for referrer ID in URL parameters
    const ref = searchParams.get('ref');
    if (ref) {
      // Store referrer ID in localStorage for registration
      localStorage.setItem('referrer_id', ref);
      toast.success(`Você foi indicado! Cadastre-se e faça um depósito de R$ 20 para o seu indicador ganhar R$ 10 de bônus!`);
      
      // Remove ref parameter from URL to clean up
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <CasinoHeader />
      <PromoBanner />
      <CasinoCategories 
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />
      <GameGrid selectedCategory={selectedCategory} />
      <BottomNavigation />
    </div>
  );
};

export default Index;
