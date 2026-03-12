'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const GAME_DURATION = 30;

type MoleType = 'normal' | 'golden' | 'bomb' | 'fast' | 'frozen' | 'rainbow';

interface Mole {
  index: number;
  type: MoleType;
  points: number;
  emoji: string;
}

const MOLE_TYPES: Record<MoleType, { points: number; emoji: string; chance: number; color: string }> = {
  normal: { points: 1, emoji: '🐭', chance: 0.5, color: '#f59e0b' },
  golden: { points: 5, emoji: '👑', chance: 0.12, color: '#fbbf24' },
  bomb: { points: -5, emoji: '💣', chance: 0.08, color: '#ef4444' },
  fast: { points: 2, emoji: '💨', chance: 0.1, color: '#60a5fa' },
  frozen: { points: 3, emoji: '❄️', chance: 0.05, color: '#06b6d4' },
  rainbow: { points: 10, emoji: '🌈', chance: 0.05, color: '#c084fc' },
};

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
}

export default function WhackAMole() {
  const [activeMole, setActiveMole] = useState<Mole | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hitEffect, setHitEffect] = useState<Particle | null>(null);
  const [combo, setCombo] = useState(0);
  const [frozen, setFrozen] = useState(false);
  const [missedMole, setMissedMole] = useState(false);
  
  const moleRef = useRef<HTMLDivElement>(null);
  const highScore = getHighScore('whack-a-mole');

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setIsPlaying(true);
    setGameOver(false);
    setActiveMole(null);
    setCombo(0);
    setFrozen(false);
    setHitEffect(null);
  }, []);

  // Mole popping logic
  useEffect(() => {
    if (!isPlaying) return;

    const showMole = () => {
      if (frozen) return;

      const index = Math.floor(Math.random() * 9);
      
      const rand = Math.random();
      let cumulative = 0;
      let moleType: MoleType = 'normal';
      
      for (const [type, config] of Object.entries(MOLE_TYPES)) {
        cumulative += config.chance;
        if (rand <= cumulative) {
          moleType = type as MoleType;
          break;
        }
      }

      const moleConfig = MOLE_TYPES[moleType];
      setActiveMole({ index, type: moleType, points: moleConfig.points, emoji: moleConfig.emoji });

      const baseSpeed = Math.max(400, 1000 - score * 20);
      const hideDelay = moleType === 'fast' ? 300 : moleType === 'rainbow' ? 1500 : Math.max(400, 900 - score * 15);

      setTimeout(() => {
        if (activeMole?.index === index) {
          setActiveMole(null);
          setMissedMole(true);
          setTimeout(() => setMissedMole(false), 300);
        }
      }, hideDelay);
    };

    const interval = setInterval(showMole, Math.max(400, 1000 - score * 15));
    return () => clearInterval(interval);
  }, [isPlaying, score, frozen, activeMole?.index]);

  // Timer
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsPlaying(false);
          setGameOver(true);
          setHighScore('whack-a-mole', score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, score]);

  const whackMole = (index: number) => {
    if (!activeMole || index !== activeMole.index) return;
    
    const mole = activeMole;
    
    // Create hit effect position
    const row = Math.floor(index / 3);
    const col = index % 3;
    setHitEffect({
      id: Date.now(),
      x: col * 80 + 40,
      y: row * 80 + 40,
      color: MOLE_TYPES[mole.type].color,
    });
    setTimeout(() => setHitEffect(null), 300);
    
    if (mole.type === 'bomb') {
      playSound('explosion');
      setScore(prev => Math.max(0, prev + mole.points));
      setCombo(0);
      // Shake effect
      document.body.style.animation = 'shake 0.3s';
      setTimeout(() => document.body.style.animation = '', 300);
    } else if (mole.type === 'frozen') {
      playSound('powerup');
      setFrozen(true);
      setScore(prev => prev + mole.points);
      setCombo(prev => prev + 1);
      setTimeout(() => setFrozen(false), 3000);
    } else if (mole.type === 'rainbow') {
      playSound('bonus');
      const rainbowBonus = Math.floor(Math.random() * 10) + 1;
      setScore(prev => prev + mole.points + rainbowBonus);
      setCombo(prev => prev + 3);
    } else {
      playSound('pop');
      const comboBonus = Math.min(combo, 10) * 2;
      setScore(prev => prev + mole.points + comboBonus);
      setCombo(prev => prev + 1);
    }
    
    setActiveMole(null);
  };

  // Background color based on state
  const getBgColor = () => {
    if (frozen) return 'from-cyan-400 to-blue-500';
    if (missedMole) return 'from-red-400 to-orange-500';
    if (score > 50) return 'from-yellow-400 to-orange-500';
    return 'from-amber-500 to-yellow-400';
  };

  return (
    <GameLayout title="Whack-a-Mole" emoji="🐭" score={score} highScore={highScore}>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `}</style>
      
      <div className="flex flex-col items-center">
        {/* Timer and Stats */}
        <div className="mb-4 flex items-center gap-4 flex-wrap justify-center">
          <motion.div
            key={timeLeft}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`text-3xl font-bold px-6 py-2 rounded-2xl shadow-lg ${
              timeLeft <= 10 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                : `bg-gradient-to-r ${getBgColor()} text-purple-900`
            }`}
          >
            ⏱️ {timeLeft}s
          </motion.div>
          
          {combo > 1 && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg"
            >
              🔥 {combo}x Combo!
            </motion.div>
          )}
          
          {frozen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-pulse"
            >
              ❄️ FROZEN!
            </motion.div>
          )}
        </div>

        {/* Game Grid */}
        <div className="relative">
          {/* Hit effect particles */}
          <AnimatePresence>
            {hitEffect && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: hitEffect.x,
                  top: hitEffect.y,
                  width: 40,
                  height: 40,
                  backgroundColor: hitEffect.color,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}
          </AnimatePresence>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[...Array(9)].map((_, index) => (
              <motion.button
                key={index}
                whileTap={{ scale: 0.9 }}
                onClick={() => whackMole(index)}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-b-8 relative overflow-hidden shadow-xl transition-all ${
                  activeMole?.index === index 
                    ? 'border-amber-400 bg-amber-500' 
                    : 'border-amber-700 bg-amber-600'
                }`}
              >
                {/* Dirt/Hole */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-amber-900 rounded-t-2xl" />
                <div className="absolute bottom-2 left-2 right-2 h-6 bg-amber-950 rounded-full" />

                {/* Mole */}
                <AnimatePresence>
                  {activeMole?.index === index && (
                    <motion.div
                      initial={{ y: 80, rotate: -180 }}
                      animate={{ y: 0, rotate: 0 }}
                      exit={{ y: 80, rotate: 180 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <motion.div
                        animate={mole.type === 'rainbow' ? { 
                          backgroundColor: ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0000ff', '#7700ff'],
                        } : {}}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className={`relative text-4xl sm:text-5xl ${
                          mole.type === 'golden' ? 'animate-bounce' : ''
                        } ${mole.type === 'fast' ? 'animate-spin' : ''}`}
                        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
                      >
                        {mole.emoji}
                        {/* Shine effect */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white/50 rounded-full animate-ping" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hit feedback */}
                {hitEffect && activeMole?.index === index && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center text-4xl font-bold"
                    style={{ color: MOLE_TYPES[activeMole?.type || 'normal'].color }}
                  >
                    +{activeMole?.points}
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        {!isPlaying && !gameOver && (
          <motion.button
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            whileTap={{ scale: 0.9 }}
            onClick={startGame}
            className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-xl"
          >
            🎮 Start Game
          </motion.button>
        )}

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center text-xs text-white/80 bg-white/10 px-4 py-2 rounded-full">
          {Object.entries(MOLE_TYPES).map(([type, config]) => (
            <div key={type} className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
              <span>{config.emoji}</span>
              <span className="hidden sm:inline">{config.points > 0 ? `+${config.points}` : config.points}pts</span>
            </div>
          ))}
        </div>
      </div>

      <GameOverScreen
        show={gameOver}
        score={score}
        highScore={highScore}
        isNewHighScore={score > highScore && score > 0}
        onPlayAgain={startGame}
        message="Time's Up!"
      />
    </GameLayout>
  );
}
