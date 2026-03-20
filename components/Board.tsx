import React, { useState, useEffect, useRef } from 'react';
import { TileState } from '../types';
import { Tile } from './Tile';

interface BoardProps {
  tiles: TileState[];
  onSelectEntity: (type: 'piece' | 'tower', id: string, fromTile: number) => void;
  onMoveToTile: (tileIndex: number) => void;
  selectedEntity: { type: 'piece' | 'tower'; id: string; fromTile: number } | null;
}

export const Board: React.FC<BoardProps> = ({ 
  tiles, 
  onSelectEntity, 
  onMoveToTile,
  selectedEntity 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const BASE_SIZE = 800;
  const radius = 330;
  const centerX = 400;
  const centerY = 400;

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          const availableWidth = parent.clientWidth - 40; // 留出一点边距
          const availableHeight = parent.clientHeight - 40;
          const minSide = Math.min(availableWidth, availableHeight);
          setScale(Math.min(minSide / BASE_SIZE, 1.2)); // 最高放大到1.2倍防止失真
        }
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative flex items-center justify-center origin-center transition-transform duration-300 ease-out"
      style={{ 
        width: BASE_SIZE, 
        height: BASE_SIZE, 
        transform: `scale(${scale})` 
      }}
    >
      {/* Visual background guide line */}
      <div 
        className="absolute rounded-full border-8 border-dashed border-black/5"
        style={{ width: radius * 2, height: radius * 2 }}
      ></div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center opacity-10">
          <h2 className="text-5xl md:text-7xl font-black">世界回廊</h2>
          <p className="text-xl md:text-2xl font-bold uppercase tracking-[0.5em]">Circulation</p>
        </div>
      </div>

      {tiles.map((tile, index) => {
        const angle = (index / tiles.length) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle) - 56; 
        const y = centerY + radius * Math.sin(angle) - 56;

        return (
          <div 
            key={tile.id} 
            className="absolute transition-all duration-500"
            style={{ left: x, top: y }}
          >
            <Tile 
              state={tile} 
              index={index} 
              onSelectEntity={(type, id) => onSelectEntity(type, id, index)}
              onMoveToTile={onMoveToTile}
              selectedEntity={selectedEntity}
            />
          </div>
        );
      })}
    </div>
  );
};