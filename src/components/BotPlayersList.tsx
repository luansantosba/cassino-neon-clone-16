import { useState, useEffect } from 'react';

// Brazilian first names for bots
const FIRST_NAMES = [
  'João', 'Maria', 'Pedro', 'Ana', 'Lucas', 'Julia', 'Gabriel', 'Beatriz',
  'Rafael', 'Larissa', 'Bruno', 'Camila', 'Diego', 'Fernanda', 'Eduardo',
  'Gabriela', 'Felipe', 'Helena', 'Gustavo', 'Isabella', 'Henrique', 'Juliana',
  'Igor', 'Karen', 'Leonardo', 'Letícia', 'Marcos', 'Mariana', 'Nicolas',
  'Natália', 'Otávio', 'Paula', 'Paulo', 'Raquel', 'Ricardo', 'Renata',
  'Rodrigo', 'Sabrina', 'Thiago', 'Tatiane', 'Vinicius', 'Vanessa', 'William',
  'Amanda', 'Bruna', 'Carlos', 'Daniel', 'Elisa', 'Fábio', 'Giovanna'
];

// Brazilian last names/suffixes
const LAST_PARTS = [
  '***', 'S.', 'M.', 'O.', 'P.', 'R.', 'L.', 'C.', 'F.', 'G.',
  '1234', '777', '999', 'VIP', 'PRO', 'BR', 'SP', 'RJ', 'MG', 'RS'
];

interface BotPlayer {
  id: string;
  name: string;
  bet: 'red' | 'black';
  amount: number;
}

interface BotPlayersListProps {
  realPlayerName?: string;
  realPlayerBet?: 'red' | 'black' | null;
  realPlayerAmount?: number;
  isBettingPhase: boolean;
}

const BotPlayersList = ({ 
  realPlayerName, 
  realPlayerBet, 
  realPlayerAmount = 0,
  isBettingPhase 
}: BotPlayersListProps) => {
  const [bots, setBots] = useState<BotPlayer[]>([]);

  const generateBotName = () => {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastPart = LAST_PARTS[Math.floor(Math.random() * LAST_PARTS.length)];
    return `${firstName}${lastPart}`;
  };

  const generateBots = () => {
    // Generate 1-50 bots per round
    const numBots = Math.floor(Math.random() * 50) + 1;
    const newBots: BotPlayer[] = [];
    
    for (let i = 0; i < numBots; i++) {
      newBots.push({
        id: `bot-${Date.now()}-${i}`,
        name: generateBotName(),
        bet: Math.random() > 0.5 ? 'red' : 'black',
        amount: [1, 5, 10, 25, 50, 100][Math.floor(Math.random() * 6)]
      });
    }
    
    setBots(newBots);
  };

  // Generate new bots when betting phase starts
  useEffect(() => {
    if (isBettingPhase) {
      generateBots();
    }
  }, [isBettingPhase]);

  // Combine bots with real player
  const allPlayers = [
    ...(realPlayerBet && realPlayerAmount > 0 ? [{
      id: 'real-player',
      name: realPlayerName || 'Você',
      bet: realPlayerBet,
      amount: realPlayerAmount,
      isReal: true
    }] : []),
    ...bots.map(b => ({ ...b, isReal: false }))
  ];

  // Separate by bet color
  const redBets = allPlayers.filter(p => p.bet === 'red');
  const blackBets = allPlayers.filter(p => p.bet === 'black');

  return (
    <div className="bg-gray-900/80 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-gray-400">JOGADORES ONLINE</h3>
        <span className="text-xs text-green-400">🟢 {allPlayers.length} ao vivo</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto scrollbar-thin">
        {/* Red bets column */}
        <div className="space-y-1">
          <div className="text-[10px] text-red-400 font-bold mb-1">VERMELHO ({redBets.length})</div>
          {redBets.slice(0, 15).map(player => (
            <div 
              key={player.id}
              className={`flex items-center justify-between text-[10px] px-2 py-0.5 rounded ${
                player.isReal 
                  ? 'bg-yellow-500/20 border border-yellow-500/50' 
                  : 'bg-red-900/30'
              }`}
            >
              <span className={`truncate ${player.isReal ? 'text-yellow-400 font-bold' : 'text-gray-300'}`}>
                {player.isReal ? '⭐ ' : ''}{player.name}
              </span>
              <span className="text-red-400 font-medium ml-1">R${player.amount}</span>
            </div>
          ))}
          {redBets.length > 15 && (
            <div className="text-[10px] text-gray-500 text-center">
              +{redBets.length - 15} mais
            </div>
          )}
        </div>
        
        {/* Black bets column */}
        <div className="space-y-1">
          <div className="text-[10px] text-gray-300 font-bold mb-1">PRETO ({blackBets.length})</div>
          {blackBets.slice(0, 15).map(player => (
            <div 
              key={player.id}
              className={`flex items-center justify-between text-[10px] px-2 py-0.5 rounded ${
                player.isReal 
                  ? 'bg-yellow-500/20 border border-yellow-500/50' 
                  : 'bg-gray-800/50'
              }`}
            >
              <span className={`truncate ${player.isReal ? 'text-yellow-400 font-bold' : 'text-gray-300'}`}>
                {player.isReal ? '⭐ ' : ''}{player.name}
              </span>
              <span className="text-gray-400 font-medium ml-1">R${player.amount}</span>
            </div>
          ))}
          {blackBets.length > 15 && (
            <div className="text-[10px] text-gray-500 text-center">
              +{blackBets.length - 15} mais
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BotPlayersList;
