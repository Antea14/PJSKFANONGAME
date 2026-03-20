
import React, { useState } from 'react';

interface DiceRollerProps {
  onRoll: (result: number) => void;
  result: number | null;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({ onRoll, result }) => {
  const [isRolling, setIsRolling] = useState(false);

  const roll = () => {
    setIsRolling(true);
    setTimeout(() => {
      const rollResult = Math.floor(Math.random() * 6) + 1;
      onRoll(rollResult);
      setIsRolling(false);
    }, 600);
  };

  return (
    <div className="p-4 border-4 border-black bg-gray-50 flex flex-col items-center gap-2 pixel-shadow">
      <div 
        className={`
          w-16 h-16 border-4 border-black bg-white flex items-center justify-center text-3xl font-bold
          ${isRolling ? 'animate-bounce' : ''}
        `}
      >
        {isRolling ? '?' : (result || '🎲')}
      </div>
      <button 
        onClick={roll}
        disabled={isRolling}
        className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold border-4 border-black py-1 active:translate-y-1 transition-all disabled:opacity-50"
      >
        ROLL DICE (掷骰子)
      </button>
      {result && !isRolling && (
        <p className="text-xs font-bold text-blue-600">
          Result: {result} {result >= 5 ? '(抽卡)' : '(移动)'}
        </p>
      )}
    </div>
  );
};
