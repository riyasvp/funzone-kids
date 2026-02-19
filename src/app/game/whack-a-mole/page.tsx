'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const GAME_DURATION = 30;

export default function WhackAMole() {
  const [activeMole, setActiveMole] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hitMole, setHitMole] = useState<number | null>(null);

  const highScore = getHighScore('whack-a-mole');

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setIsPlaying(true);
    setGameOver(false);
    setActiveMole(null);
  }, []);

  // Mole popping logic
  useEffect(() => {
    if (!isPlaying) return;

    const showMole = () => {
      const newMole = Math.floor(Math.random() * 9);
      setActiveMole(newMole);

      // Speed increases based on score
      const speed = Math.max(400, 1000 - score * 30);
      const hideDelay = Math.max(300, 800 - score * 20);

      setTimeout(() => {
        setActiveMole(null);
      }, hideDelay);
    };

    const interval = setInterval(showMole, Math.max(500, 1200 - score * 30));
    return () => clearInterval(interval);
  }, [isPlaying, score]);

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
    if (index === activeMole && activeMole !== null) {
      playSound('pop');
      setScore(prev => prev + 1);
      setHitMole(index);
      setActiveMole(null);
      setTimeout(() => setHitMole(null), 200);
    }
  };

  return (
    <GameLayout title="Whack-a-Mole" emoji="🐭" score={score} highScore={highScore}>
      <div className="flex flex-col items-center">
        {/* Timer */}
        <div className="mb-4">
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
                {activeMole === index && (
                  <motion.div
                    initial={{ y: 60 }}
                    animate={{ y: 0 }}
                    exit={{ y: 60 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="absolute inset-0 flex items-center justify-center text-4xl sm:text-5xl"
                  >
                    🐭
                  </motion.div>
                )}
                {hitMole === index && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center text-3xl"
                  >
                    ⭐+1
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
          <p>Speed increases as you score more points!</p>
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
