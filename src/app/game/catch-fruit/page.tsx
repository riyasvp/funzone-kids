'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const GAME_WIDTH = 300;
const GAME_HEIGHT = 400;
const BASKET_WIDTH = 60;
const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒'];

type Fruit = {
  id: number;
  x: number;
  y: number;
  emoji: string;
  speed: number;
};

export default function CatchFruit() {
  const [basketX, setBasketX] = useState(GAME_WIDTH / 2 - BASKET_WIDTH / 2);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(2);
  const fruitIdRef = useRef(0);
  const gameRef = useRef<HTMLDivElement>(null);

  const highScore = getHighScore('catch-fruit');

  const startGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setFruits([]);
    setBasketX(GAME_WIDTH / 2 - BASKET_WIDTH / 2);
    setSpeed(2);
    setIsPlaying(true);
    setGameOver(false);
    fruitIdRef.current = 0;
  }, []);

  // Keyboard controls
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setBasketX(prev => Math.max(0, prev - 20));
      } else if (e.key === 'ArrowRight') {
        setBasketX(prev => Math.min(GAME_WIDTH - BASKET_WIDTH, prev + 20));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // Touch/mouse controls
  const handleMove = useCallback((clientX: number) => {
    if (!isPlaying || !gameRef.current) return;
    const rect = gameRef.current.getBoundingClientRect();
    const x = clientX - rect.left - BASKET_WIDTH / 2;
    setBasketX(Math.max(0, Math.min(GAME_WIDTH - BASKET_WIDTH, x)));
  }, [isPlaying]);

  // Spawn fruits
  useEffect(() => {
    if (!isPlaying) return;

    const spawnFruit = () => {
      const newFruit: Fruit = {
        id: fruitIdRef.current++,
        x: Math.random() * (GAME_WIDTH - 30) + 15,
        y: 0,
        emoji: FRUITS[Math.floor(Math.random() * FRUITS.length)],
        speed: speed + Math.random(),
      };
      setFruits(prev => [...prev, newFruit]);
    };

    const interval = setInterval(spawnFruit, Math.max(500, 1500 - score * 20));
    return () => clearInterval(interval);
  }, [isPlaying, score, speed]);

  // Move fruits
  useEffect(() => {
    if (!isPlaying) return;

    const moveFruits = () => {
      setFruits(prev => {
        const updated: Fruit[] = [];
        let missed = 0;

        for (const fruit of prev) {
          const newY = fruit.y + fruit.speed;
          const basketTop = GAME_HEIGHT - 60;

          // Check if caught
          if (newY >= basketTop && newY <= basketTop + 30) {
            if (fruit.x >= basketX && fruit.x <= basketX + BASKET_WIDTH) {
              playSound('score');
              setScore(s => {
                const newScore = s + 1;
                if (newScore % 10 === 0) {
                  setSpeed(sp => sp + 0.5);
                }
                return newScore;
              });
              continue;
            }
          }

          // Check if missed
          if (newY > GAME_HEIGHT) {
            missed++;
            playSound('lose');
            continue;
          }

          updated.push({ ...fruit, y: newY });
        }

        if (missed > 0) {
          setLives(l => {
            const newLives = l - missed;
            if (newLives <= 0) {
              setIsPlaying(false);
              setGameOver(true);
              setHighScore('catch-fruit', score);
            }
            return Math.max(0, newLives);
          });
        }

        return updated;
      });
    };

    const interval = setInterval(moveFruits, 30);
    return () => clearInterval(interval);
  }, [isPlaying, basketX, score, speed]);

  const handleControl = (dir: 'left' | 'right') => {
    if (dir === 'left') {
      setBasketX(prev => Math.max(0, prev - 25));
    } else {
      setBasketX(prev => Math.min(GAME_WIDTH - BASKET_WIDTH, prev + 25));
    }
    playSound('click');
  };

  return (
    <GameLayout title="Catch the Fruit" emoji="🍎" score={score} highScore={highScore} lives={lives}>
      <div className="flex flex-col items-center">
        {/* Game Area */}
        <div
          ref={gameRef}
          className="relative rounded-2xl overflow-hidden border-4 border-green-600 shadow-lg bg-gradient-to-b from-sky-300 to-green-200"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          onMouseMove={(e) => handleMove(e.clientX)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        >
          {/* Clouds */}
          <div className="absolute top-4 left-4 text-4xl opacity-60">☁️</div>
          <div className="absolute top-8 right-6 text-3xl opacity-60">☁️</div>

          {/* Fruits */}
          {fruits.map(fruit => (
            <motion.div
              key={fruit.id}
              className="absolute text-3xl"
              style={{ left: fruit.x, top: fruit.y }}
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {fruit.emoji}
            </motion.div>
          ))}

          {/* Basket */}
          <motion.div
            className="absolute bottom-2 text-5xl"
            style={{ left: basketX, bottom: 5 }}
            animate={{ x: 0 }}
          >
            🧺
          </motion.div>

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

        {/* Mobile Controls */}
        <div className="mt-4 flex gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleControl('left')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-8 rounded-xl text-2xl shadow-lg"
          >
            ⬅️
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleControl('right')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-8 rounded-xl text-2xl shadow-lg"
          >
            ➡️
          </motion.button>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-center text-sm">
          <p>Move basket with Arrow Keys or Buttons</p>
          <p>Speed increases every 10 fruits!</p>
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
