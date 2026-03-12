'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const GAME_DURATION = 30;

type MoleType = 'normal' | 'golden' | 'bomb' | 'fast' | 'frozen';

interface Mole {
  index: number;
  type: MoleType;
  points: number;
  emoji: string;
}

const MOLE_TYPES: Record<MoleType, { points: number; emoji: string; chance: number }> = {
  normal: { points: 1, emoji: '🐭', chance: 0.6 },
  golden: { points: 5, emoji: '👑', chance: 0.15 },
  bomb: { points: -3, emoji: '💣', chance: 0.1 },
  fast: { points: 2, emoji: '💨', chance: 0.1 },
  frozen: { points: 3, emoji: '❄️', chance: 0.05 },
};

export default function WhackAMole() {
  const [activeMole, setActiveMole] = useState<Mole | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hitMole, setHitMole] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);
  const [frozen, setFrozen] = useState(false);

  const highScore = getHighScore('whack-a-mole');

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setIsPlaying(true);
    setGameOver(false);
    setActiveMole(null);
    setCombo(0);
    setFrozen(false);
  }, []);

  // Mole popping logic
  useEffect(() => {
    if (!isPlaying) return;

    const showMole = () => {
      if (frozen) return; // Don't spawn new moles when frozen

      const index = Math.floor(Math.random() * 9);
      
      // Determine mole type based on chances
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

      // Speed increases based on score
      const baseSpeed = Math.max(400, 1000 - score * 30);
      const hideDelay = moleType === 'fast' ? 300 : Math.max(300, 800 - score * 20);

      setTimeout(() => {
        setActiveMole(null);
      }, hideDelay);
    };

    const interval = setInterval(showMole, Math.max(500, 1200 - score * 30));
    return () => clearInterval(interval);
  }, [isPlaying, score, frozen]);

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
    if (activeMole && index === activeMole.index) {
      const mole = activeMole;
      
      if (mole.type === 'bomb') {
        playSound('lose');
        setScore(prev => Math.max(0, prev + mole.points));
        setCombo(0);
      } else if (mole.type === 'frozen') {
        playSound('score');
        setFrozen(true);
        setTimeout(() => setFrozen(false), 3000);
        setScore(prev => prev + mole.points);
        setCombo(prev => prev + 1);
      } else {
        playSound('pop');
        const comboBonus = Math.min(combo, 5) * 0.5;
        setScore(prev => prev + mole.points + comboBonus);
        setCombo(prev => prev + 1);
      }
      
      setHitMole(index);
      setActiveMole(null);
      setTimeout(() => setHitMole(null), 200);
    }
  };

  return (
    <GameLayout title="Whack-a-Mole" emoji="🐭" score={score} highScore={highScore}>
      <div className="flex flex-col items-center">
        {/* Timer and Combo */}
        <div className="mb-4 flex items-center gap-4">
          <motion.div
            key={timeLeft}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`text-3xl font-bold px-6 py-2 rounded-full ${
              timeLeft <= 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-yellow-400 text-purple-900'
            }`}
          >
            ⏱️ {timeLeft}s
          </motion.div>
          {combo > 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-orange-500 text-white px-4 py-2 rounded-full font-bold"
            >
              🔥 {combo}x Combo!
            </motion.div>
          )}
          {frozen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-blue-400 text-white px-4 py-2 rounded-full font-bold"
            >
              ❄️ Frozen!
            </motion.div>
          )}
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[...Array(9)].map((_, index) => (
            <motion.button
              key={index}
              whileTap={{ scale: 0.9 }}
              onClick={() => whackMole(index)}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-b-8 border-amber-700 bg-amber-600 relative overflow-hidden shadow-lg"
            >
              {/* Hole */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-amber-900 rounded-t-full" />

              {/* Mole */}
              <AnimatePresence>
                {activeMole?.index === index && (
                  <motion.div
                    initial={{ y: 60 }}
                    animate={{ y: 0 }}
                    exit={{ y: 60 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={`absolute inset-0 flex items-center justify-center text-4xl sm:text-5xl ${
                      activeMole.type === 'golden' ? 'animate-pulse' : ''
                    } ${activeMole.type === 'bomb' ? 'animate-bounce' : ''}`}
                  >
                    {activeMole.emoji}
                  </motion.div>
                )}
                {hitMole === index && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center text-3xl"
                  >
                    {activeMole?.type === 'bomb' ? '💥' : `⭐+${activeMole?.points || 1}`}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>

        {/* Start Button */}
        {!isPlaying && !gameOver && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={startGame}
            className="mt-8 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg"
          >
            🎮 Start Game
          </motion.button>
        )}

        {/* Instructions */}
        <div className="mt-6 text-white/80 text-center text-sm">
          <p>Tap the moles as fast as you can!</p>
          <p>👑 Golden = 5pts | 💣 Bomb = -3pts | ❄️ Frozen = Slow mo!</p>
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
