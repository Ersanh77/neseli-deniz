/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import GameBoard from './components/GameBoard';
import { GameStatus, LeaderboardEntry, LevelProgress, CREATURES, TileType } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { LEVELS } from './utils/levels';
import { Trophy, Timer, Play, RotateCcw, Pause, HelpCircle, ChevronRight, Star, ListOrdered, ShoppingBag, Map as MapIcon, Check, Volume2, VolumeX, MessageCircle, Users } from 'lucide-react';
import Leaderboard from './components/Leaderboard';
import Shop from './components/Shop';
import LevelSelect from './components/LevelSelect';
import FriendsAndChatModal from './components/FriendsAndChatModal';
import { useRef } from 'react';
import { GameBoardRef } from './components/GameBoard';
import { useSound, SFX, BG_MUSIC } from './hooks/useSound';

export default function App() {
  const gameBoardRef = useRef<GameBoardRef>(null);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(() => {
    const saved = localStorage.getItem('sea-match-current-level');
    return saved ? Math.min(parseInt(saved), LEVELS.length - 1) : 0;
  });
  
  const currentLevel = LEVELS[currentLevelIdx];
  const [status, setStatus] = useState<GameStatus>('START');
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(currentLevel.moves);
  const [combo, setCombo] = useState(0);
  const [lastComboTime, setLastComboTime] = useState(0);
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('sea-match-coins');
    return saved ? parseInt(saved) : 0;
  });

  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('sea-match-muted');
    return saved === 'true';
  });

  const { playSound } = useSound(isMuted);
  const [bgMusicIdx, setBgMusicIdx] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const getMusicSource = () => {
    if (status === 'START' || status === 'LEVEL_SELECT') {
      return BG_MUSIC.MENU;
    }
    return BG_MUSIC.LEVELS[bgMusicIdx % BG_MUSIC.LEVELS.length];
  };

  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showFriendsAndChat, setShowFriendsAndChat] = useState(false);
  const [friendsChatInitialTab, setFriendsChatInitialTab] = useState<'chat' | 'friends'>('chat');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const saved = localStorage.getItem('sea-match-leaderboard');
    return saved ? JSON.parse(saved) : [];
  });
  const [playerName, setPlayerName] = useState('');
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [collections, setCollections] = useState<Record<number, number>>({});
  const [levelProgress, setLevelProgress] = useState<Record<number, LevelProgress>>(() => {
    const saved = localStorage.getItem('sea-match-progress');
    return saved ? JSON.parse(saved) : { 1: { levelId: 1, stars: 0, unlocked: true } };
  });

  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('sea-match-high-score');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem('sea-match-muted', isMuted.toString());
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(() => {
        console.log("Auto-play blocked by browser. Music will start on user interaction.");
      });
    }
  }, [status, isMuted, bgMusicIdx]);

  useEffect(() => {
    localStorage.setItem('sea-match-progress', JSON.stringify(levelProgress));
  }, [levelProgress]);

  useEffect(() => {
    const lastReward = localStorage.getItem('sea-match-last-reward');
    const today = new Date().toDateString();
    
    if (lastReward !== today) {
      setShowDailyReward(true);
    }
  }, []);

  const claimDailyReward = () => {
    const today = new Date().toDateString();
    localStorage.setItem('sea-match-last-reward', today);
    setCoins(prev => {
      const newTotal = prev + 100;
      localStorage.setItem('sea-match-coins', newTotal.toString());
      return newTotal;
    });
    setShowDailyReward(false);
  };

  const handlePurchase = (item: any) => {
    if (coins >= item.price) {
      const newBalance = coins - item.price;
      setCoins(newBalance);
      localStorage.setItem('sea-match-coins', newBalance.toString());

      // Apply booster effects
      if (item.id === 'EXTRA_MOVES') {
        setMovesLeft(prev => prev + 5);
      } else if (item.id === 'SHUFFLE') {
        gameBoardRef.current?.shuffle();
      } else if (item.id === 'SPAWN_STARFISH') {
        gameBoardRef.current?.spawnStarfish();
      }
      
      setShowShop(false);
    }
  };

  useEffect(() => {
    if (status === 'PLAYING') {
      const timer = setInterval(() => {
        if (Date.now() - lastComboTime > 1500 && combo > 0) {
          setCombo(0);
        }
      }, 100);
      return () => clearInterval(timer);
    }
  }, [status, combo, lastComboTime]);

  useEffect(() => {
    if (status === 'PLAYING') {
      // Check for win condition
      let isWin = false;
      if (currentLevel.goal.type === 'SCORE') {
        isWin = score >= currentLevel.goal.target;
      } else if (currentLevel.goal.type === 'COLLECT') {
        isWin = (currentLevel.goal.creaturesToCollect || []).every(
          goal => (collections[goal.type] || 0) >= goal.count
        );
      }

      if (isWin) {
        // Calculate bonus for remaining moves
        const moveBonus = movesLeft * 100;
        const coinBonus = movesLeft * 10;
        const finalScore = score + moveBonus;
        
        // Calculate stars based on final score/performance
        let stars = 1;
        const baseTarget = currentLevel.goal.type === 'SCORE' ? currentLevel.goal.target : 1500; // Fallback for collection levels
        if (finalScore >= baseTarget * 2) stars = 3;
        else if (finalScore >= baseTarget * 1.5) stars = 2;

        // Update progress
        const currentProgress = levelProgress[currentLevel.id] || { levelId: currentLevel.id, stars: 0, unlocked: true };
        const newStars = Math.max(currentProgress.stars, stars);
        
        const nextLevelId = currentLevel.id + 1;
        const newProgress = {
          ...levelProgress,
          [currentLevel.id]: { ...currentProgress, stars: newStars },
          [nextLevelId]: levelProgress[nextLevelId] || { levelId: nextLevelId, stars: 0, unlocked: true }
        };
        
        // Update state and persistence
        setLevelProgress(newProgress);
        setScore(finalScore);
        setCoins(prev => {
          const updated = prev + coinBonus;
          localStorage.setItem('sea-match-coins', updated.toString());
          return updated;
        });
        
        setStatus('LEVEL_WIN');
        
        const nextLevelIdx = currentLevelIdx + 1;
        if (nextLevelIdx < LEVELS.length) {
          localStorage.setItem('sea-match-current-level', nextLevelIdx.toString());
        }
      } else if (movesLeft <= 0) {
        // Check for lose condition
        const timer = setTimeout(() => {
          setStatus('GAME_OVER');
          
          // Check if qualifies for top 10
          const isTop10 = leaderboard.length < 10 || score > leaderboard[leaderboard.length - 1].score;
          if (isTop10 && score > 0) {
            setIsNewHighScore(true);
          }

          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('sea-match-high-score', score.toString());
          }
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [movesLeft, status, score, currentLevel, currentLevelIdx]);

  useEffect(() => {
    if (status === 'LEVEL_WIN') {
      playSound(SFX.WIN);
    } else if (status === 'GAME_OVER') {
      playSound(SFX.LOSE);
    }
  }, [status, playSound]);

  const startGame = () => {
    setScore(0);
    setMovesLeft(LEVELS[currentLevelIdx].moves);
    setCombo(0);
    setCollections({});
    setStatus('PLAYING');
    setBgMusicIdx(prev => prev + 1);
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(() => {});
    }
    playSound(SFX.CLICK);
  };

  const selectLevel = (levelId: number) => {
    const idx = LEVELS.findIndex(l => l.id === levelId);
    if (idx !== -1) {
      setCurrentLevelIdx(idx);
      setScore(0);
      setMovesLeft(LEVELS[idx].moves);
      setCombo(0);
      setCollections({});
      setStatus('PLAYING');
      setBgMusicIdx(prev => prev + 1);
      if (audioRef.current && !isMuted) {
        audioRef.current.play().catch(() => {});
      }
      playSound(SFX.CLICK);
    }
  };

  const nextLevel = () => {
    const nextIdx = Math.min(currentLevelIdx + 1, LEVELS.length - 1);
    setCurrentLevelIdx(nextIdx);
    setScore(0);
    setMovesLeft(LEVELS[nextIdx].moves);
    setCombo(0);
    setCollections({});
    setStatus('PLAYING');
    setBgMusicIdx(prev => prev + 1);
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(() => {});
    }
    playSound(SFX.CLICK);
  };

  const handleScoreUpdate = (points: number, multiplier: number, matchedTypes: TileType[]) => {
    setScore(prev => prev + (points * multiplier));
    
    // Update collections
    if (matchedTypes.length > 0) {
      setCollections(prev => {
        const next = { ...prev };
        matchedTypes.forEach(type => {
          next[type] = (next[type] || 0) + 1;
        });
        return next;
      });
    }
  };

  const handleComboUpdate = (newCombo: number) => {
    if (newCombo > 0) {
      setCombo(newCombo);
      setLastComboTime(Date.now());
    }
  };

  const handleMoveConsume = () => {
    setMovesLeft(prev => Math.max(0, prev - 1));
  };

  const saveScore = () => {
    if (!playerName.trim()) return;

    const newEntry: LeaderboardEntry = {
      name: playerName.trim(),
      score: score,
      level: currentLevel.id,
      date: new Date().toISOString()
    };

    const newLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setLeaderboard(newLeaderboard);
    localStorage.setItem('sea-match-leaderboard', JSON.stringify(newLeaderboard));
    setIsNewHighScore(false);
    setPlayerName('');
    setShowLeaderboard(true);
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-between py-2 px-2 sm:py-4 sm:px-4 font-sans overflow-x-hidden overflow-y-auto bg-slate-900 select-none">
      <audio 
        ref={audioRef}
        src={getMusicSource()}
        loop
        preload="auto"
      />
      {/* Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/images/underwater_bg_1790346820903.jpg"
          alt="Underwater background"
          className="w-full h-full object-cover opacity-60 scale-105 blur-[2px]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-transparent to-blue-900/60" />
      </div>

      {/* Game Content */}
      <main className="relative z-10 w-full max-w-2xl px-1 sm:px-4 flex flex-col items-center gap-2 sm:gap-4 my-auto">
        
        {/* Header HUD */}
        <header className="w-full bg-white/10 backdrop-blur-md p-2.5 sm:px-5 sm:py-3.5 rounded-2xl border border-white/20 shadow-xl flex flex-col gap-2">
          {/* Top Row: Level & Coins + Audio & Map */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-blue-600/70 border border-white/20 px-2.5 py-1 rounded-xl text-white font-black text-xs sm:text-sm tracking-wide">
                BÖLÜM {currentLevel.id}
              </div>
              <div className="flex items-center gap-1.5 bg-yellow-500/20 border border-yellow-400/30 px-2.5 py-1 rounded-xl text-yellow-300 font-bold text-xs sm:text-sm">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <span>{coins}</span>
              </div>
            </div>

            {/* Desktop / Tablet Goals display */}
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-xl">
              <span className="text-[11px] text-blue-200/80 font-bold uppercase tracking-wider">Hedef:</span>
              <div className="flex gap-2">
                {(currentLevel.goal.creaturesToCollect || []).map((goal) => {
                  const creature = CREATURES[goal.type];
                  const collected = collections[goal.type] || 0;
                  const isDone = collected >= goal.count;
                  return (
                    <div key={goal.type} className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-lg bg-white/10 p-0.5 relative flex-shrink-0">
                        <img src={creature.src} alt={creature.name} className="w-full h-full object-contain" />
                        {isDone && (
                          <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5">
                            <Check size={8} className="text-white" />
                          </div>
                        )}
                      </div>
                      <span className={`text-[11px] font-mono font-bold ${isDone ? 'text-emerald-400' : 'text-white'}`}>
                        {collected}/{goal.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Chat, Map & Audio */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button 
                onClick={() => {
                  setFriendsChatInitialTab('chat');
                  setShowFriendsAndChat(true);
                  playSound(SFX.CLICK);
                }}
                className="relative p-2 sm:p-2.5 bg-cyan-600/40 hover:bg-cyan-600/60 active:scale-95 rounded-xl text-cyan-200 hover:text-white transition-all flex items-center justify-center min-w-[38px] min-h-[38px] border border-cyan-400/30"
                title="Deniz Sohbeti ve Arkadaşlar"
              >
                <MessageCircle size={18} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
              </button>
              <button 
                onClick={() => setStatus('LEVEL_SELECT')}
                className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl text-white transition-all flex items-center justify-center min-w-[38px] min-h-[38px]"
                title="Bölüm Haritası"
              >
                <MapIcon size={18} />
              </button>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl text-white transition-all flex items-center justify-center min-w-[38px] min-h-[38px]"
                title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>
          </div>

          {/* Second Row: Mobile Goals + Moves & Score */}
          <div className="flex items-center justify-between border-t border-white/10 pt-2 gap-2">
            {/* Mobile Goals */}
            <div className="flex sm:hidden items-center gap-1 flex-wrap">
              <span className="text-[10px] text-blue-200/80 font-bold uppercase">Hedef:</span>
              <div className="flex gap-1.5 flex-wrap">
                {(currentLevel.goal.creaturesToCollect || []).map((goal) => {
                  const creature = CREATURES[goal.type];
                  const collected = collections[goal.type] || 0;
                  const isDone = collected >= goal.count;
                  return (
                    <div key={goal.type} className="flex items-center gap-1 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-lg">
                      <div className="w-5 h-5 rounded-md relative flex-shrink-0">
                        <img src={creature.src} alt={creature.name} className="w-full h-full object-contain" />
                        {isDone && (
                          <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5">
                            <Check size={6} className="text-white" />
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] font-mono font-bold leading-none ${isDone ? 'text-emerald-400' : 'text-white'}`}>
                        {collected}/{goal.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Score & Moves */}
            <div className="flex items-center gap-3 sm:gap-6 ml-auto">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-[10px] sm:text-xs uppercase tracking-wider text-blue-200/70 font-bold">Skor:</span>
                <span className="text-base sm:text-xl font-black text-white font-mono tabular-nums">{score}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 bg-white/10 px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl border border-white/15">
                <span className="text-[10px] sm:text-xs uppercase tracking-wider text-blue-200/80 font-bold">Hamle:</span>
                <span className={`text-base sm:text-xl font-black font-mono tabular-nums ${movesLeft < 5 ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
                  {movesLeft}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Game Area */}
        <div className="relative w-full flex flex-col items-center">
          <GameBoard 
            ref={gameBoardRef}
            onScoreUpdate={handleScoreUpdate} 
            onComboUpdate={handleComboUpdate}
            onMoveConsume={handleMoveConsume}
            isPaused={status !== 'PLAYING'} 
            onPlaySFX={playSound}
          />

          <AnimatePresence>
            {status === 'LEVEL_SELECT' && (
              <LevelSelect 
                levels={LEVELS}
                progress={levelProgress}
                onSelectLevel={selectLevel}
                onBack={() => setStatus('START')}
              />
            )}

            {showShop && (
              <Shop 
                coins={coins} 
                onPurchase={handlePurchase} 
                onClose={() => setShowShop(false)} 
              />
            )}

            {showLeaderboard && (
              <Leaderboard 
                entries={leaderboard} 
                onClose={() => setShowLeaderboard(false)} 
              />
            )}

            {showFriendsAndChat && (
              <FriendsAndChatModal
                coins={coins}
                onCoinsUpdate={(newCoins) => {
                  setCoins(newCoins);
                  localStorage.setItem('sea-match-coins', newCoins.toString());
                }}
                onClose={() => setShowFriendsAndChat(false)}
                onPlaySFX={playSound}
                initialTab={friendsChatInitialTab}
              />
            )}

            {showDailyReward && (
              <motion.div
                key="daily-reward-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-md p-4"
              >
                <motion.div
                  initial={{ scale: 0.8, y: 30 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400" />
                  
                  <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="relative">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-yellow-100 rounded-full scale-150 opacity-50"
                      />
                      <div className="relative bg-yellow-400 p-4 sm:p-6 rounded-full shadow-lg">
                        <Trophy size={40} className="text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-1">GÜNLÜK HEDİYE!</h2>
                  <p className="text-slate-600 text-xs sm:text-sm mb-6">Tekrar hoş geldin! Bugünün hediyesini hemen al.</p>
                  
                  <div className="bg-slate-100 rounded-2xl p-3 sm:p-4 mb-6 flex items-center justify-center gap-2">
                    <Star size={20} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-2xl sm:text-3xl font-black text-slate-800">100 DENİZ PARASI</span>
                  </div>
                  
                  <button
                    onClick={claimDailyReward}
                    className="w-full py-3.5 sm:py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg sm:text-xl rounded-2xl transition-all shadow-lg active:scale-95"
                  >
                    HEDİYEYİ AL
                  </button>
                </motion.div>
              </motion.div>
            )}

            {status === 'LEVEL_WIN' && (
              <motion.div
                key="level-win-screen"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-emerald-950/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 text-center"
              >
                <div className="relative mb-2">
                  <Star size={64} className="text-yellow-400 fill-yellow-400 animate-bounce" />
                  <Star size={28} className="absolute -top-2 -left-2 text-yellow-300 fill-yellow-300 animate-pulse" />
                  <Star size={28} className="absolute -bottom-2 -right-2 text-yellow-300 fill-yellow-300 animate-pulse" />
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white mb-1 uppercase italic tracking-tighter">BÖLÜM GEÇİLDİ!</h2>
                
                {/* Stars Display */}
                <div className="flex gap-1.5 mb-3 sm:mb-4">
                  {[1, 2, 3].map((s) => {
                    const baseTarget = 1500;
                    const threshold = s === 1 ? baseTarget : s === 2 ? baseTarget * 1.5 : baseTarget * 2;
                    const isEarned = score >= threshold;
                    return (
                      <motion.div
                        key={s}
                        initial={{ scale: 0 }}
                        animate={{ scale: isEarned ? 1 : 0.8 }}
                        transition={{ delay: 0.3 + s * 0.15, type: "spring" }}
                      >
                        <Star 
                          size={36} 
                          className={`${isEarned ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]' : 'text-white/20'}`} 
                        />
                      </motion.div>
                    );
                  })}
                </div>

                <div className="text-center mb-4 sm:mb-6">
                  <p className="text-emerald-200 text-xs sm:text-sm">Toplam Skor</p>
                  <p className="text-4xl sm:text-5xl font-black text-white font-mono tabular-nums mb-2">{score}</p>
                  
                  {movesLeft > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="bg-white/10 rounded-xl p-2.5 sm:p-3 border border-white/10 inline-block"
                    >
                      <p className="text-yellow-300 text-[10px] font-bold uppercase tracking-widest mb-0.5">Hamle Bonusu!</p>
                      <div className="flex justify-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-white font-black text-sm sm:text-base">+{movesLeft * 100}</span>
                          <span className="text-[9px] text-blue-200 uppercase">Puan</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-yellow-400 font-black text-sm sm:text-base">+{movesLeft * 10}</span>
                          <span className="text-[9px] text-blue-200 uppercase">Para</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                <button
                  onClick={nextLevel}
                  className="px-8 sm:px-10 py-3 sm:py-3.5 bg-white text-emerald-900 font-black text-base sm:text-lg rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center gap-2"
                >
                  SONRAKİ BÖLÜM
                  <ChevronRight size={20} />
                </button>
              </motion.div>
            )}

            {combo > 1 && (
              <motion.div
                key={combo}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1.1, y: -30 }}
                exit={{ opacity: 0, scale: 1.3 }}
                className="absolute top-2 right-2 z-30 pointer-events-none"
              >
                <div className="bg-yellow-400 text-blue-900 font-black px-3 py-1.5 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.6)] flex flex-col items-center">
                  <span className="text-[9px] uppercase tracking-tighter">KOMBO!</span>
                  <span className="text-xl sm:text-2xl leading-none">x{combo}</span>
                </div>
              </motion.div>
            )}
            
            {status === 'START' && (
              <motion.div
                key="start-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-blue-950/85 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-6 text-center"
              >
                <div className="max-w-xs sm:max-w-sm flex flex-col items-center gap-2 sm:gap-3 w-full">
                  <motion.div 
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="flex flex-col items-center"
                  >
                    <h3 className="text-blue-300 font-bold tracking-widest uppercase text-[11px] sm:text-xs">Deniz Altı Macerası</h3>
                    <h2 className="text-3xl sm:text-4xl font-black text-white drop-shadow-xl">BÖLÜM {currentLevel.id}</h2>
                  </motion.div>

                  {/* Target Creatures */}
                  <div className="bg-white/10 border border-white/15 px-3 py-2 rounded-2xl w-full flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">GÖREV: Toplanacak Canlılar</span>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {(currentLevel.goal.creaturesToCollect || []).map((goal) => {
                        const creature = CREATURES[goal.type];
                        return (
                          <div key={goal.type} className="flex items-center gap-1.5 bg-black/25 px-2 py-1 rounded-xl">
                            <img src={creature.src} alt={creature.name} className="w-5 h-5 object-contain" />
                            <span className="text-yellow-300 font-bold text-xs font-mono">{goal.count} adet</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={startGame}
                    className="w-full py-3 sm:py-3.5 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black text-base sm:text-lg rounded-2xl transition-all active:scale-95 shadow-[0_0_30px_rgba(250,204,21,0.5)] flex items-center justify-center gap-2"
                  >
                    <Play fill="currentColor" size={20} />
                    OYNA ({currentLevel.moves} HAMLE)
                  </button>

                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => setStatus('LEVEL_SELECT')}
                      className="flex-1 flex items-center justify-center gap-1 text-white bg-blue-600/60 hover:bg-blue-600 active:scale-95 py-2 px-2.5 rounded-xl transition-all font-bold uppercase text-[10px] sm:text-xs tracking-wider border border-white/10"
                    >
                      <MapIcon size={14} />
                      BÖLÜM
                    </button>

                    <button
                      onClick={() => {
                        setFriendsChatInitialTab('friends');
                        setShowFriendsAndChat(true);
                        playSound(SFX.CLICK);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 text-cyan-200 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/80 active:scale-95 py-2 px-2.5 rounded-xl transition-all font-bold uppercase text-[10px] sm:text-xs tracking-wider border border-cyan-500/30"
                    >
                      <Users size={14} className="text-cyan-400" />
                      ARKADAŞLAR
                    </button>

                    <button
                      onClick={() => setShowLeaderboard(true)}
                      className="flex-1 flex items-center justify-center gap-1 text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 active:scale-95 py-2 px-2.5 rounded-xl transition-all font-bold uppercase text-[10px] sm:text-xs tracking-wider border border-white/10"
                    >
                      <ListOrdered size={14} />
                      SKORLAR
                    </button>
                  </div>

                  {/* Cross-platform gameplay hints */}
                  <p className="text-[10px] text-blue-200/60">
                    Dokunarak veya kaydırarak (swipe) eşleştirin · PC: Yön tuşları veya fare
                  </p>
                </div>
              </motion.div>
            )}

            {status === 'GAME_OVER' && (
              <motion.div
                key="game-over-screen"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-blue-950/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 text-center"
              >
                <Trophy size={56} className="text-yellow-400 mb-2" />
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">HAMLELER BİTTİ!</h2>
                
                {isNewHighScore ? (
                  <div className="w-full max-w-xs text-center animate-in fade-in zoom-in duration-500">
                    <p className="text-yellow-400 font-black text-sm sm:text-base mb-2">YENİ REKOR! EN İYİ 10'A GİRDİN!</p>
                    <div className="bg-white/10 p-3 rounded-2xl border border-white/20 mb-4">
                       <p className="text-blue-200 text-xs mb-1.5 uppercase tracking-widest font-bold">İsmini Yaz</p>
                       <input 
                         type="text" 
                         value={playerName}
                         onChange={(e) => setPlayerName(e.target.value)}
                         placeholder="İsminiz..."
                         maxLength={15}
                         className="w-full bg-white text-blue-950 px-3 py-2 rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all text-center text-sm"
                       />
                    </div>
                    <button
                      onClick={saveScore}
                      disabled={!playerName.trim()}
                      className="w-full py-3 bg-yellow-400 text-blue-950 font-black text-base rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl mb-3 disabled:opacity-50 disabled:scale-100"
                    >
                      SKORU KAYDET
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-4 sm:mb-6">
                      <p className="text-blue-200 text-xs sm:text-sm">Toplam Skorun</p>
                      <p className="text-4xl sm:text-5xl font-black text-yellow-400 font-mono tabular-nums">{score}</p>
                    </div>
                    <button
                      onClick={startGame}
                      className="px-8 sm:px-10 py-3 sm:py-3.5 bg-white text-blue-950 font-black text-base sm:text-lg rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl mb-3"
                    >
                      <div className="flex items-center gap-2">
                        <RotateCcw size={20} />
                        TEKRAR OYNA
                      </div>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="flex items-center gap-1.5 text-blue-300 hover:text-white transition-colors font-bold uppercase text-[11px] tracking-widest"
                >
                  <ListOrdered size={14} />
                  LİDERLİK TABLOSUNU GÖR
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Controls */}
        <footer className="w-full flex items-center justify-center gap-2 sm:gap-3 pt-1">
          <button 
            onClick={() => setShowShop(true)}
            className="p-3 sm:p-3.5 bg-yellow-400 hover:bg-yellow-300 text-blue-950 rounded-2xl border border-yellow-500/30 transition-all active:scale-95 shadow-lg flex items-center gap-1.5 font-bold text-xs sm:text-sm min-w-[44px] min-h-[44px] justify-center"
            title="Deniz Mağazası"
          >
            <ShoppingBag size={20} />
            <span className="hidden sm:inline">MAĞAZA</span>
          </button>
          <button 
            onClick={() => {
              setFriendsChatInitialTab('chat');
              setShowFriendsAndChat(true);
              playSound(SFX.CLICK);
            }}
            className="relative p-3 sm:p-3.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-2xl border border-cyan-400/40 transition-all active:scale-95 shadow-lg flex items-center gap-1.5 font-black text-xs sm:text-sm min-w-[44px] min-h-[44px] justify-center"
            title="Sohbet ve Arkadaşlar"
          >
            <MessageCircle size={20} className="text-slate-950" />
            <span className="hidden sm:inline">SOHBET</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
          </button>
          <button 
            onClick={() => setStatus(status === 'PLAYING' ? 'START' : 'PLAYING')}
            className="p-3 sm:p-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/10 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title={status === 'PLAYING' ? "Duraklat" : "Devam Et"}
          >
            {status === 'PLAYING' ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button 
            onClick={startGame}
            className="p-3 sm:p-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/10 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Yeniden Başlat"
          >
            <RotateCcw size={20} />
          </button>
          <button 
            onClick={() => setStatus('LEVEL_SELECT')}
            className="p-3 sm:p-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/10 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Bölüm Haritası"
          >
            <MapIcon size={20} />
          </button>
        </footer>
      </main>

      {/* Decorative Bubbles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: '110vh', x: `${Math.random() * 100}vw`, opacity: Math.random() * 0.5 }}
            animate={{ 
              y: '-20vh',
              x: `${Math.random() * 100}vw`,
              opacity: [0, 0.3, 0]
            }}
            transition={{ 
              duration: 5 + Math.random() * 10, 
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: "linear"
            }}
            className="absolute w-2 h-2 bg-white rounded-full blur-[1px]"
            style={{ width: `${Math.random() * 10 + 2}px`, height: `${Math.random() * 10 + 2}px` }}
          />
        ))}
      </div>
    </div>
  );
}
