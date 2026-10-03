/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TileType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // 7 is Starfish, 8 is Vortex

export interface Position {
  row: number;
  col: number;
}

export interface TileData {
  id: string;
  type: TileType;
  position: Position;
  isSpecial?: boolean;
}

export type GameStatus = 'START' | 'PLAYING' | 'LEVEL_WIN' | 'GAME_OVER' | 'LEVEL_SELECT';

export interface LevelProgress {
  levelId: number;
  stars: number;
  unlocked: boolean;
}

export interface LevelGoal {
  type: 'SCORE' | 'COLLECT';
  target: number;
  creatureType?: TileType; // For COLLECT type
  creaturesToCollect?: { type: TileType; count: number }[]; // Multiple types
}

export interface LevelData {
  id: number;
  moves: number;
  goal: LevelGoal;
}

export type BoosterType = 'EXTRA_MOVES' | 'SHUFFLE' | 'SPAWN_STARFISH';

export interface LeaderboardEntry {
  name: string;
  score: number;
  level: number;
  date: string;
}

export interface Friend {
  id: string;
  code: string;
  name: string;
  avatar: string;
  level: number;
  stars: number;
  status: 'online' | 'offline';
  lastSeen?: string;
  giftSentToday?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string; // 'me' | friendId | 'system'
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  channel: 'global' | string; // 'global' or friend.id for direct message
  sticker?: string;
}

export interface PlayerProfile {
  name: string;
  code: string;
  avatar: string;
}

export const CREATURES = [
  {
    id: 0,
    name: 'Palyaço Balığı',
    src: '/images/orange_fish_icon_1790346857071.jpg',
  },
  {
    id: 1,
    name: 'Ahtapot',
    src: '/images/octopus_icon_1790346759295.jpg',
  },
  {
    id: 2,
    name: 'Deniz Atı',
    src: '/images/seahorse_icon_1790346771053.jpg',
  },
  {
    id: 3,
    name: 'Deniz Anası',
    src: '/images/jellyfish_icon_1790346781708.jpg',
  },
  {
    id: 4,
    name: 'Yunus',
    src: '/images/dolphin_icon_1790346790911.jpg',
  },
  {
    id: 5,
    name: 'Fok',
    src: '/images/seal_icon_1790346800472.jpg',
  },
  {
    id: 6,
    name: 'Penguen',
    src: '/images/penguin_icon_1790346810405.jpg',
  },
  {
    id: 7,
    name: 'Deniz Yıldızı',
    src: '/images/starfish_booster_icon_1790347162068.jpg',
  },
  {
    id: 8,
    name: 'Girdap',
    src: 'VORTEX_ICON', // Marker for special rendering in Tile.tsx
  },
];

export const GRID_SIZE = 8;
export const MATCH_MIN = 3;
