import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Peer } from 'peerjs';
import { Board } from './components/Board.tsx';
import { DiceRoller } from './components/DiceRoller.tsx';
import { PlayerPanel } from './components/PlayerPanel.tsx';
import { EventDeck } from './components/EventDeck.tsx';
import { CHARACTERS, INITIAL_EVENTS, TILE_COUNT } from './constants.tsx';
import { GameState, CharacterType, TileState, PlayerState, CharacterPiece, EventCard, SyncMessage } from './types.ts';

// 帮助页面配置
const HELP_PAGES = [
  {
    title: '行动流程',
    icon: '📋',
    content: (
      <ul className="space-y-2">
        <li><span className="font-black text-blue-600">1. 掷骰子：</span>点数 1-4 前进对应格数；5-6 抽一张事件卡。</li>
        <li><span className="font-black text-blue-600">2. 移动/技能：</span>可选择移动棋子或整座「巡演塔」。消耗电池可发动角色专属技能。</li>
        <li><span className="font-black text-blue-600">3. 结算：</span>若进入「终端舞台」，可充满电池。</li>
      </ul>
    )
  },
  {
    title: '名词解释',
    icon: '📖',
    content: (
      <ul className="space-y-2">
        <li><span className="font-black text-purple-600">巡演塔：</span>多名角色重叠时形成的塔，可整体移动。</li>
        <li><span className="font-black text-purple-600">舞台混乱：</span>被塔压在下方的棋子处于“混乱”，无法主动移动或发动技能。</li>
        <li><span className="font-black text-purple-600">世界回廊：</span>棋盘路径，连接不同的舞台。</li>
      </ul>
    )
  },
  {
    title: '操作说明',
    icon: '🎮',
    content: (
      <ul className="space-y-2">
        <li><span className="font-black text-green-600">选择：</span>点击棋子或塔边缘。选中的实体会发光。</li>
        <li><span className="font-black text-green-600">放置：</span>选择后点击目的地格子即可移动。</li>
        <li><span className="font-black text-green-600">电池：</span>点击电池图标可手动切换开关（模拟消耗/获得）。</li>
      </ul>
    )
  }
];

const PEER_CONFIG = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
    sdpSemantics: 'unified-plan'
  },
  debug: 1
};

const App: React.FC = () => {
  const [localPlayer, setLocalPlayer] = useState<{name: string, character: CharacterType, id: string} | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connError, setConnError] = useState<string | null>(null);
  const [helpPageIndex, setHelpPageIndex] = useState(0);
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    tiles: [],
    players: [],
    diceResult: null,
    eventDeck: [...INITIAL_EVENTS].sort(() => Math.random() - 0.5),
    activeEvent: null,
    selectedEntity: null,
    currentTurnPlayerId: null,
    gameStarted: false
  });

  const peerRef = useRef<any>(null);
  const connectionsRef = useRef<any[]>([]);
  const isHostRef = useRef(false);

  // 初始化棋盘
  const initBoard = useCallback(() => {
    return Array.from({ length: TILE_COUNT }, (_, i) => {
      const towers: any[] = [];
      // 9 towers counter-clockwise from 0: 15, 14, 13, 12, 11, 10, 9, 8, 7
      const towerIndices = [7, 8, 9, 10, 11, 12, 13, 14, 15];
      if (towerIndices.includes(i)) {
        towers.push({ id: `tower-${i}`, pieces: [] });
      }
      // Terminal Stage is a unique tower starting at index 0
      if (i === 0) {
        towers.push({ id: 'tower-terminal', pieces: [] });
      }

      return {
        id: i,
        type: i === 0 ? 'terminal' : 'corridor',
        towers: towers,
        groundPieces: []
      } as TileState;
    });
  }, []);

  const broadcast = (msg: SyncMessage) => {
    connectionsRef.current.forEach(conn => {
      if (conn.open) conn.send(msg);
    });
  };

  const handlePeerMessage = (msg: SyncMessage) => {
    switch (msg.type) {
      case 'SYNC_FULL_STATE':
        setGameState(msg.state);
        break;
      case 'PLAYER_JOIN':
        if (isHostRef.current) {
          setGameState(prev => {
            const newTiles = JSON.parse(JSON.stringify(prev.tiles)) as TileState[];
            // Initial pieces start on the tower at tile 8 (furthest from tile 0)
            const startTile = newTiles[8];
            const startTower = startTile.towers[0]; // Tile 8 has one tower initially

            if (startTower) {
              for (let i = 0; i < 3; i++) {
                 startTower.pieces.push({ 
                   id: `${msg.player.id}_p${i}`, 
                   type: msg.player.character, 
                   ownerId: msg.player.id 
                 });
              }
            }
            const newState = { 
              ...prev, 
              players: [...prev.players, msg.player],
              tiles: newTiles
            };
            broadcast({ type: 'SYNC_FULL_STATE', state: newState });
            return newState;
          });
        }
        break;
      case 'DICE_ROLL':
        setGameState(prev => ({ ...prev, diceResult: msg.result }));
        if (isHostRef.current) broadcast(msg);
        break;
      case 'MOVE_ENTITY':
        applyMove(msg.selection, msg.toTileIdx);
        if (isHostRef.current) broadcast(msg);
        break;
      case 'UPDATE_BATTERIES':
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => p.id === msg.playerId ? { ...p, batteries: msg.batteries } : p)
        }));
        if (isHostRef.current) broadcast(msg);
        break;
      case 'UPDATE_PIECE_COUNT':
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => p.id === msg.playerId ? { ...p, pieceCount: msg.count } : p),
          tiles: msg.tiles
        }));
        if (isHostRef.current) broadcast(msg);
        break;
      case 'DRAW_EVENT':
        setGameState(prev => ({
          ...prev,
          eventDeck: prev.eventDeck.filter(c => c.id !== msg.card.id),
          players: prev.players.map(p => p.id === msg.playerId ? { ...p, handEvents: [...p.handEvents, msg.card] } : p)
        }));
        if (isHostRef.current) broadcast(msg);
        break;
      case 'USE_EVENT':
        setGameState(prev => {
          const player = prev.players.find(p => p.id === msg.playerId);
          const card = player?.handEvents.find(c => c.id === msg.cardId);
          if (!card) return prev;
          const newState = {
            ...prev,
            eventDeck: [...prev.eventDeck, card].sort(() => Math.random() - 0.5),
            players: prev.players.map(p => p.id === msg.playerId ? { ...p, handEvents: p.handEvents.filter(c => c.id !== msg.cardId) } : p)
          };
          return newState;
        });
        if (isHostRef.current) broadcast(msg);
        break;
    }
  };

  const applyMove = (selection: { type: 'piece' | 'tower'; id: string; fromTile: number }, toTileIdx: number) => {
    setGameState(prev => {
      const newTiles = JSON.parse(JSON.stringify(prev.tiles)) as TileState[];
      const isMovingTerminal = selection.id === 'tower-terminal';
      
      if (selection.fromTile === toTileIdx) {
        return { ...prev, selectedEntity: null };
      }

      const fromTile = newTiles[selection.fromTile];
      const toTile = newTiles[toTileIdx];

      if (selection.type === 'piece') {
        let piece: CharacterPiece | undefined;
        if (fromTile.groundPieces.some(p => p.id === selection.id)) {
          piece = fromTile.groundPieces.find(p => p.id === selection.id);
          fromTile.groundPieces = fromTile.groundPieces.filter(p => p.id !== selection.id);
        } else {
          for (const tower of fromTile.towers) {
            const foundIdx = tower.pieces.findIndex(p => p.id === selection.id);
            if (foundIdx !== -1) {
              piece = tower.pieces.splice(foundIdx, 1)[0];
              break;
            }
          }
        }
        if (piece) {
          if (toTile.towers.length > 0) {
            toTile.towers[toTile.towers.length - 1].pieces.push(piece);
          } else {
            toTile.groundPieces.push(piece);
          }
        }
      } else if (selection.type === 'tower') {
        const towerIdx = fromTile.towers.findIndex(t => t.id === selection.id);
        if (towerIdx !== -1) {
          // Rule: Tower cannot be placed on terminal stage
          const targetHasTerminal = toTile.towers.some(t => t.id === 'tower-terminal');
          
          if (!isMovingTerminal && targetHasTerminal) {
            // Cannot place a regular tower on top of the terminal tower
            return prev;
          }

          const movingTowers = fromTile.towers.splice(towerIdx);
          toTile.towers.push(...movingTowers);
        }
      }
      return { ...prev, tiles: newTiles, selectedEntity: null };
    });
  };

  const setupPeerListeners = (peer: Peer) => {
    peer.on('error', (err: any) => {
      console.error('PeerJS Error:', err.type, err);
      if (err.type === 'server-error' || err.type === 'network') {
        setConnError('信号服务器连接丢失。正在尝试自动重连...');
        setTimeout(() => {
          if (peer.disconnected) peer.reconnect();
        }, 3000);
      } else if (err.type === 'peer-unavailable') {
        setConnError('目标房间不存在或已关闭。');
        setIsConnecting(false);
      } else {
        setConnError(`连接错误: ${err.type}`);
        setIsConnecting(false);
      }
    });

    peer.on('disconnected', () => {
      console.warn('Peer disconnected from signaling server. Attempting reconnect...');
      setConnError('正在恢复与服务器的连接...');
      peer.reconnect();
    });
  };

  const createRoom = (name: string, character: CharacterType) => {
    setIsConnecting(true);
    setConnError(null);
    const peer = new Peer(PEER_CONFIG);
    peerRef.current = peer;
    isHostRef.current = true;

    setupPeerListeners(peer);

    peer.on('open', (id: string) => {
      setRoomId(id);
      const newPlayer: PlayerState = {
        id,
        name,
        character,
        batteries: [true, true, true, false, false],
        handEvents: [],
        isOnline: true,
        isHost: true,
        pieceCount: 3
      };
      
      const initialTiles = initBoard();
      // Initial pieces start on the tower at tile 8 (furthest from tile 0)
      const startTower = initialTiles[8].towers[0];
      if (startTower) {
        for (let i = 0; i < 3; i++) {
          startTower.pieces.push({ id: `${id}_p${i}`, type: character, ownerId: id });
        }
      }
      
      setLocalPlayer({ name, character, id });
      setGameState(prev => ({
        ...prev,
        gameStarted: true,
        tiles: initialTiles,
        players: [newPlayer],
        currentTurnPlayerId: id
      }));
      setIsConnecting(false);
      setConnError(null);
    });

    peer.on('connection', (conn: any) => {
      const remotePeerId = conn.peer;
      connectionsRef.current.push(conn);
      conn.on('data', (data: any) => handlePeerMessage(data as SyncMessage));
      conn.on('close', () => {
        connectionsRef.current = connectionsRef.current.filter(c => c.peer !== remotePeerId);
        setGameState(prev => {
          const updatedPlayers = prev.players.filter(p => p.id !== remotePeerId);
          const updatedTiles = JSON.parse(JSON.stringify(prev.tiles)) as TileState[];
          for (const tile of updatedTiles) {
            tile.groundPieces = tile.groundPieces.filter(p => p.ownerId !== remotePeerId);
            for (const tower of tile.towers) {
              tower.pieces = tower.pieces.filter(p => p.ownerId !== remotePeerId);
            }
          }
          const newState = { ...prev, players: updatedPlayers, tiles: updatedTiles };
          broadcast({ type: 'SYNC_FULL_STATE', state: newState });
          return newState;
        });
      });
      conn.on('open', () => {
        conn.send({ type: 'SYNC_FULL_STATE', state: gameState });
      });
    });
  };

  const joinRoom = (targetId: string, name: string, character: CharacterType) => {
    setIsConnecting(true);
    setConnError(null);
    const peer = new Peer(PEER_CONFIG);
    peerRef.current = peer;
    isHostRef.current = false;

    setupPeerListeners(peer);

    const timeout = setTimeout(() => {
      if (isConnecting && !peerRef.current?.open) {
        setIsConnecting(false);
        setConnError('连接超时。目标房间可能已失效。');
      }
    }, 15000);

    peer.on('open', (id: string) => {
      setLocalPlayer({ name, character, id });
      const conn = peer.connect(targetId, { reliable: true });
      connectionsRef.current = [conn];

      conn.on('open', () => {
        clearTimeout(timeout);
        const newPlayer: PlayerState = {
          id,
          name,
          character,
          batteries: [true, true, true, false, false],
          handEvents: [],
          isOnline: true,
          isHost: false,
          pieceCount: 3
        };
        conn.send({ type: 'PLAYER_JOIN', player: newPlayer });
        setRoomId(targetId);
        setGameState(prev => ({ ...prev, gameStarted: true }));
        setIsConnecting(false);
        setConnError(null);
      });

      conn.on('data', (data: any) => handlePeerMessage(data as SyncMessage));
      conn.on('close', () => {
        alert('与房主的连接已断开。');
        window.location.reload();
      });

      conn.on('error', () => {
        clearTimeout(timeout);
        setIsConnecting(false);
        setConnError('无法建立与房主的连接。');
      });
    });
  };

  const handleRoll = (result: number) => {
    const msg: SyncMessage = { type: 'DICE_ROLL', result };
    if (isHostRef.current) {
      setGameState(prev => ({ ...prev, diceResult: result }));
      broadcast(msg);
    } else {
      if (connectionsRef.current[0]?.open) connectionsRef.current[0].send(msg);
    }
  };

  const moveEntity = (toTileIdx: number) => {
    if (!gameState.selectedEntity) return;
    const selection = gameState.selectedEntity;
    const msg: SyncMessage = { type: 'MOVE_ENTITY', toTileIdx, selection };
    
    if (isHostRef.current) {
      applyMove(selection, toTileIdx);
      broadcast(msg);
    } else {
      if (connectionsRef.current[0]?.open) connectionsRef.current[0].send(msg);
    }
  };

  const drawEvent = () => {
    if (gameState.eventDeck.length === 0) return;
    const card = gameState.eventDeck[gameState.eventDeck.length - 1];
    const playerId = localPlayer!.id;
    const msg: SyncMessage = { type: 'DRAW_EVENT', card, playerId };

    if (isHostRef.current) {
      setGameState(prev => ({
        ...prev,
        eventDeck: prev.eventDeck.slice(0, -1),
        players: prev.players.map(p => p.id === playerId ? { ...p, handEvents: [...p.handEvents, card] } : p)
      }));
      broadcast(msg);
    } else {
      if (connectionsRef.current[0]?.open) connectionsRef.current[0].send(msg);
    }
  };

  const useEvent = (cardId: string) => {
    const playerId = localPlayer!.id;
    const msg: SyncMessage = { type: 'USE_EVENT', cardId, playerId };

    if (isHostRef.current) {
      handlePeerMessage(msg);
      broadcast(msg);
    } else {
      if (connectionsRef.current[0]?.open) connectionsRef.current[0].send(msg);
    }
  };

  const selectEntity = (type: 'piece' | 'tower', id: string, fromTile: number) => {
    if (type === 'piece') {
      const piece = [...gameState.tiles[fromTile].groundPieces, ...gameState.tiles[fromTile].towers.flatMap(t => t.pieces)]
        .find(p => p.id === id);
      if (piece?.ownerId !== localPlayer?.id) return;
    }
    setGameState(prev => ({
      ...prev,
      selectedEntity: (prev.selectedEntity?.id === id) ? null : { type, id, fromTile }
    }));
  };

  const toggleBattery = (playerId: string, index: number) => {
    if (playerId !== localPlayer?.id) return;
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    
    const newBatteries = [...player.batteries];
    newBatteries[index] = !newBatteries[index];
    const msg: SyncMessage = { type: 'UPDATE_BATTERIES', playerId, batteries: newBatteries };

    if (isHostRef.current) {
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === playerId ? { ...p, batteries: newBatteries } : p)
      }));
      broadcast(msg);
    } else {
      if (connectionsRef.current[0]?.open) connectionsRef.current[0].send(msg);
    }
  };

  const expandBatterySlot = () => {
    const playerId = localPlayer?.id;
    if (!playerId) return;
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    
    const newBatteries = [...player.batteries, false];
    const msg: SyncMessage = { type: 'UPDATE_BATTERIES', playerId, batteries: newBatteries };

    if (isHostRef.current) {
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === playerId ? { ...p, batteries: newBatteries } : p)
      }));
      broadcast(msg);
    } else {
      if (connectionsRef.current[0]?.open) connectionsRef.current[0].send(msg);
    }
  };

  const shrinkBatterySlot = () => {
    const playerId = localPlayer?.id;
    if (!playerId) return;
    const player = gameState.players.find(p => p.id === playerId);
    if (!player || player.batteries.length <= 1) return;
    
    const newBatteries = player.batteries.slice(0, -1);
    const msg: SyncMessage = { type: 'UPDATE_BATTERIES', playerId, batteries: newBatteries };

    if (isHostRef.current) {
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === playerId ? { ...p, batteries: newBatteries } : p)
      }));
      broadcast(msg);
    } else {
      if (connectionsRef.current[0]?.open) connectionsRef.current[0].send(msg);
    }
  };

  const changePieceCount = (delta: number) => {
    const playerId = localPlayer?.id;
    if (!playerId) return;
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;

    const newCount = Math.max(0, player.pieceCount + delta);
    if (newCount === player.pieceCount) return;

    setGameState(prev => {
      const newTiles = JSON.parse(JSON.stringify(prev.tiles)) as TileState[];
      if (delta > 0) {
        // New pieces also start at the initial start point (tile 8 tower)
        const startTile = newTiles[8];
        const startTower = startTile.towers[0];
        if (startTower) {
          startTower.pieces.push({ 
            id: `${playerId}_p${Date.now()}`, 
            type: player.character, 
            ownerId: playerId 
          });
        }
      } else {
        let found = false;
        for (const tile of newTiles) {
          const groundIdx = tile.groundPieces.findIndex(p => p.ownerId === playerId);
          if (groundIdx !== -1) {
            tile.groundPieces.splice(groundIdx, 1);
            found = true;
            break;
          }
          for (const tower of tile.towers) {
            const pieceIdx = tower.pieces.findIndex(p => p.ownerId === playerId);
            if (pieceIdx !== -1) {
              tower.pieces.splice(pieceIdx, 1);
              found = true;
              break;
            }
          }
          if (found) break;
        }
      }

      const msg: SyncMessage = { type: 'UPDATE_PIECE_COUNT', playerId, count: newCount, tiles: newTiles };
      if (isHostRef.current) {
        broadcast(msg);
      } else {
        if (connectionsRef.current[0]?.open) connectionsRef.current[0].send(msg);
      }

      return {
        ...prev,
        players: prev.players.map(p => p.id === playerId ? { ...p, pieceCount: newCount } : p),
        tiles: newTiles
      };
    });
  };

  if (!localPlayer || !gameState.gameStarted) {
    return (
      <div className="h-screen w-screen bg-[#1a1a1a] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border-8 border-black pixel-shadow p-8 flex flex-col gap-6 scale-90 sm:scale-100">
          <div className="text-center">
            <h1 className="text-5xl font-black italic tracking-tighter mb-2 text-black">巡回舞台</h1>
            <p className="text-xs font-bold opacity-40 uppercase tracking-[0.2em] text-black">Remote Multiplayer</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase mb-1 block text-black">昵称</label>
              <input id="nick" autoComplete="off" defaultValue="玩家" className="w-full border-4 border-black p-3 font-bold outline-none text-black" />
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase mb-2 block text-black">选择角色</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(CHARACTERS).map(char => (
                  <button key={char.id} onClick={() => {
                    const nick = (document.getElementById('nick') as HTMLInputElement).value;
                    const joinId = (document.getElementById('target-id') as HTMLInputElement).value;
                    if (joinId) joinRoom(joinId, nick, char.id);
                    else createRoom(nick, char.id);
                  }} className="aspect-square border-4 border-black flex flex-col items-center justify-center p-2 hover:bg-yellow-50 active:scale-95 transition-all" style={{ backgroundColor: char.color }}>
                    <span className="text-2xl">{char.avatar}</span>
                    <span className="text-[9px] font-black mt-1 leading-tight text-black">{char.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t-4 border-black">
              <label className="text-[10px] font-black uppercase mb-1 block text-blue-600">加入房间</label>
              <input id="target-id" placeholder="输入 Room ID..." className="w-full border-4 border-black p-2 text-xs font-mono text-black" />
            </div>
          </div>

          {(isConnecting || connError?.includes('重连')) && (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-full bg-gray-200 h-1"><div className="bg-blue-600 h-full animate-[loading_2s_ease-in-out_infinite]"></div></div>
              <div className="text-center animate-pulse text-xs font-black text-black">{connError || '正在穿越回廊...'}</div>
            </div>
          )}

          {connError && !connError.includes('重连') && (
            <div className="bg-red-50 border-4 border-red-500 p-3 text-red-600 text-[10px] font-bold">
              <p>⚠️ {connError}</p>
              <button onClick={() => setConnError(null)} className="underline mt-1">重试</button>
            </div>
          )}
        </div>
        <style>{`@keyframes loading { 0% { width: 0%; margin-left: 0%; } 50% { width: 50%; margin-left: 25%; } 100% { width: 0%; margin-left: 100%; } }`}</style>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#f3f6f9] flex overflow-hidden select-none">
      <div className="w-64 md:w-80 lg:w-96 shrink-0 bg-white border-r-8 border-black p-4 md:p-5 flex flex-col gap-4 md:gap-6 overflow-y-auto z-20 shadow-[8px_0_0_0_rgba(0,0,0,0.1)] relative">
        <div className="text-center border-b-8 border-black pb-4">
          <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter text-black">巡回舞台</h1>
          {connError && (
             <div className="bg-red-100 text-red-600 text-[8px] font-bold px-1 py-0.5 mt-1 border border-red-300">
               {connError}
             </div>
          )}
          <div className="mt-2 flex flex-col items-center gap-1">
             <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full animate-pulse ${connError ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <p className="text-[8px] font-bold opacity-30 uppercase tracking-widest text-black">Room ID: <span className="text-black select-all">{roomId}</span></p>
             </div>
          </div>
        </div>
        
        <DiceRoller onRoll={handleRoll} result={gameState.diceResult} />
        
        <div className="flex flex-col gap-4">
          {gameState.players.map(player => (
            <PlayerPanel 
              key={player.id} 
              player={player} 
              isMe={player.id === localPlayer.id}
              onToggleBattery={(idx) => toggleBattery(player.id, idx)} 
              onChangePieceCount={(delta) => changePieceCount(delta)}
              onExpandBattery={expandBatterySlot}
              onShrinkBattery={shrinkBatterySlot}
              onSwitchCharacter={() => {}} 
            />
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 bg-gray-100 p-3 border-4 border-black pixel-shadow">
          <h4 className="text-[10px] font-black uppercase opacity-40 text-black">手牌 (Event Cards)</h4>
          <div className="flex flex-wrap gap-2">
            {gameState.players.find(p => p.id === localPlayer.id)?.handEvents.map(card => (
              <div key={card.id} onClick={() => setGameState(prev => ({ ...prev, activeEvent: card }))}
                className="w-10 h-14 bg-indigo-500 border-2 border-black flex items-center justify-center text-white font-bold cursor-pointer hover:-translate-y-1 transition-transform active:scale-95 pixel-shadow-sm"
              >{card.isTeamEvent ? '👥' : '✨'}</div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t-8 border-black">
          <button onClick={() => window.location.reload()} className="w-full bg-red-400 hover:bg-red-500 text-white border-4 border-black py-2 font-black transition-all active:translate-y-1 pixel-shadow">退出</button>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4 md:p-8 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]">
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        <Board tiles={gameState.tiles} onSelectEntity={selectEntity} onMoveToTile={moveEntity} selectedEntity={gameState.selectedEntity} />

        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-30 flex flex-col items-end gap-4 md:gap-6">
          <EventDeck 
            activeEvent={gameState.activeEvent} 
            onDraw={drawEvent} 
            deckCount={gameState.eventDeck.length} 
            onClose={() => setGameState(prev => ({...prev, activeEvent: null}))}
            onUse={() => {
              if (gameState.activeEvent) {
                useEvent(gameState.activeEvent.id);
                setGameState(prev => ({ ...prev, activeEvent: null }));
              }
            }}
          />
        </div>

        <div 
          className={`absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-white border-4 border-black pixel-shadow z-30 flex flex-col overflow-hidden transition-all duration-300 ease-in-out shadow-2xl ${isHelpExpanded ? 'w-64 md:w-72 max-h-[40vh] md:max-h-96 p-3 md:p-4' : 'w-32 md:w-40 h-10 md:h-12 p-0'}`}
        >
          {!isHelpExpanded ? (
            <button 
              onClick={() => setIsHelpExpanded(true)}
              className="w-full h-full flex items-center justify-between px-3 hover:bg-gray-50 transition-colors"
            >
              <span className="text-[10px] font-black uppercase tracking-tighter">游戏说明</span>
              <span className="text-xs">📖</span>
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2 border-b-2 border-black pb-1 shrink-0">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setHelpPageIndex((helpPageIndex + 1) % HELP_PAGES.length)}>
                  <span className="text-lg md:text-xl">{HELP_PAGES[helpPageIndex].icon}</span>
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-tight text-black">{HELP_PAGES[helpPageIndex].title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {HELP_PAGES.map((_, i) => (
                      <div key={i} className={`w-1 h-1 md:w-1.5 md:h-1.5 border border-black ${i === helpPageIndex ? 'bg-black' : 'bg-gray-200'}`}></div>
                    ))}
                  </div>
                  <button onClick={() => setIsHelpExpanded(false)} className="text-xs font-black hover:scale-110">✕</button>
                </div>
              </div>
              <div className="overflow-y-auto pr-1 custom-scrollbar text-[9px] md:text-[11px] leading-relaxed font-medium text-black flex-1">
                 {HELP_PAGES[helpPageIndex].content}
                 <p className="mt-2 text-[8px] font-black opacity-30 text-center uppercase animate-pulse cursor-pointer" onClick={() => setHelpPageIndex((helpPageIndex + 1) % HELP_PAGES.length)}>点击切换内容</p>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #000; border-radius: 2px; }
      `}</style>
    </div>
  );
};

export default App;