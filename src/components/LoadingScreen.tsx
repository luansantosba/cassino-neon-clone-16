import { useEffect, useState } from "react";
import loadingImage from "@/assets/loading-screen.png";

const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-casino-gold flex items-center justify-center">
      <img 
        src={loadingImage} 
        alt="Bet dos Crias" 
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default LoadingScreen;
