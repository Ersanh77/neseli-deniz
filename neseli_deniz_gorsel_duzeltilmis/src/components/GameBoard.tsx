/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { TileData, GRID_SIZE, TileType } from '../types';
import { createInitialBoard, checkMatches, isAdjacent, generateId, getExplosionArea, findPossibleMoves } from '../utils/gameLogic';
import Tile, { SwipeDirection } from './Tile';
import { motion, AnimatePresence } from 'motion/react';
import Particles from './Particles';
import { SFX } from '../hooks/useSound';
import BoardAtmosphere from './BoardAtmosphere';

interface GameBoardProps {
  onScoreUpdate: (points: number, comboMultiplier: number, matchedTypes: TileType[]) => void;
  onComboUpdate: (combo: number) => void;
  onMoveConsume: () => void;
  isPaused: boolean;
  onPlaySFX: (url: string) => void;
}

export interface GameBoardRef {
  shuffle: () => void;
  spawnStarfish: () => void;
}

interface ParticleBurst {
  id: string;
  row: number;
  col: number;
  color: string;
}

const TILE_COLORS: Record<number, string> = {
  0: '#fb923c', // orange-400
  1: '#a855f7', // purple-500
  2: '#3b82f6', // blue-500
  3: '#ec4899', // pink-500
  4: '#14b8a6', // teal-500
  5: '#94a3b8', // slate-400
  6: '#475569', // slate-600
  7: '#facc15', // yellow-400
  8: '#6366f1', // indigo-500
};

const GameBoard = forwardRef<GameBoardRef, GameBoardProps>(({ onScoreUpdate, onComboUpdate, onMoveConsume, isPaused, onPlaySFX }, ref) => {
  const [board, setBoard] = useState<TileData[][]>([]);
  const [selectedTile, setSelectedTile] = useState<TileData | null>(null);
  const [matchingTiles, setMatchingTiles] = useState<{ row: number; col: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [activeParticles, setActiveParticles] = useState<ParticleBurst[]>([]);
  const [hintTiles, setHintTiles] = useState<{ row: number; col: number }[] | null>(null);
  const [lastActionTime, setLastActionTime] = useState(Date.now());

  useEffect(() => {
    setBoard(createInitialBoard());
  }, []);

  // Hint timer
  useEffect(() => {
    if (isProcessing || isPaused) {
      setHintTiles(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActionTime >= 5000 && !hintTiles) {
        const moves = findPossibleMoves(board);
        if (moves) {
          setHintTiles(moves);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastActionTime, isProcessing, isPaused, board, hintTiles]);

  const resetHint = useCallback(() => {
    setLastActionTime(Date.now());
    setHintTiles(null);
  }, []);

  useImperativeHandle(ref, () => ({
    shuffle: () => {
      if (isProcessing || isPaused) return;
      setBoard(createInitialBoard());
      resetHint();
    },
    spawnStarfish: () => {
      if (isProcessing || isPaused) return;
      const r = Math.floor(Math.random() * GRID_SIZE);
      const c = Math.floor(Math.random() * GRID_SIZE);
      const newBoard = [...board.map(row => [...row])];
      newBoard[r][c] = {
        id: generateId(),
        type: 7,
        position: { row: r, col: c },
        isSpecial: true
      };
      setBoard(newBoard);
      resetHint();
    }
  }));

  const handleTileSelect = (tile: TileData) => {
    if (isProcessing || isPaused) return;
    resetHint();

    if (!selectedTile) {
      setSelectedTile(tile);
    } else {
      if (isAdjacent(selectedTile.position, tile.position)) {
        swapTiles(selectedTile, tile);
      } else {
        setSelectedTile(tile);
      }
    }
  };

  const handleTileSwipe = (tile: TileData, direction: SwipeDirection) => {
    if (isProcessing || isPaused) return;
    resetHint();

    const { row, col } = tile.position;
    let targetRow = row;
    let targetCol = col;

    if (direction === 'UP') targetRow--;
    else if (direction === 'DOWN') targetRow++;
    else if (direction === 'LEFT') targetCol--;
    else if (direction === 'RIGHT') targetCol++;

    if (targetRow >= 0 && targetRow < GRID_SIZE && targetCol >= 0 && targetCol < GRID_SIZE) {
      const targetTile = board[targetRow]?.[targetCol];
      if (targetTile) {
        setSelectedTile(null);
        swapTiles(tile, targetTile);
      }
    }
  };

  // Keyboard navigation for PC / desktop players
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isProcessing || isPaused) return;

      if (e.key === 'Escape') {
        setSelectedTile(null);
        return;
      }

      if (selectedTile) {
        let direction: SwipeDirection | null = null;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') direction = 'UP';
        else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') direction = 'DOWN';
        else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') direction = 'LEFT';
        else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') direction = 'RIGHT';

        if (direction) {
          e.preventDefault();
          handleTileSwipe(selectedTile, direction);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTile, isProcessing, isPaused, board]);

  const swapTiles = async (tile1: TileData, tile2: TileData) => {
    setIsProcessing(true);
    setComboCount(1); // Start combo on swap
    const newBoard = [...board.map(row => [...row])];
    
    // Check if either is a Booster
    const isStarfish1 = tile1.type === 7;
    const isStarfish2 = tile2.type === 7;
    const isVortex1 = tile1.type === 8;
    const isVortex2 = tile2.type === 8;

    if (isStarfish1 || isStarfish2 || isVortex1 || isVortex2) {
      onPlaySFX(SFX.BOOSTER_ACTIVATE);
    }

    if (isVortex1 || isVortex2) {
      const vortexTile = isVortex1 ? tile1 : tile2;
      const targetTile = isVortex1 ? tile2 : tile1;
      
      const area: { row: number; col: number }[] = [];
      
      if (targetTile.type < 7) {
        // Destroy all creatures of target type
        const typeToDestroy = targetTile.type;
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (newBoard[r][c].type === typeToDestroy) {
              area.push({ row: r, col: c });
            }
          }
        }
      } else {
        // Swapped with another booster (7 or 8) -> Super Blast
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            area.push({ row: r, col: c });
          }
        }
      }
      
      area.push(vortexTile.position); // Always destroy the vortex itself
      
      onMoveConsume();
      await processMatches(newBoard, [area], 1, vortexTile.position, true);
      setSelectedTile(null);
      return;
    }

    if (isStarfish1 || isStarfish2) {
      // Swapping starfish with another booster
      if (isStarfish1 && isStarfish2) {
        // Two starfish -> Bigger explosion
        const area1 = getExplosionArea(tile1.position.row, tile1.position.col);
        const area2 = getExplosionArea(tile2.position.row, tile2.position.col);
        const combinedArea = Array.from(new Set([...area1, ...area2].map(p => `${p.row},${p.col}`)))
          .map(s => {
            const [row, col] = s.split(',').map(Number);
            return { row, col };
          });
        onMoveConsume();
        await processMatches(newBoard, [combinedArea], 1, tile1.position, true);
      } else {
        // Normal starfish swap
        const starfishPos = isStarfish1 ? tile1.position : tile2.position;
        const area = getExplosionArea(starfishPos.row, starfishPos.col);
        onMoveConsume();
        await processMatches(newBoard, [area], 1, starfishPos, true);
      }
      setSelectedTile(null);
      return;
    }

    // Normal swap
    const tempType = tile1.type;
    const tempId = tile1.id;
    const tempIsSpecial = tile1.isSpecial;
    
    newBoard[tile1.position.row][tile1.position.col] = {
      ...tile1,
      type: tile2.type,
      id: tile2.id,
      isSpecial: tile2.isSpecial
    };
    newBoard[tile2.position.row][tile2.position.col] = {
      ...tile2,
      type: tempType,
      id: tempId,
      isSpecial: tempIsSpecial
    };

    setBoard(newBoard);
    setSelectedTile(null);

    const matches = checkMatches(newBoard);
    if (matches.length > 0) {
      onMoveConsume(); // Consume move for successful match
      await processMatches(newBoard, matches, 1, tile2.position);
    } else {
      setTimeout(() => {
        const revertBoard = [...board.map(row => [...row])];
        revertBoard[tile1.position.row][tile1.position.col] = tile1;
        revertBoard[tile2.position.row][tile2.position.col] = tile2;
        setBoard(revertBoard);
        setIsProcessing(false);
        setComboCount(0);
      }, 300);
    }
  };

  const processMatches = async (
    currentBoard: TileData[][], 
    matchGroups: { row: number; col: number }[][],
    currentCombo: number,
    spawnPos?: { row: number; col: number },
    skipBoosterSpawn: boolean = false
  ) => {
    const allMatches = new Set<string>();
    const boostersToSpawn: { pos: { row: number; col: number }; type: TileType }[] = [];

    let turnBaseScore = 0;
    matchGroups.forEach(group => {
      group.forEach(m => allMatches.add(`${m.row},${m.col}`));
      
      // Points based on match length
      if (group.length === 3) turnBaseScore += 10;
      else if (group.length === 4) turnBaseScore += 25;
      else if (group.length >= 5) turnBaseScore += 50 + (group.length - 5) * 15;

      if (!skipBoosterSpawn) {
        if (group.length >= 5) {
          const pos = spawnPos && group.some(m => m.row === spawnPos.row && m.col === spawnPos.col) 
            ? spawnPos 
            : group[Math.floor(group.length / 2)];
          boostersToSpawn.push({ pos, type: 8 });
        } else if (group.length === 4) {
          const pos = spawnPos && group.some(m => m.row === spawnPos.row && m.col === spawnPos.col) 
            ? spawnPos 
            : group[Math.floor(group.length / 2)];
          boostersToSpawn.push({ pos, type: 7 });
        }
      }

      // Check for boosters already on the board that are part of this match
      group.forEach(({ row, col }) => {
        const tile = currentBoard[row][col];
        if (tile) {
          if (tile.type === 7) {
            const area = getExplosionArea(row, col);
            area.forEach(m => allMatches.add(`${m.row},${m.col}`));
          } else if (tile.type === 8) {
            for (let r = 0; r < GRID_SIZE; r++) {
              allMatches.add(`${r},${col}`);
              allMatches.add(`${row},${r}`);
            }
          }
        }
      });
    });

    const matchArray = Array.from(allMatches).map(s => {
      const [row, col] = s.split(',').map(Number);
      return { row, col };
    });

    // Add points for explosion tiles that weren't part of a direct match (5 points each)
    const directMatchCount = matchGroups.reduce((acc, g) => acc + g.length, 0);
    const explosionTileCount = matchArray.length - directMatchCount;
    turnBaseScore += Math.max(0, explosionTileCount) * 5;

    const matchedTypes: TileType[] = matchArray
      .map(({ row, col }) => currentBoard[row][col]?.type)
      .filter((t): t is TileType => t !== undefined);

    if (matchGroups.some(g => g.length >= 4)) {
      onPlaySFX(SFX.SPECIAL_MATCH);
    } else {
      onPlaySFX(SFX.MATCH);
    }

    setMatchingTiles(matchArray);
    onScoreUpdate(turnBaseScore, currentCombo, matchedTypes);
    onComboUpdate(currentCombo);

    // Trigger Particles
    const newBursts: ParticleBurst[] = matchArray.map(({ row, col }) => ({
      id: `${row}-${col}-${Date.now()}`,
      row,
      col,
      color: TILE_COLORS[currentBoard[row][col]?.type] || '#ffffff'
    }));
    setActiveParticles(prev => [...prev, ...newBursts]);

    // Cleanup particles after 1 second
    const burstIds = newBursts.map(b => b.id);
    setTimeout(() => {
      setActiveParticles(prev => prev.filter(p => !burstIds.includes(p.id)));
    }, 1000);
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const newBoard = [...currentBoard.map(row => [...row])];
    
    matchArray.forEach(({ row, col }) => {
      (newBoard[row][col] as any) = null;
    });

    boostersToSpawn.forEach(({ pos, type }) => {
      newBoard[pos.row][pos.col] = {
        id: generateId(),
        type: type,
        position: { row: pos.row, col: pos.col },
        isSpecial: true
      };
    });

    for (let c = 0; c < GRID_SIZE; c++) {
      let emptySlots = 0;
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (newBoard[r][c] === null) {
          emptySlots++;
        } else if (emptySlots > 0) {
          const tile = newBoard[r][c];
          newBoard[r + emptySlots][c] = {
            ...tile,
            position: { row: r + emptySlots, col: c }
          };
          (newBoard[r][c] as any) = null;
        }
      }
      
      for (let r = 0; r < emptySlots; r++) {
        newBoard[r][c] = {
          id: generateId(),
          type: Math.floor(Math.random() * 7) as TileType,
          position: { row: r, col: c }
        };
      }
    }

    setBoard(newBoard);
    setMatchingTiles([]);

    const nextMatches = checkMatches(newBoard);
    if (nextMatches.length > 0) {
      await processMatches(newBoard, nextMatches, currentCombo + 1);
    } else {
      setIsProcessing(false);
      setComboCount(0);
      resetHint();
    }
  };

  if (board.length === 0) return null;

  return (
    <div className="relative p-2 sm:p-3 md:p-4 bg-white/20 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl border border-white/30 w-full max-w-[min(94vw,560px,calc(100dvh-200px))] aspect-square mx-auto touch-none select-none">
      <BoardAtmosphere />
      
      {/* Particle Overlay */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {activeParticles.map(p => (
          <Particles 
            key={p.id}
            x={(p.col * (100 / GRID_SIZE)) + (100 / GRID_SIZE / 2) + '%'} 
            y={(p.row * (100 / GRID_SIZE)) + (100 / GRID_SIZE / 2) + '%'} 
            color={p.color} 
          />
        ))}
      </div>

      <div className="relative z-10 grid grid-cols-8 gap-1 sm:gap-1.5 h-full">
        {board.map((row, r) => 
          row.map((tile, c) => (
            <Tile
              key={tile.id}
              tile={tile}
              isSelected={selectedTile?.id === tile.id}
              onSelect={handleTileSelect}
              onSwipe={handleTileSwipe}
              isMatching={matchingTiles.some(m => m.row === r && m.col === c)}
              isHint={hintTiles?.some(h => h.row === r && h.col === c) || false}
            />
          ))
        )}
      </div>
    </div>
  );
});

export default GameBoard;
