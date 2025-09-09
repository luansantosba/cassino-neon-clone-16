import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const PromoBanner = () => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [banners, setBanners] = useState([
    {
      src: "/lovable-uploads/cd09606b-d830-4809-a089-574677de6370.png",
      alt: "Primeiro Depósito Triplicado"
    },
    {
      src: "/lovable-uploads/eeadbca5-e962-4664-a799-1da8cf545371.png",
      alt: "Saldo Grátis Todo Dia No Login"
    }
  ]);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const { data: dbBanners } = await supabase
          .from('banners')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });

        if (dbBanners && dbBanners.length > 0) {
          // Convert database banners to display format
          const formattedBanners = dbBanners.map(banner => ({
            src: banner.image_url.startsWith('http') 
              ? banner.image_url 
              : banner.image_url.startsWith('/lovable-uploads/') 
                ? banner.image_url 
                : `/lovable-uploads/${banner.image_url}`,
            alt: banner.title
          }));
          setBanners(formattedBanners);
        }
      } catch (error) {
        console.error('Error loading banners:', error);
        // Keep default banners on error
      }
    };

    loadBanners();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="p-4">
      <div className="rounded-lg overflow-hidden relative">
        <div className="flex transition-transform duration-700 ease-in-out" style={{
          transform: `translateX(-${currentBanner * 100}%)`
        }}>
          {banners.map((banner, index) => (
            <img 
              key={index}
              src={banner.src} 
              alt={banner.alt} 
              className="w-full h-auto object-cover flex-shrink-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;