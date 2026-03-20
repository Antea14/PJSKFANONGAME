import React from 'react';
import { TileState, CharacterPiece, TowerData } from '../types';
import { CharacterPawn } from './CharacterPawn';

interface TileProps {
  state: TileState;
  index: number;
  onSelectEntity: (type: 'piece' | 'tower', id: string) => void;
  onMoveToTile: (tileIndex: number) => void;
  selectedEntity: { type: 'piece' | 'tower'; id: string; fromTile: number } | null;
}

export const Tile: React.FC<TileProps> = ({ 
  state, 
  index, 
  onSelectEntity, 
  onMoveToTile,
  selectedEntity 
}) => {
  const isTerminal = state.type === 'terminal';
  const towerStack = state.towers;

  const handleTileClick = (e: React.MouseEvent) => {
    // 只有在没有选中实体时，点击格子背景才可能有其他逻辑（如查看详情）
    // 这里的 onClick 主要作为兜底
    if (selectedEntity) {
      onMoveToTile(index);
    }
  };

  const handlePlaceButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发底层的 handleTileClick
    if (selectedEntity) {
      onMoveToTile(index);
    }
  };

  return (
    <div 
      onClick={handleTileClick}
      className={`
        w-28 h-28 border-4 border-black relative flex items-center justify-center group
        ${isTerminal ? 'bg-yellow-300 shadow-[inset_-4px_-4px_0_0_#d97706]' : 'bg-[#ceded4] hover:bg-[#bdcfc4] shadow-[inset_-4px_-4px_0_0_#a8bcae]'}
        ${selectedEntity ? 'ring-4 ring-blue-500 ring-inset cursor-crosshair scale-105' : 'cursor-pointer'}
        pixel-shadow transition-all duration-200
      `}
    >
      {/* 装饰性细节 */}
      <div className="absolute top-1 left-1 w-1 h-1 bg-black/10"></div>
      <div className="absolute top-1 right-1 w-1 h-1 bg-black/10"></div>
      <div className="absolute bottom-1 left-1 w-1 h-1 bg-black/10"></div>
      <div className="absolute bottom-1 right-1 w-1 h-1 bg-black/10"></div>

      {/* 格子标签 - 始终位于上层但层级低于放置按钮 */}
      <span className="absolute -top-3 -left-3 bg-black text-white text-[9px] px-2 py-0.5 font-bold z-40 pixel-border uppercase">
        {`${index}号回廊`}
      </span>

      {/* 舞台混乱指示器 */}
      {(state.groundPieces.length > 0 && towerStack.length > 0) && (
        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-6 h-6 flex items-center justify-center border-2 border-black z-40 font-black animate-pulse shadow-lg">
          !
          <div className="absolute -bottom-8 right-0 bg-black text-[8px] whitespace-nowrap px-1 hidden group-hover:block">舞台混乱: {state.groundPieces.length}人</div>
        </div>
      )}

      {/* 终端舞台标识 */}
      {isTerminal && (
        <div className="text-center z-0 pointer-events-none opacity-40">
          <div className="text-4xl">🏁</div>
        </div>
      )}

      {/* 棋子与塔的渲染区域 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* 地面棋子 */}
        <div 
          className="flex flex-wrap gap-0.5 justify-center items-center z-10 transition-opacity"
          style={{ opacity: towerStack.length > 0 ? 0.3 : 1 }}
        >
          {state.groundPieces.map(piece => (
            <CharacterPawn 
              key={piece.id} 
              type={piece.type} 
              isSelected={selectedEntity?.id === piece.id}
              size="sm"
              onClick={(e) => { e.stopPropagation(); onSelectEntity('piece', piece.id); }}
            />
          ))}
        </div>

        {/* 巡演塔 */}
        {towerStack.map((tower, tIdx) => {
          const isSelected = selectedEntity?.id === tower.id;
          const isTerminalTower = tower.id === 'tower-terminal';
          
          return (
            <div 
              key={tower.id}
              onClick={(e) => { e.stopPropagation(); onSelectEntity('tower', tower.id); }}
              className={`
                absolute w-24 h-28 border-4 transition-all flex flex-col items-center justify-start p-1
                ${isTerminalTower ? 'border-yellow-600 bg-yellow-100' : 'border-black bg-[#e0f2fe]'}
                ${isSelected 
                  ? 'ring-[16px] ring-blue-500 ring-opacity-80 shadow-[0_0_50px_rgba(59,130,246,1)] outline outline-8 outline-white z-50' 
                  : 'shadow-md'}
                ${tIdx < towerStack.length - 1 && !isSelected ? 'opacity-60 grayscale-[0.3]' : ''}
                cursor-pointer
              `}
              style={{ 
                transform: `translateY(${-6 - (tIdx * 12)}px)`,
                zIndex: 20 + tIdx
              }}
            >
              <div className={`w-full border-b-2 flex justify-between px-1 mb-1 ${isSelected ? 'border-blue-500' : 'border-black/10'}`}>
                <span className={`text-[7px] font-black ${isSelected ? 'text-blue-700' : 'opacity-60'}`}>
                  {isTerminalTower ? 'TERMINAL STAGE' : (isSelected ? 'SELECTED TOWER' : 'TOWER')}
                </span>
                {isTerminalTower && <span className="text-[7px]">👑</span>}
              </div>
              
              <div className="flex flex-wrap gap-0.5 justify-center items-center">
                {tower.pieces.map(piece => (
                  <CharacterPawn 
                    key={piece.id} 
                    type={piece.type} 
                    isSelected={selectedEntity?.id === piece.id}
                    size={tower.pieces.length > 2 ? 'sm' : 'md'}
                    onClick={(e) => { e.stopPropagation(); onSelectEntity('piece', piece.id); }}
                  />
                ))}
              </div>
              {isSelected && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[8px] font-black px-2 py-1 border-2 border-black whitespace-nowrap animate-bounce z-[110] pixel-shadow-sm">
                  已选中{isTerminalTower ? '终端舞台' : '巡演塔'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 改进后的交互层 - 放置按钮 */}
      <div className={`
        absolute inset-0 flex items-end justify-center pb-2 z-[60] transition-opacity
        ${selectedEntity ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100'}
      `}>
        {selectedEntity ? (
          <button 
            onClick={handlePlaceButtonClick}
            className={`
              text-[9px] font-black px-3 py-1 border-2 border-black uppercase tracking-tighter shadow-md
              transition-all transform hover:scale-110 active:scale-95 animate-bounce-subtle
              ${selectedEntity.fromTile === index ? 'bg-red-400 text-white' : 'bg-green-400 text-black'}
            `}
          >
            {selectedEntity.fromTile === index ? '取消选择' : '在此放置'}
          </button>
        ) : (
          <span className="text-[8px] font-black bg-white/95 px-2 border-2 border-black uppercase tracking-tighter shadow-md">
            查看详情
          </span>
        )}
      </div>

      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};