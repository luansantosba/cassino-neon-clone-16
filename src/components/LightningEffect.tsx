import { useState, useEffect } from 'react';

interface LightningEffectProps {
  active: boolean;
  multiplier: number;
}

const LightningEffect = ({ active, multiplier }: LightningEffectProps) => {
  const [bolts, setBolts] = useState<{ id: number; path: string; delay: number }[]>([]);

  useEffect(() => {
    if (active) {
      // Generate random lightning bolt paths
      const newBolts = Array.from({ length: 3 }, (_, i) => ({
        id: i,
        path: generateLightningPath(),
        delay: i * 150
      }));
      setBolts(newBolts);
    } else {
      setBolts([]);
    }
  }, [active]);

  const generateLightningPath = () => {
    const startX = Math.random() * 60 + 20;
    let path = `M ${startX} 0`;
    let y = 0;
    
    while (y < 100) {
      const segmentLength = Math.random() * 20 + 10;
      const xOffset = (Math.random() - 0.5) * 30;
      y += segmentLength;
      const x = startX + xOffset;
      path += ` L ${Math.max(5, Math.min(95, x))} ${Math.min(y, 100)}`;
    }
    
    return path;
  };

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {/* Glow effect */}
      <div className="absolute inset-0 animate-pulse">
        <div className="absolute inset-0 bg-gradient-radial from-yellow-400/30 via-yellow-500/10 to-transparent" />
      </div>
      
      {/* SVG Lightning bolts */}
      <svg 
        viewBox="0 0 100 100" 
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        {bolts.map((bolt) => (
          <g key={bolt.id}>
            {/* Outer glow */}
            <path
              d={bolt.path}
              fill="none"
              stroke="rgba(250, 204, 21, 0.5)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-lightning"
              style={{ 
                animationDelay: `${bolt.delay}ms`,
                filter: 'blur(4px)'
              }}
            />
            {/* Main bolt */}
            <path
              d={bolt.path}
              fill="none"
              stroke="#facc15"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-lightning"
              style={{ animationDelay: `${bolt.delay}ms` }}
            />
            {/* Core bright line */}
            <path
              d={bolt.path}
              fill="none"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-lightning"
              style={{ animationDelay: `${bolt.delay}ms` }}
            />
          </g>
        ))}
      </svg>
      
      {/* Multiplier badge with electric effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <div className="absolute inset-0 bg-yellow-400 blur-xl animate-pulse opacity-80" />
          <div className="relative bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 text-black font-black text-xs px-2 py-1 rounded-lg shadow-lg animate-bounce border-2 border-yellow-200">
            {multiplier}X
          </div>
        </div>
      </div>
      
      {/* Electric sparks */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-spark"
          style={{
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`,
            animationDelay: `${i * 100}ms`
          }}
        />
      ))}
    </div>
  );
};

export default LightningEffect;
