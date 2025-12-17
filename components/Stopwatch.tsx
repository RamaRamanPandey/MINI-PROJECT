import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';

interface StopwatchProps {
  onTimeUpdate: (time: number) => void;
}

export const Stopwatch: React.FC<StopwatchProps> = ({ onTimeUpdate }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: number;
    if (isRunning) {
      interval = window.setInterval(() => {
        setTime(prev => {
          const newTime = prev + 100; // 100ms precision
          return newTime;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Sync with parent for physics if needed, though physics usually runs on its own internal clock.
  // Here we use it for the user to measure "t".
  useEffect(() => {
    onTimeUpdate(time / 1000);
  }, [time, onTimeUpdate]);

  const toggle = () => setIsRunning(!isRunning);
  const reset = () => {
    setIsRunning(false);
    setTime(0);
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const remS = s % 60;
    const dec = Math.floor((ms % 1000) / 100);
    return `${m.toString().padStart(2, '0')}:${remS.toString().padStart(2, '0')}.${dec}`;
  };

  return (
    <div className="bg-black p-4 rounded-xl border border-gray-700 shadow-2xl flex flex-col items-center w-40">
        <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs uppercase font-bold">
            <Timer size={12} /> Stopwatch
        </div>
      <div className="font-mono text-3xl text-green-500 bg-gray-900 px-4 py-2 rounded mb-4 shadow-inner border border-gray-800">
        {formatTime(time)}
      </div>
      <div className="flex gap-2 w-full">
        <button 
          onClick={toggle}
          className={`flex-1 flex items-center justify-center p-2 rounded text-white transition-colors ${isRunning ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button 
          onClick={reset}
          className="flex-1 flex items-center justify-center p-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};
