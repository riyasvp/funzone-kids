'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const GAME_DURATION = 60;

type Bubble = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  isGold: boolean;
};

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

export default function BubblePop() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [popEffects, setPopEffects] = useState<{ id: number; x: number; y: number; points: number }[]>([]);
  const bubbleIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const highScore = getHighScore('bubble-pop');

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setBubbles([]);
    setIsPlaying(true);
    setGameOver(false);
    bubbleIdRef.current = 0;
  }, []);

  // Spawn bubbles
  useEffect(() => {
    if (!isPlaying) return;

    const spawnBubble = () => {
      const isGold = Math.random() < 0.1;
      const size = 40 + Math.random() * 30;
      const speed = 1 + Math.random() * 2 + score * 0.02;

      const newBubble: Bubble = {
        id: bubbleIdRef.current++,
        x: Math.random() * 80 + 10,
        y: 110,
        size,
        color: isGold ? '#FFD700' : COLORS[Math.floor(Math.random() * COLORS.length)],
        speed,
        isGold,
      };

      setBubbles(prev => [...prev, newBubble]);
    };

    const interval = setInterval(spawnBubble, Math.max(300, 800 - score * 5));
    return () => clearInterval(interval);
  }, [isPlaying, score]);

  // Move bubbles up
  useEffect(() => {
    if (!isPlaying) return;

    const moveBubbles = () => {
      setBubbles(prev =>
        prev
          .map(b => ({ ...b, y: b.y - b.speed * 0.5 }))
          .filter(b => b.y > -20)
      );
    };

    const interval = setInterval(moveBubbles, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Timer
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsPlaying(false);
          setGameOver(true);
          setHighScore('bubble-pop', score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, score]);

  const popBubble = (bubble: Bubble, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    playSound(bubble.isGold ? 'bonus' : 'pop');
    const points = bubble.isGold ? 5 : 1;
    setScore(prev => prev + points);
    setBubbles(prev => prev.filter(b => b.id !== bubble.id));

    // Get click position relative to container
    const rect = containerRef.current?.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (rect) {
      setPopEffects(prev => [
        ...prev,
        {
          id: Date.now(),
          x: clientX - rect.left,
          y: clientY - rect.top,
          points,
        },
      ]);
      setTimeout(() => {
        setPopEffects(prev => prev.filter(p => p.id !== Date.now()));
      }, 500);
    }
  };

  return (
    <GameLayout title="Bubble Pop" emoji="🫧" score={score} highScore={highScore}>
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

        {/* Game Area */}
        <div
          ref={containerRef}
          className="relative w-full max-w-md h-80 sm:h-96 bg-gradient-to-b from-blue-400 to-blue-600 rounded-2xl overflow-hidden border-4 border-blue-300 shadow-lg cursor-pointer"
        >
          {/* Background waves */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-blue-300/30" />

          {/* Bubbles */}
          <AnimatePresence>
            {bubbles.map(bubble => (
              <motion.button
                key={bubble.id}
                initial={{ scale: 0, y: bubble.y }}
                animate={{
                  y: `${bubble.y}%`,
                  x: `${bubble.x}%`,
                  scale: 1,
                }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={(e) => popBubble(bubble, e)}
                onTouchStart={(e) => popBubble(bubble, e)}
                className="absolute rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
                style={{
                  width: bubble.size,
                  height: bubble.size,
                  background: `radial-gradient(circle at 30% 30%, white, ${bubble.color})`,
                  left: `-${bubble.size / 2}px`,
                  border: bubble.isGold ? '3px solid #FFA500' : '2px solid rgba(255,255,255,0.5)',
                }}
              >
                {bubble.isGold && <span className="text-2xl">⭐</span>}
              </motion.button>
            ))}
          </AnimatePresence>

          {/* Pop effects */}
          <AnimatePresence>
            {popEffects.map(effect => (
              <motion.div
                key={effect.id}
                initial={{ opacity: 1, y: 0, scale: 0.5 }}
                animate={{ opacity: 0, y: -30, scale: 1.5 }}
                exit={{ opacity: 0 }}
                className="absolute pointer-events-none font-bold text-yellow-300 text-xl"
                style={{ left: effect.x, top: effect.y }}
              >
                +{effect.points}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Start Screen */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={startGame}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-xl shadow-lg"
              >
                🎮 Start Game
              </motion.button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-center text-sm">
          <p>Tap bubbles to pop them!</p>
          <p>⭐ Gold bubbles = +5 points!</p>
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
