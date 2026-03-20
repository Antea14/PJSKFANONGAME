import React, { useState } from 'react';
import { PlayerState, CharacterType } from '../types';
import { CHARACTERS } from '../constants';

interface PlayerPanelProps {
  player: PlayerState;
  isMe: boolean;
  onToggleBattery: (index: number) => void;
  onChangePieceCount: (delta: number) => void;
  onExpandBattery: () => void;
  onShrinkBattery: () => void;
  onSwitchCharacter: () => void;
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({ 
  player, 
  isMe, 
  onToggleBattery, 
  onChangePieceCount,
  onExpandBattery,
  onShrinkBattery,
  onSwitchCharacter 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const char = CHARACTERS[player.character];

  const showDetail = isMe || isExpanded;

  return (
    <div className={`relative flex flex-col gap-1 transition-all duration-300 ${isMe ? 'ring-4 ring-yellow-400 -m-1 p-1 z-10' : ''}`}>
      {/* Character Card Main Body */}
      <div 
        onClick={() => !isMe && setIsExpanded(!isExpanded)}
        className={`border-4 border-black bg-white pixel-shadow p-0 overflow-hidden flex flex-col transition-all ${isMe ? 'shadow-lg' : 'opacity-90 hover:opacity-100 cursor-pointer'}`}
      >
        
        {/* Header - Avatar & Name (Always Visible) */}
        <div 
          className="p-2 border-b-4 border-black flex items-center justify-between"
          style={{ backgroundColor: char.color }}
        >
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center text-2xl pixel-border">
              {char.avatar}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <div className="text-[10px] font-bold bg-black text-white px-1 w-fit uppercase tracking-tighter truncate max-w-[100px]">
                  {player.name}
                </div>
                {isMe && <span className="text-[8px] bg-yellow-400 px-1 font-black border border-black">ME</span>}
              </div>
              <div className="font-bold text-xs leading-none opacity-70">{char.displayName}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {player.isHost && <span className="text-[8px] bg-white border border-black px-1 font-black">HOST</span>}
            {!isMe && <span className="text-[8px] opacity-40 font-black">{isExpanded ? '▼' : '▶'}</span>}
          </div>
        </div>

        {/* Content Body (Conditional Rendering) */}
        {showDetail && (
          <div className="p-3 flex flex-col gap-3 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] animate-in slide-in-from-top-2 duration-200">
            
            {/* Buffs Section */}
            <div className="flex flex-col gap-1.5">
               <div className="bg-green-50 border-l-4 border-green-500 p-1.5">
                  <span className="text-[8px] font-black text-green-700 uppercase block mb-0.5">正面BUFF (Positive)</span>
                  <p className="text-[9px] leading-tight font-medium">{char.positiveBuff}</p>
               </div>
               <div className="bg-red-50 border-l-4 border-red-500 p-1.5">
                  <span className="text-[8px] font-black text-red-700 uppercase block mb-0.5">负面BUFF (Negative)</span>
                  <p className="text-[9px] leading-tight font-medium">{char.negativeBuff}</p>
               </div>
            </div>

            {/* Skill */}
            <div className="bg-indigo-50 border-2 border-black p-2 relative">
               <span className="absolute -top-2 -right-1 bg-indigo-600 text-white text-[7px] px-1 font-black border border-black">SKILL</span>
               <p className="text-[10px] font-bold leading-tight">{char.skill}</p>
               <div className="mt-1 text-[8px] font-black opacity-40">消耗: {char.cost}</div>
            </div>

            {/* Piece Management Slot */}
            <div className="border-t-2 border-black/5 pt-1">
              <div className="flex items-center justify-between mb-1">
                 <span className="text-[9px] font-black uppercase opacity-40">角色棋子槽</span>
                 <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button 
                      disabled={!isMe}
                      onClick={() => onChangePieceCount(-1)}
                      className="w-5 h-5 bg-red-100 border-2 border-black flex items-center justify-center font-bold text-xs disabled:opacity-20 hover:bg-red-200"
                    >-</button>
                    <span className="min-w-[1.2rem] text-center text-xs font-black">{player.pieceCount}</span>
                    <button 
                      disabled={!isMe}
                      onClick={() => onChangePieceCount(1)}
                      className="w-5 h-5 bg-green-100 border-2 border-black flex items-center justify-center font-bold text-xs disabled:opacity-20 hover:bg-green-200"
                    >+</button>
                 </div>
              </div>
            </div>

            {/* Batteries Section */}
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-black uppercase opacity-40">电池槽 (Slots)</span>
                <div className="flex gap-1">
                  <button 
                    disabled={!isMe || player.batteries.length <= 1}
                    onClick={onShrinkBattery}
                    className="w-5 h-5 bg-red-100 border-2 border-black flex items-center justify-center font-bold text-xs disabled:opacity-20 hover:bg-red-200"
                  >-</button>
                  <button 
                    disabled={!isMe}
                    onClick={onExpandBattery}
                    className="w-5 h-5 bg-green-100 border-2 border-black flex items-center justify-center font-bold text-xs disabled:opacity-20 hover:bg-green-200"
                  >+</button>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {player.batteries.map((isFull, idx) => (
                  <button
                    key={idx}
                    disabled={!isMe}
                    onClick={() => onToggleBattery(idx)}
                    className={`
                      w-6 h-4 border-2 border-black relative transition-all active:scale-90
                      ${isFull ? 'bg-green-400' : 'bg-gray-200'}
                      ${!isMe ? 'cursor-default' : 'cursor-pointer shadow-sm hover:brightness-110'}
                    `}
                  >
                    <div className="absolute -right-0.5 top-0.5 w-0.5 h-1.5 bg-black"></div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};