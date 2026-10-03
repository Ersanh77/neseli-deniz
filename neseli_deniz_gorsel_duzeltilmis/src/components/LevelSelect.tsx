/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Star, Lock, ChevronLeft, Map as MapIcon, Waves } from 'lucide-react';
import { LevelData, LevelProgress } from '../types';

interface LevelSelectProps {
  levels: LevelData[];
  progress: Record<number, LevelProgress>;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

export default function LevelSelect({ levels, progress, onSelectLevel, onBack }: LevelSelectProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-blue-900 overflow-hidden flex flex-col"
    >
      {/* Ocean Background Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <Waves className="absolute top-10 left-10 text-blue-300 w-32 h-32 animate-pulse" />
        <Waves className="absolute bottom-20 right-20 text-blue-300 w-48 h-48 animate-pulse delay-700" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-blue-950/60 backdrop-blur-md border-b border-white/10">
        <button 
          onClick={onBack}
          className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl sm:rounded-2xl text-white transition-all flex items-center gap-1.5 sm:gap-2 font-black uppercase text-xs sm:text-sm tracking-wider"
        >
          <ChevronLeft size={18} />
          GERİ
        </button>
        <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
          <MapIcon className="text-yellow-400 w-5 h-5 sm:w-6 sm:h-6" />
          DENİZ HARİTASI
        </h2>
        <div className="w-12 sm:w-20" /> {/* Spacer */}
      </div>

      {/* Map Path */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:p-8 relative overscroll-contain">
        <div className="max-w-xl mx-auto relative flex flex-col items-center">
          {/* Decorative Path Line */}
          <div className="absolute top-0 bottom-0 w-2 bg-white/5 rounded-full left-1/2 -translate-x-1/2" />
          
          {levels.map((level, index) => {
            const levelProgress = progress[level.id] || { levelId: level.id, stars: 0, unlocked: index === 0 };
            const isUnlocked = levelProgress.unlocked;
            
            // Adaptive zig-zag position
            const xOffset = index % 2 === 0 ? '25px' : '-25px';

            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.4) }}
                className="relative mb-10 sm:mb-14 w-full flex justify-center"
              >
                <div 
                  className="relative group"
                  style={{ transform: `translateX(${xOffset})` }}
                >
                  <button
                    disabled={!isUnlocked}
                    onClick={() => onSelectLevel(level.id)}
                    className={`
                      w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all relative z-10
                      ${isUnlocked 
                        ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-xl hover:scale-105 active:scale-95 border-3 sm:border-4 border-white' 
                        : 'bg-slate-700/50 grayscale border-3 sm:border-4 border-slate-600 cursor-not-allowed opacity-50'}
                    `}
                  >
                    {!isUnlocked ? (
                      <Lock className="text-slate-400" size={26} />
                    ) : (
                      <>
                        <span className="text-xl sm:text-2xl font-black text-white">{level.id}</span>
                        <div className="flex gap-0.5 mt-0.5 sm:mt-1">
                          {[1, 2, 3].map((s) => (
                            <Star 
                              key={s} 
                              size={11} 
                              className={`${s <= levelProgress.stars ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}`} 
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </button>
                  
                  {/* Tooltip / Goal */}
                  {isUnlocked && (
                    <div className="absolute -top-9 sm:-top-11 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-blue-900 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black whitespace-nowrap shadow-lg pointer-events-none uppercase">
                      HEDEF: Canlıları Topla
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-6 bg-blue-950/80 backdrop-blur-xl text-center border-t border-white/10">
        <p className="text-blue-300/60 text-xs font-bold uppercase tracking-widest">
          Yeni bölümlerin kilidini açmak için mevcut bölümleri tamamla!
        </p>
      </div>
    </motion.div>
  );
}
