/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileData, TileType, GRID_SIZE } from '../types';

export const generateId = () => `${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;

export const createInitialBoard = (): TileData[][] => {
  const board: TileData[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    board[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let type: TileType;
      // Ensure no initial matches
      do {
        type = Math.floor(Math.random() * 7) as TileType;
      } while (
        (r >= 2 && board[r - 1][c].type === type && board[r - 2][c].type === type) ||
        (c >= 2 && board[r][c - 1].type === type && board[r][c - 2].type === type)
      );
      board[r][c] = {
        id: generateId(),
        type,
        position: { row: r, col: c },
      };
    }
  }
  return board;
};

export const checkMatches = (board: TileData[][]): { row: number; col: number }[][] => {
  const matchGroups: { row: number; col: number }[][] = [];
  
  const tempGroups: Set<string>[] = [];

  // 1. Check rows
  for (let r = 0; r < GRID_SIZE; r++) {
    let matchCount = 1;
    for (let c = 1; c <= GRID_SIZE; c++) {
      if (c < GRID_SIZE && board[r][c].type === board[r][c - 1].type && board[r][c].type < 7) {
        matchCount++;
      } else {
        if (matchCount >= 3) {
          const group = new Set<string>();
          for (let k = 1; k <= matchCount; k++) {
            group.add(`${r},${c - k}`);
          }
          tempGroups.push(group);
        }
        matchCount = 1;
      }
    }
  }

  // 2. Check columns
  for (let c = 0; c < GRID_SIZE; c++) {
    let matchCount = 1;
    for (let r = 1; r <= GRID_SIZE; r++) {
      if (r < GRID_SIZE && board[r][c].type === board[r - 1][c].type && board[r][c].type < 7) {
        matchCount++;
      } else {
        if (matchCount >= 3) {
          const group = new Set<string>();
          for (let k = 1; k <= matchCount; k++) {
            group.add(`${r - k},${c}`);
          }
          tempGroups.push(group);
        }
        matchCount = 1;
      }
    }
  }

  // 3. Check 2x2 squares (Yonca)
  for (let r = 0; r < GRID_SIZE - 1; r++) {
    for (let c = 0; c < GRID_SIZE - 1; c++) {
      const type = board[r][c].type;
      if (type < 7 &&
          board[r][c+1].type === type &&
          board[r+1][c].type === type &&
          board[r+1][c+1].type === type) {
        const group = new Set<string>();
        group.add(`${r},${c}`);
        group.add(`${r},${c+1}`);
        group.add(`${r+1},${c}`);
        group.add(`${r+1},${c+1}`);
        tempGroups.push(group);
      }
    }
  }

  // Merge intersecting groups
  const mergedGroups: Set<string>[] = [];
  while (tempGroups.length > 0) {
    let current = tempGroups.shift()!;
    let merged = true;
    while (merged) {
      merged = false;
      for (let i = 0; i < tempGroups.length; i++) {
        let hasIntersection = false;
        for (const item of tempGroups[i]) {
          if (current.has(item)) {
            hasIntersection = true;
            break;
          }
        }
        if (hasIntersection) {
          for (const item of tempGroups[i]) {
            current.add(item);
          }
          tempGroups.splice(i, 1);
          i--;
          merged = true;
        }
      }
    }
    mergedGroups.push(current);
  }

  return mergedGroups.map(group => 
    Array.from(group).map(s => {
      const [r, c] = s.split(',').map(Number);
      return { row: r, col: c };
    })
  );
};

export const getExplosionArea = (row: number, col: number): { row: number; col: number }[] => {
  const area: { row: number; col: number }[] = [];
  // Row clear behavior for Starfish
  for (let c = 0; c < GRID_SIZE; c++) {
    area.push({ row, col: c });
  }
  return area;
};

export const isAdjacent = (pos1: { row: number; col: number }, pos2: { row: number; col: number }) => {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
};

export const findPossibleMoves = (board: TileData[][]): { row: number; col: number }[] | null => {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      // Check horizontal swap
      if (c < GRID_SIZE - 1) {
        // Swap
        const temp = board[r][c].type;
        board[r][c].type = board[r][c+1].type;
        board[r][c+1].type = temp as any;
        
        const matches = checkMatches(board);
        
        // Swap back
        board[r][c+1].type = board[r][c].type;
        board[r][c].type = temp as any;

        if (matches.length > 0) {
          return [{ row: r, col: c }, { row: r, col: c + 1 }];
        }
      }

      // Check vertical swap
      if (r < GRID_SIZE - 1) {
        // Swap
        const temp = board[r][c].type;
        board[r][c].type = board[r+1][c].type;
        board[r+1][c].type = temp as any;
        
        const matches = checkMatches(board);
        
        // Swap back
        board[r+1][c].type = board[r][c].type;
        board[r][c].type = temp as any;

        if (matches.length > 0) {
          return [{ row: r, col: c }, { row: r + 1, col: c }];
        }
      }

      // Special case: Boosters are always move suggestions if adjacent to something
      if (board[r][c].type >= 7) {
        // Find any adjacent tile
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dr, dc] of directions) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
             return [{ row: r, col: c }, { row: nr, col: nc }];
          }
        }
      }
    }
  }
  return null;
};
