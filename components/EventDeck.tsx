
import React from 'react';
import { EventCard } from '../types';

interface EventDeckProps {
  activeEvent: EventCard | null;
  onDraw: () => void;
  onClose: () => void;
  onUse: () => void;
  deckCount: number;
}

export const EventDeck: React.FC<EventDeckProps> = ({ activeEvent, onDraw, onClose, onUse, deckCount }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        onClick={onDraw}
        className={`
          w-40 h-56 border-4 border-black bg-indigo-500 cursor-pointer flex flex-col items-center justify-center
          pixel-shadow hover:-translate-y-2 transition-transform active:scale-95 group relative
        `}
      >
        <div className="text-white text-4xl mb-2 group-hover:scale-110 transition-transform">✨</div>
        <div className="text-white font-bold text-xl uppercase tracking-widest">事件卡</div>
        <div className="text-white/40 text-[10px] mt-2 font-black italic">CARDS: {deckCount}</div>
        
        {/* Draw Hint */}
        <div className="absolute -top-2 -right-2 bg-yellow-400 border-2 border-black text-black text-[9px] px-1 font-bold animate-pulse">
          CLICK TO DRAW
        </div>
      </div>

      {activeEvent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-80 p-0 bg-white border-8 border-black pixel-shadow flex flex-col animate-in zoom-in duration-200">
            {/* Card Header */}
            <div className={`p-4 border-b-4 border-black ${activeEvent.isTeamEvent ? 'bg-orange-400' : 'bg-indigo-600'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1 text-center">
                  <div className="text-white text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">
                    {activeEvent.isTeamEvent ? 'Team Event (团队事件)' : 'Basic Event (基础事件)'}
                  </div>
                  <h3 className="text-2xl font-black text-white italic tracking-tight">{activeEvent.title}</h3>
                </div>
              </div>
            </div>

            {/* Card Content - Centered Text */}
            <div className="p-8 bg-[url('https://www.transparenttextures.com/patterns/notebook-darker.png')] min-h-[220px] flex items-center justify-center text-center">
              <p className="text-xl leading-relaxed text-gray-900 font-black italic">
                “{activeEvent.description}”
              </p>
            </div>

            {/* Card Footer Actions */}
            <div className="p-4 border-t-4 border-black flex flex-col gap-2 bg-gray-50">
              <button 
                onClick={onUse}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-black border-4 border-black py-3 pixel-shadow active:translate-y-1 transition-all uppercase tracking-tighter"
              >
                使用完毕并洗牌 (DONE)
              </button>
              <button 
                onClick={onClose}
                className="w-full bg-white hover:bg-gray-100 text-black font-black border-4 border-black py-1 text-xs uppercase"
              >
                稍后使用 (CLOSE)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
