import CasinoHeader from "@/components/CasinoHeader";
import CasinoCategories from "@/components/CasinoCategories";
import PromoBanner from "@/components/PromoBanner";
import BottomNavigation from "@/components/BottomNavigation";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <CasinoHeader />
      <PromoBanner />
      <CasinoCategories />
      <BottomNavigation />
    </div>
  );
};

export default Index;
