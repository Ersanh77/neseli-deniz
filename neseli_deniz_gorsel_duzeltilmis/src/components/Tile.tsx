/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from 'react';
import { motion } from 'motion/react';
import { CREATURES, TileData } from '../types';

export type SwipeDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface TileProps {
  tile: TileData;
  isSelected: boolean;
  onSelect: (tile: TileData) => void;
  onSwipe: (tile: TileData, direction: SwipeDirection) => void;
  isMatching: boolean;
  isHint: boolean;
}

export default function Tile({ tile, isSelected, onSelect, onSwipe, isMatching, isHint }: TileProps) {
  const creature = CREATURES[tile.type];
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipedRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    swipedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current || swipedRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 22) {
      swipedRef.current = true;
      pointerStartRef.current = null;
      let direction: SwipeDirection;
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 'RIGHT' : 'LEFT';
      } else {
        direction = dy > 0 ? 'DOWN' : 'UP';
      }
      onSwipe(tile, direction);
    }
  };

  const handlePointerUp = () => {
    if (pointerStartRef.current && !swipedRef.current) {
      onSelect(tile);
    }
    pointerStartRef.current = null;
    swipedRef.current = false;
  };

  const handlePointerCancel = () => {
    pointerStartRef.current = null;
    swipedRef.current = false;
  };

  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isMatching ? 0 : isHint ? [1, 1.15, 1] : 1, 
        opacity: isMatching ? 0 : 1,
        y: 0,
        x: 0,
        rotate: isHint ? [0, -2, 0, 2, 0] : 0,
      }}
      transition={isHint ? { duration: 1.5, repeat: Infinity, times: [0, 0.1, 0.2, 0.3, 0.4] } : {}}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={`relative w-full aspect-square cursor-pointer rounded-lg sm:rounded-xl overflow-hidden transition-all duration-200 touch-none select-none ${
        isSelected ? 'ring-2 sm:ring-4 ring-yellow-400 z-10 shadow-lg scale-110' : 'bg-white/10 hover:bg-white/20'
      } ${tile.isSpecial ? 'shadow-[0_0_15px_rgba(255,255,0,0.6)]' : ''} ${isHint && !isSelected ? 'ring-2 ring-emerald-400/50 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : ''}`}
    >
      {creature.src === 'VORTEX_ICON' ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-900 overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-2xl sm:text-3xl md:text-4xl"
          >
            🌀
          </motion.div>
        </div>
      ) : (
        <img
          src={creature.src}
          alt={creature.name}
          className={`w-full h-full object-cover select-none pointer-events-none ${tile.isSpecial ? 'animate-pulse scale-110' : ''}`}
          referrerPolicy="no-referrer"
          draggable={false}
        />
      )}
      {tile.isSpecial && (
        <div className="absolute inset-0 bg-yellow-400/10 pointer-events-none animate-pulse" />
      )}
    </motion.div>
  );
}
