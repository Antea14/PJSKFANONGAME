
import React from 'react';
import { CharacterType } from '../types';
import { CHARACTERS } from '../constants';

interface CharacterPawnProps {
  type: CharacterType;
  isSelected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

export const CharacterPawn: React.FC<CharacterPawnProps> = ({ type, isSelected, onClick, size = 'md', style }) => {
  const char = CHARACTERS[type];
  const dimension = size === 'md' ? 'w-10 h-10' : 'w-7 h-7';
  const fontSize = size === 'md' ? 'text-xl' : 'text-sm';

  return (
    <div 
      onClick={onClick}
      className={`
        ${dimension} border-4 border-black flex items-center justify-center cursor-pointer
        transition-all transform hover:scale-110 active:scale-90
        ${isSelected ? 'ring-4 ring-yellow-400 -translate-y-2' : ''}
        pixel-shadow-sm
      `}
      style={{ backgroundColor: char.color, ...style }}
      title={char.displayName}
    >
      <span className={fontSize}>{char.avatar}</span>
      {isSelected && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-black animate-bounce font-black text-xs">
          ▼
        </div>
      )}
    </div>
  );
};
