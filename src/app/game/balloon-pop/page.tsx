'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const GAME_WIDTH = 320;
const GAME_HEIGHT = 400;

type Balloon = {
  id: number;
  x: number;
  y: number;
  color: string;
  points: number;
  speed: number;
};

const BALLOON_TYPES = [
  { color: '#FF6B6B', points: 1 },   // Red
  { color: '#4ECDC4', points: 2 },   // Teal
  { color: '#45B7D1', points: 2 },   // Blue
  { color: '#FFD700', points: 5 },   // Gold
  { color: '#333333', points: -99 }, // Bomb
];

export default function BalloonPop() {
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [popEffects, setPopEffects] = useState<{ id: number; x: number; y: number; points: number }[]>([]);
  const balloonIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const highScore = getHighScore('balloon-pop');

  const startGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setBalloons([]);
    setIsPlaying(true);
    setGameOver(false);
    balloonIdRef.current = 0;
  }, []);

  // Spawn balloons
  useEffect(() => {
    if (!isPlaying) return;

    const spawnBalloon = () => {
      const type = BALLOON_TYPES[Math.floor(Math.random() * BALLOON_TYPES.length)];
      const newBalloon: Balloon = {
        id: balloonIdRef.current++,
        x: Math.random() * (GAME_WIDTH - 50) + 25,
        y: GAME_HEIGHT + 50,
        color: type.color,
        points: type.points,
        speed: 1 + Math.random() * 1.5,
      };
      setBalloons(prev => [...prev, newBalloon]);
    };

    const interval = setInterval(spawnBalloon, Math.max(400, 1000 - score * 5));
    return () => clearInterval(interval);
  }, [isPlaying, score]);

  // Move balloons
  useEffect(() => {
    if (!isPlaying) return;

    const moveBalloons = () => {
      setBalloons(prev => {
        let missed = 0;
        const updated = prev
          .filter(b => {
            if (b.y < -50 && b.points > 0) {
              missed++;
              return false;
            }
            return true;
          })
          .map(b => ({ ...b, y: b.y - b.speed }));
        if (missed > 0) {
          setLives(l => {
            const newLives = l - missed;
            if (newLives <= 0) {
              setIsPlaying(false);
              setGameOver(true);
              setHighScore('balloon-pop', score);
            }
            return Math.max(0, newLives);
          });
        }
        return updated;
      });
    };

    const interval = setInterval(moveBalloons, 30);
    return () => clearInterval(interval);
  }, [isPlaying, score]);

  const popBalloon = (balloon: Balloon) => {
    if (balloon.points === -99) {
      // Bomb!
      playSound('lose');
      setIsPlaying(false);
      setGameOver(true);
      setHighScore('balloon-pop', score);
      return;
    }

    playSound(balloon.points >= 5 ? 'bonus' : 'pop');
    setScore(prev => prev + balloon.points);
    setBalloons(prev => prev.filter(b => b.id !== balloon.id));

    setPopEffects(prev => [
      ...prev,
      { id: balloon.id, x: balloon.x, y: balloon.y, points: balloon.points },
    ]);
    setTimeout(() => {
      setPopEffects(prev => prev.filter(e => e.id !== balloon.id));
    }, 500);
  };

  return (
    <GameLayout title="Balloon Pop" emoji="🎈" score={score} highScore={highScore} lives={lives}>
      <div className="flex flex-col items-center">
        {/* Game Area */}
        <div
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden border-4 border-sky-400 shadow-lg bg-gradient-to-b from-sky-300 to-sky-500"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
          {/* Clouds */}
          <div className="absolute top-4 left-4 text-4xl opacity-60">☁️</div>
          <div className="absolute top-12 right-8 text-3xl opacity-60">☁️</div>

          {/* Balloons */}
          <AnimatePresence>
            {balloons.map(balloon => (
              <motion.button
                key={balloon.id}
                initial={{ scale: 0, y: balloon.y }}
                animate={{ y: balloon.y, scale: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => popBalloon(balloon)}
                className="absolute rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
                style={{
                  width: balloon.points === -99 ? 35 : 45,
                  height: balloon.points === -99 ? 40 : 55,
                  left: balloon.x - 22,
                  top: balloon.y,
                  background: `radial-gradient(circle at 30% 30%, white, ${balloon.color})`,
                }}
              >
                {balloon.points === -99 ? (
                  <span className="text-2xl">💣</span>
                ) : balloon.points >= 5 ? (
                  <span className="text-lg">⭐</span>
                ) : null}
              </motion.button>
            ))}
          </AnimatePresence>

          {/* Pop Effects */}
          <AnimatePresence>
            {popEffects.map(effect => (
              <motion.div
                key={effect.id}
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 1.5, y: effect.y - 30 }}
                className="absolute font-bold text-yellow-300 text-xl pointer-events-none"
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
          <p>Pop balloons to score points!</p>
          <p>🟡 Gold = +5 | 💣 Bomb = Game Over!</p>
        </div>
      </div>

      <GameOverScreen
        show={gameOver}
        score={score}
        highScore={highScore}
        isNewHighScore={score > highScore && score > 0}
        onPlayAgain={startGame}
      />
    </GameLayout>
  );
}
