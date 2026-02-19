'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const GRID_SIZE = 20;
const CELL_SIZE = 15;
const INITIAL_SPEED = 150;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

export default function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const directionRef = useRef(direction);

  const highScore = getHighScore('snake');

  const generateFood = useCallback((snakeBody: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snakeBody.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 10 });
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setIsPlaying(true);
  }, []);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    const currentDir = directionRef.current;
    switch (e.key) {
      case 'ArrowUp':
        if (currentDir !== 'DOWN') {
          setDirection('UP');
          directionRef.current = 'UP';
        }
        break;
      case 'ArrowDown':
        if (currentDir !== 'UP') {
          setDirection('DOWN');
          directionRef.current = 'DOWN';
        }
        break;
      case 'ArrowLeft':
        if (currentDir !== 'RIGHT') {
          setDirection('LEFT');
          directionRef.current = 'LEFT';
        }
        break;
      case 'ArrowRight':
        if (currentDir !== 'LEFT') {
          setDirection('RIGHT');
          directionRef.current = 'RIGHT';
        }
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        const currentDir = directionRef.current;

        switch (currentDir) {
          case 'UP':
            head.y -= 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
          case 'RIGHT':
            head.x += 1;
            break;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          playSound('lose');
          setGameOver(true);
          setIsPlaying(false);
          setHighScore('snake', score);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          playSound('lose');
          setGameOver(true);
          setIsPlaying(false);
          setHighScore('snake', score);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          playSound('score');
          setScore(prev => {
            const newScore = prev + 1;
            if (newScore % 5 === 0) {
              setSpeed(s => Math.max(50, s - 10));
            }
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [isPlaying, gameOver, food, speed, generateFood, score]);

  const handleControlClick = (dir: Direction) => {
    const currentDir = directionRef.current;
    if (
      (dir === 'UP' && currentDir !== 'DOWN') ||
      (dir === 'DOWN' && currentDir !== 'UP') ||
      (dir === 'LEFT' && currentDir !== 'RIGHT') ||
      (dir === 'RIGHT' && currentDir !== 'LEFT')
    ) {
      setDirection(dir);
      directionRef.current = dir;
      playSound('click');
    }
  };

  return (
    <GameLayout title="Snake" emoji="🐍" score={score} highScore={highScore}>
      <div className="flex flex-col items-center">
        {/* Game Canvas */}
        <div
          className="bg-green-800 rounded-lg border-4 border-green-600 shadow-lg"
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
            position: 'relative',
          }}
        >
          {/* Snake */}
          {snake.map((segment, index) => (
            <motion.div
              key={index}
              initial={false}
              animate={{
                x: segment.x * CELL_SIZE,
                y: segment.y * CELL_SIZE,
              }}
              transition={{ duration: 0.05 }}
              className={`absolute rounded-sm ${index === 0 ? 'bg-green-400' : 'bg-green-500'}`}
              style={{
                width: CELL_SIZE - 1,
                height: CELL_SIZE - 1,
              }}
            />
          ))}

          {/* Food */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="absolute text-center"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE,
              fontSize: CELL_SIZE - 2,
              lineHeight: `${CELL_SIZE}px`,
            }}
          >
            🍎
          </motion.div>

          {/* Start Screen */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={resetGame}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-xl shadow-lg"
              >
                🎮 Start Game
              </motion.button>
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          <div />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleControlClick('UP')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-xl text-2xl shadow-lg active:scale-95"
          >
            ⬆️
          </motion.button>
          <div />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleControlClick('LEFT')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-xl text-2xl shadow-lg active:scale-95"
          >
            ⬅️
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleControlClick('DOWN')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-xl text-2xl shadow-lg active:scale-95"
          >
            ⬇️
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleControlClick('RIGHT')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-xl text-2xl shadow-lg active:scale-95"
          >
            ➡️
          </motion.button>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-center text-sm">
          <p>Use Arrow Keys or Buttons to move</p>
          <p>Eat 🍎 to grow • Speed increases every 5 points!</p>
        </div>
      </div>

      <GameOverScreen
        show={gameOver}
        score={score}
        highScore={highScore}
        isNewHighScore={score > highScore && score > 0}
        onPlayAgain={resetGame}
      />
    </GameLayout>
  );
}
