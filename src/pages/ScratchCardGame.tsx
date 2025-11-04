import ScratchCard from "@/components/ScratchCard";
import GameAccessGuard from "@/components/GameAccessGuard";

const ScratchCardGame = () => {
  return (
    <GameAccessGuard requestedGame="Raspadinha">
      <ScratchCard />
    </GameAccessGuard>
  );
};

export default ScratchCardGame;