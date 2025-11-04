import ScratchCard20to50000 from "@/components/ScratchCard20to50000";
import GameAccessGuard from "@/components/GameAccessGuard";

const ScratchCard20to50000Game = () => {
  return (
    <GameAccessGuard requestedGame="Raspadinha">
      <ScratchCard20to50000 />
    </GameAccessGuard>
  );
};

export default ScratchCard20to50000Game;