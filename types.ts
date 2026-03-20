export enum CharacterType {
  Knd = 'Knd',
  Mfy = 'Mfy',
  Ena = 'Ena',
  Mzk = 'Mzk',
  Miku = 'Miku',
  Kaito = 'Kaito'
}

export interface CharacterData {
  id: CharacterType;
  name: string;
  displayName: string;
  color: string;
  positiveBuff: string;
  negativeBuff: string;
  skill: string;
  cost: string;
  avatar: string;
}

export interface CharacterPiece {
  id: string;
  type: CharacterType;
  ownerId: string;
}

export interface TowerData {
  id: string;
  pieces: CharacterPiece[];
}

export interface TileState {
  id: number;
  type: 'corridor' | 'terminal';
  towers: TowerData[];
  groundPieces: CharacterPiece[];
}

export interface PlayerState {
  id: string;
  name: string;
  character: CharacterType;
  batteries: boolean[];
  handEvents: EventCard[];
  isOnline: boolean;
  isHost: boolean;
  pieceCount: number; // New field
}

export interface GameState {
  tiles: TileState[];
  players: PlayerState[];
  diceResult: number | null;
  eventDeck: EventCard[];
  activeEvent: EventCard | null;
  selectedEntity: { type: 'piece' | 'tower'; id: string; fromTile: number } | null;
  currentTurnPlayerId: string | null;
  gameStarted: boolean;
}

export interface EventCard {
  id: string;
  title: string;
  description: string;
  isTeamEvent?: boolean;
}

export type SyncMessage = 
  | { type: 'PLAYER_JOIN'; player: PlayerState }
  | { type: 'SYNC_FULL_STATE'; state: GameState }
  | { type: 'DICE_ROLL'; result: number }
  | { type: 'MOVE_ENTITY'; toTileIdx: number; selection: { type: 'piece' | 'tower'; id: string; fromTile: number } }
  | { type: 'UPDATE_BATTERIES'; playerId: string; batteries: boolean[] }
  | { type: 'UPDATE_PIECE_COUNT'; playerId: string; count: number; tiles: TileState[] } // New message
  | { type: 'DRAW_EVENT'; card: EventCard; playerId: string }
  | { type: 'USE_EVENT'; cardId: string; playerId: string }
  | { type: 'REQUEST_SYNC' };