import React from 'react';

interface GalvanometerProps {
  value: number; // 0 to 100
  maxValue: number;
}

export const Galvanometer: React.FC<GalvanometerProps> = ({ value, maxValue }) => {
  // Calculate angle: -45deg (0) to 45deg (max)
  const normalized = Math.min(Math.max(value / maxValue, 0), 1);
  const angle = -60 + normalized * 120; // 120 degree sweep

  return (
    <div className="relative w-48 h-48 bg-gray-200 rounded-full border-4 border-gray-600 shadow-xl flex flex-col items-center justify-center overflow-hidden">
      {/* Glass reflection effect */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-white opacity-20 rounded-t-full pointer-events-none z-20"></div>
      
      {/* Dial Markings */}
      <div className="absolute inset-2 rounded-full border border-gray-400 bg-white">
        {/* Generate ticks */}
        {Array.from({ length: 11 }).map((_, i) => {
          const tickAngle = -60 + i * 12;
          return (
            <div
              key={i}
              className="absolute w-full h-full left-0 top-0"
              style={{ transform: `rotate(${tickAngle}deg)` }}
            >
              <div className="absolute top-2 left-1/2 w-0.5 h-3 bg-gray-800 -translate-x-1/2"></div>
              {i % 2 === 0 && (
                <span 
                  className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-600"
                  style={{ transform: `rotate(${-tickAngle}deg)` }}
                >
                  {i * 10}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Pivot */}
      <div className="absolute w-4 h-4 bg-gray-800 rounded-full z-10 shadow-sm top-[60%]"></div>

      {/* Needle */}
      <div
        className="absolute w-1 h-24 bg-red-600 origin-bottom z-0"
        style={{
          bottom: '40%',
          left: 'calc(50% - 2px)',
          transform: `rotate(${angle}deg)`,
          transition: 'transform 0.3s cubic-bezier(0.2, 1.5, 0.5, 1)', // Bouncy needle
          borderTopLeftRadius: '50%',
          borderTopRightRadius: '50%',
        }}
      ></div>

      <div className="absolute bottom-8 text-xs font-mono font-bold text-gray-500 tracking-widest">
        GALVANOMETER
      </div>
    </div>
  );
};
