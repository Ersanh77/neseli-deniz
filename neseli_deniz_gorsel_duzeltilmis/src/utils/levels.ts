/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LevelData, LevelGoal, TileType } from '../types';

export const generateLevels = (): LevelData[] => {
  const levels: LevelData[] = [];
  for (let i = 1; i <= 250; i++) {
    // Difficulty scaling
    const moves = Math.max(15, 30 - Math.floor(i / 10));
    
    // Every level is now a collection challenge
    const collectionCount = 1 + Math.floor(i / 40);
    const creaturesToCollect = [];
    const usedTypes = new Set<number>();
    
    for (let j = 0; j < collectionCount; j++) {
      let type: number;
      do {
        type = Math.floor(Math.random() * 7);
      } while (usedTypes.has(type));
      usedTypes.add(type);
      
      creaturesToCollect.push({
        type: type as TileType,
        count: 5 + Math.floor(i / 5) * 5
      });
    }

    const goal: LevelGoal = {
      type: 'COLLECT',
      target: 0,
      creaturesToCollect
    };
    
    levels.push({
      id: i,
      moves: moves,
      goal: goal
    });
  }
  return levels;
};

export const LEVELS = generateLevels();
