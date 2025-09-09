import { useNavigate } from "react-router-dom";
import scratchCardCover from "@/assets/scratch-card-cover.jpg";
import scratchCard5Cover from "@/assets/scratch-card-5-to-2500-cover.jpg";
import minesCover from "@/assets/mines-cover.jpg";
import doubleCover from "@/assets/double-cover.jpg";
import scratchCardCoverNew from "@/assets/scratch-card-cover-new.jpg";

const gameList = [
  { name: "Crash", provider: "Multiplicador automático", category: "originais", route: "/crash", image: "/lovable-uploads/1d3ad7e8-adb1-4768-a913-f81f61ea409c.png" },
  { name: "Double Automático", provider: "Aposta mín R$1 - máx R$5.000", category: "originais", route: "/double", image: doubleCover },
  { name: "Mines", provider: "Campo minado", category: "originais", route: "/mines", image: minesCover },
  { name: "Raspadinha fácil", provider: "1 real ganha até 500 reais", category: "raspadinha", route: "/raspadinha", image: "/lovable-uploads/e7e49be8-203e-4ce6-bb07-ba1ba9bd508d.png" },
  { name: "Raspadinha de ouro", provider: "5 reais ganha até 2500 reais", category: "raspadinha", route: "/raspadinha-5-para-2500", image: "/lovable-uploads/a7c8b820-dea8-429f-b842-dc0c7391e92d.png" },
  { name: "Raspadinha premium", provider: "10 reais ganha até 15 mil reais", category: "raspadinha", route: "/raspadinha-10-para-15000", image: "/lovable-uploads/c093e778-4ae5-4c7c-b0f3-84f08fb5b422.png" },
  { name: "Raspadinha suprema", provider: "20 reais ganha até 50 mil reais", category: "raspadinha", route: "/raspadinha-20-para-50000", image: "/lovable-uploads/173ff6c0-48ef-4a45-bd3e-48aaefdc5e4b.png" }
];

interface GameGridProps {
  selectedCategory: string;
}

const GameGrid = ({ selectedCategory }: GameGridProps) => {
  const navigate = useNavigate();

  const handleGameClick = (game: typeof gameList[0]) => {
    if (game.route) {
      navigate(game.route);
    }
  };
  const filteredGames = gameList.filter(game => game.category === selectedCategory);

  return (
    <div className="p-4 pb-20">
      <h2 className="text-white font-bold mb-3 flex items-center gap-2">
        <span className="text-casino-gold">🎮</span>
        {selectedCategory === "originais" ? "Jogos Originais" : 
         selectedCategory === "raspadinha" ? "Raspe e ganhe" : 
         selectedCategory === "futebol" ? "Futebol" : "Jogos"}
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {filteredGames.map((game, index) => (
          <div 
            key={index}
            className="aspect-square bg-casino-card rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-casino-blue transition-all"
            onClick={() => handleGameClick(game)}
          >
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 relative flex items-center justify-center">
              {game.image ? (
                <img 
                  src={game.image} 
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                  <div className="text-white font-bold text-sm text-center px-1">
                    {game.name === "Double Automático" ? (
                      <div className="flex items-center justify-center gap-0.5">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <div className="w-4 h-4 rounded-full bg-gray-900 border border-white"></div>
                        <div className="w-4 h-4 rounded-full bg-white border border-gray-400"></div>
                      </div>
                    ) : game.name === "Mines" ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="grid grid-cols-3 gap-0.5">
                          <div className="w-2 h-2 bg-green-400 rounded-sm"></div>
                          <div className="w-2 h-2 bg-gray-600 rounded-sm"></div>
                          <div className="w-2 h-2 bg-green-400 rounded-sm"></div>
                          <div className="w-2 h-2 bg-green-400 rounded-sm"></div>
                          <div className="w-2 h-2 bg-red-500 rounded-sm flex items-center justify-center">
                            <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                          </div>
                          <div className="w-2 h-2 bg-green-400 rounded-sm"></div>
                        </div>
                      </div>
                    ) : (
                      game.name
                    )}
                  </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameGrid;