
import React from 'react';

interface BatterySupplyProps {
  onGain: () => void;
  onShrink: () => void;
}

export const BatterySupply: React.FC<BatterySupplyProps> = ({ onGain, onShrink }) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        <div 
          onClick={onGain}
          className="relative w-24 h-20 cursor-pointer group active:scale-95 transition-transform"
        >
          {/* Visual Pile of Batteries */}
          <div className="absolute bottom-0 left-2 w-10 h-5 bg-green-400 border-2 border-black rotate-[-15deg] pixel-shadow-sm"></div>
          <div className="absolute bottom-1 right-2 w-10 h-5 bg-green-500 border-2 border-black rotate-[10deg] pixel-shadow-sm"></div>
          
          {/* Interaction Label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white border-2 border-black px-2 py-1 text-[9px] font-black uppercase tracking-tighter shadow-sm group-hover:scale-110 transition-transform text-center leading-tight">
              ⚡ 扩充
            </div>
          </div>
        </div>

        <div 
          onClick={onShrink}
          className="relative w-24 h-20 cursor-pointer group active:scale-95 transition-transform"
        >
          {/* Visual Pile of Batteries (Muted) */}
          <div className="absolute bottom-0 left-2 w-10 h-5 bg-red-400 border-2 border-black rotate-[-15deg] pixel-shadow-sm"></div>
          <div className="absolute bottom-1 right-2 w-10 h-5 bg-red-500 border-2 border-black rotate-[10deg] pixel-shadow-sm"></div>
          
          {/* Interaction Label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white border-2 border-black px-2 py-1 text-[9px] font-black uppercase tracking-tighter shadow-sm group-hover:scale-110 transition-transform text-center leading-tight">
              🗑️ 减少
            </div>
          </div>
        </div>
      </div>
      <div className="text-[10px] font-black opacity-30 uppercase">Battery Slots</div>
    </div>
  );
};
