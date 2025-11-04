import ScratchCard5to2500 from "@/components/ScratchCard5to2500";
import GameAccessGuard from "@/components/GameAccessGuard";

const ScratchCard5to2500Game = () => {
  return (
    <GameAccessGuard requestedGame="Raspadinha">
      <ScratchCard5to2500 />
    </GameAccessGuard>
  );
};

export default ScratchCard5to2500Game;