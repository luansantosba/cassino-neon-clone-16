import ScratchCard10to15000 from "@/components/ScratchCard10to15000";
import GameAccessGuard from "@/components/GameAccessGuard";

const ScratchCard10to15000Game = () => {
  return (
    <GameAccessGuard requestedGame="Raspadinha">
      <ScratchCard10to15000 />
    </GameAccessGuard>
  );
};

export default ScratchCard10to15000Game;