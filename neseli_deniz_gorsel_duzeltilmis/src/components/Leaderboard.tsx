/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Trophy, X, Star, Calendar } from 'lucide-react';
import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onClose: () => void;
}

export default function Leaderboard({ entries, onClose }: LeaderboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/90 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Trophy className="text-yellow-400 w-6 h-6 sm:w-8 sm:h-8" />
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">EN İYİ 10</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 active:scale-95 rounded-full transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* List */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 overscroll-contain">
          {entries.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p>Henüz kayıtlı skor yok.</p>
              <p className="text-sm">İlk sen ol!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={`${entry.date}-${entry.score}`}
                  className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border ${
                    index === 0 
                      ? 'bg-yellow-50 border-yellow-200 shadow-sm' 
                      : index === 1 
                      ? 'bg-slate-50 border-slate-200'
                      : index === 2
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center font-black rounded-full text-xs sm:text-sm ${
                      index === 0 ? 'bg-yellow-400 text-white' :
                      index === 1 ? 'bg-slate-300 text-white' :
                      index === 2 ? 'bg-orange-400 text-white' :
                      'text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 text-sm sm:text-base">{entry.name}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-semibold">
                        <Calendar size={10} />
                        {new Date(entry.date).toLocaleDateString('tr-TR')}
                        <span className="mx-0.5">•</span>
                        <span>Bölüm {entry.level}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end text-blue-600 font-black text-base sm:text-lg">
                      {entry.score.toLocaleString()}
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">PUAN</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 sm:p-5 bg-slate-50 text-center border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-400 font-medium">
            Skorlar bu cihazda yerel olarak saklanmaktadır.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
